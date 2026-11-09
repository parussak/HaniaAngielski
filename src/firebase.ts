import {initializeApp} from 'firebase/app';
import {getAuth,browserLocalPersistence,setPersistence,signInWithEmailAndPassword,createUserWithEmailAndPassword,sendPasswordResetEmail,signOut,type User} from 'firebase/auth';
import {getFirestore,doc,getDocFromServer,runTransaction,serverTimestamp} from 'firebase/firestore';
import {firebaseConfig} from './firebase-config.ts';
import {backup,validateBackup,type Progress} from './core.ts';
import {SyncConflict,type RemoteProgress} from './sync.ts';

const app=initializeApp(firebaseConfig);
const auth=getAuth(app);auth.languageCode='pl';
const db=getFirestore(app);
export type AccountUser=Pick<User,'uid'|'email'>;
export async function restoreUser(): Promise<AccountUser | null> { await auth.authStateReady();return auth.currentUser; }
export async function login(email:string,password:string,register=false): Promise<AccountUser> {
  await setPersistence(auth,browserLocalPersistence);
  return (await (register?createUserWithEmailAndPassword:signInWithEmailAndPassword)(auth,email,password)).user;
}
export async function logout() { await signOut(auth); }
export async function resetPassword(email:string) { await sendPasswordResetEmail(auth,email); }
const reference=(uid:string)=>doc(db,'users',uid,'progress','main');
function decode(data: any): RemoteProgress {
  if(data?.format!==1 || !Number.isSafeInteger(data.revision) || data.revision<1 || typeof data.payload!=='string')throw new Error('Nieobsługiwany zapis na koncie. Lokalna kopia pozostała bez zmian.');
  return {revision:data.revision,progress:validateBackup(JSON.parse(data.payload)).progress};
}
async function requireUser(uid:string){await auth.authStateReady();if(auth.currentUser?.uid!==uid)throw new Error('Zaloguj się ponownie, aby zsynchronizować wyniki konta.');}
export async function fetchProgress(uid:string) {
  await requireUser(uid);
  const snapshot=await getDocFromServer(reference(uid));return snapshot.exists()?decode(snapshot.data()):null;
}
export async function pushProgress(uid:string,progress:Progress,expectedRevision:number): Promise<RemoteProgress> {
  await requireUser(uid);
  const payload=JSON.stringify(backup(progress));
  if(new TextEncoder().encode(payload).length>700000)throw new Error('Historia jest za duża do pojedynczego zapisu w chmurze. Zapis lokalny działa; pobierz kopię postępów.');
  return runTransaction(db,async transaction=>{
    const ref=reference(uid),snapshot=await transaction.get(ref);
    const remote=snapshot.exists()?decode(snapshot.data()):null;
    if((remote?.revision??0)!==expectedRevision)throw new SyncConflict(remote);
    const revision=expectedRevision+1;
    transaction.set(ref,{format:1,revision,payload,updatedAt:serverTimestamp()});
    return {revision,progress};
  });
}
export {firebaseMessage} from './firebase-errors.ts';
