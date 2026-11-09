import {initializeApp} from 'firebase/app';
import {getAuth,browserLocalPersistence,setPersistence,signInWithEmailAndPassword,createUserWithEmailAndPassword,sendPasswordResetEmail,signOut,updateProfile,updatePassword,verifyBeforeUpdateEmail,EmailAuthProvider,reauthenticateWithCredential,reload,type User} from 'firebase/auth';
import {cleanName} from './profile.ts';
import {getFirestore,doc,getDocFromServer,runTransaction,serverTimestamp} from 'firebase/firestore';
import {firebaseConfig} from './firebase-config.ts';
import {backup,validateBackup,type Progress} from './core.ts';
import {SyncConflict,type RemoteProgress} from './sync.ts';
import {checkPage,byteSize,publishHistory,type HistoryPage} from './history.ts';
import {localHistoryPage,putHistoryPage} from './storage.ts';

const app=initializeApp(firebaseConfig);
const auth=getAuth(app);auth.languageCode='pl';
const db=getFirestore(app);
export type AccountUser=Pick<User,'uid'|'email'> & {displayName?:string|null};
export async function restoreUser(): Promise<AccountUser | null> { await auth.authStateReady();if(auth.currentUser)await reload(auth.currentUser);return auth.currentUser; }
export async function login(email:string,password:string,register=false,name=''): Promise<AccountUser> {
  const displayName=register?cleanName(name):null;
  await setPersistence(auth,browserLocalPersistence);
  const user=(await (register?createUserWithEmailAndPassword:signInWithEmailAndPassword)(auth,email,password)).user;
  if(displayName)await updateProfile(user,{displayName});
  return user;
}
export async function logout() { await signOut(auth); }
export async function resetPassword(email:string) { await sendPasswordResetEmail(auth,email); }
async function currentUser(expectedUid:string){await auth.authStateReady();if(!auth.currentUser || auth.currentUser.uid!==expectedUid)throw new Error('Konto się zmieniło. Zaloguj się ponownie, aby zmienić ustawienia.');return auth.currentUser;}
async function reauthenticate(password:string,expectedUid:string){
  const user=await currentUser(expectedUid);await reload(user);
  if(!user.email)throw new Error('Nie można potwierdzić adresu konta. Zaloguj się ponownie.');
  await reauthenticateWithCredential(user,EmailAuthProvider.credential(user.email,password));return user;
}
export async function changeName(name:string,uid:string):Promise<AccountUser>{const displayName=cleanName(name),user=await currentUser(uid);await updateProfile(user,{displayName});return user;}
export async function changeEmail(email:string,password:string,uid:string){
  const user=await reauthenticate(password,uid);
  if(user.email?.toLowerCase()===email.trim().toLowerCase())throw new Error('Wpisz inny adres e-mail niż obecny.');
  await verifyBeforeUpdateEmail(user,email.trim());
}
export async function changePassword(password:string,nextPassword:string,uid:string){
  if(nextPassword.length<8)throw new Error('Nowe hasło musi mieć co najmniej 8 znaków.');
  if(password===nextPassword)throw new Error('Nowe hasło musi różnić się od obecnego.');
  const user=await reauthenticate(password,uid);await updatePassword(user,nextPassword);
}
const reference=(uid:string)=>doc(db,'users',uid,'progress','main');
const historyReference=(uid:string,id:string)=>doc(db,'users',uid,'history',id);
export async function fetchHistoryPage(uid:string,id:string):Promise<HistoryPage>{
  await requireUser(uid);
  if(!/^[a-f0-9]{64}$/.test(id))throw new Error('Niepoprawny identyfikator historii.');
  const cached=await localHistoryPage(id);if(cached)return checkPage(cached);
  const snapshot=await getDocFromServer(historyReference(uid,id));
  if(!snapshot.exists())throw new Error('Nie można pobrać starszej historii. Sprawdź połączenie i reguły Firebase.');
  const data=snapshot.data();if(data.format!==1||typeof data.payload!=='string')throw new Error('Niepoprawna część historii.');
  const page=await checkPage(JSON.parse(data.payload) as HistoryPage);if(page.id!==id)throw new Error('Niepoprawna część historii.');
  await putHistoryPage(page);return page;
}
async function uploadHistory(uid:string,head:string|null|undefined,remoteHead:string|null|undefined){
  // Oldest first; the main CAS is committed only once ALL pages exist remotely.
  await publishHistory(head,remoteHead,async id=>await localHistoryPage(id)??await fetchHistoryPage(uid,id),async page=>{
    await requireUser(uid);const payload=JSON.stringify(page);if(byteSize(page)>200000)throw new Error('Zbyt duża część historii.');
    await runTransaction(db,async tx=>{const ref=historyReference(uid,page.id),old=await tx.get(ref);
      if(old.exists()){if(old.data().payload!==payload)throw new Error('Niezgodna część historii.');return;}
      tx.set(ref,{format:1,payload,createdAt:serverTimestamp()});
    });
  });
}
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
  const before=await getDocFromServer(reference(uid));
  const base=before.exists()?decode(before.data()):null;
  if((base?.revision??0)!==expectedRevision)throw new SyncConflict(base);
  await uploadHistory(uid,progress.history?.head,base?.progress.history?.head);
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
