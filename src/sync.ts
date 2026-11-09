import {backup,emptyProgress,validateBackup,type Progress} from './core.ts';

export interface RemoteProgress { revision: number; progress: Progress }
export interface AccountCache {
  version: 1; progress: Progress; revision: number | null; dirty: boolean;
  localVersion: number; lastSync: string | null; recovery: Progress | null;
}
export interface SyncPorts {
  read(uid: string): Promise<AccountCache | undefined>;
  save(uid: string, cache: AccountCache): Promise<void>;
  fetch(uid: string): Promise<RemoteProgress | null>;
  push(uid: string, progress: Progress, expectedRevision: number): Promise<RemoteProgress>;
}
export class SyncConflict extends Error {
  remote: RemoteProgress | null;
  constructor(remote: RemoteProgress | null) { super('Wyniki na koncie zmieniły się na innym urządzeniu.');this.remote=remote; }
}
export function hasProgress(p: Progress) { return !!(p.active || p.sessions.length || p.difficult.length || Object.keys(p.words).length); }
const checked=(p: Progress)=>validateBackup(backup(p)).progress;
export function validateCache(cache: AccountCache): AccountCache {
  if(cache.version!==1 || !(cache.revision===null || (Number.isSafeInteger(cache.revision)&&cache.revision>=0)) || typeof cache.dirty!=='boolean' || !Number.isSafeInteger(cache.localVersion) || cache.localVersion<0 || !(cache.lastSync===null || (typeof cache.lastSync==='string' && Number.isFinite(Date.parse(cache.lastSync)))))throw new Error('Nie można odczytać lokalnych danych konta. Zapis gościa pozostał bez zmian.');
  return {...cache,progress:checked(cache.progress),recovery:cache.recovery?checked(cache.recovery):null};
}

// Całe postępy są wersjonowanym zapisem. Transakcja po stronie serwera nie pozwala
// starszemu urządzeniu nadpisać nowej wersji. Konflikt rozstrzyga użytkownik.
export class ProgressSync {
  uid: string | null=null;
  cache: AccountCache | null=null;
  conflict: {remote: RemoteProgress | null} | null=null;
  status: 'local'|'checking'|'saved'|'pending'|'conflict'|'error'='local';
  error: unknown=null;
  offerGuest=false;
  private epoch=0;
  private queue: Promise<unknown>=Promise.resolve();
  private flight: Promise<void> | null=null;
  private ports: SyncPorts;
  private changed: (progressChanged: boolean)=>void;
  constructor(ports: SyncPorts,changed: (progressChanged: boolean)=>void=()=>{}) {this.ports=ports;this.changed=changed;}
  private serial<T>(task:()=>Promise<T>): Promise<T> {
    const operation=this.queue.then(task);this.queue=operation.catch(()=>{});return operation;
  }
  async connect(uid: string, guest: Progress) {
    const epoch=++this.epoch;
    await this.serial(async()=>{
      const stored=await this.ports.read(uid);
      if(epoch!==this.epoch)return;
      this.uid=uid;this.conflict=null;this.error=null;
      this.cache=stored?validateCache(stored):{version:1,progress:emptyProgress(),revision:null,dirty:false,localVersion:0,lastSync:null,recovery:null};
      this.offerGuest=!stored&&hasProgress(guest);
      this.status='checking';this.changed(true);
    });
  }
  async disconnect() {
    ++this.epoch;
    await this.serial(async()=>{
      this.uid=null;this.cache=null;this.conflict=null;this.offerGuest=false;this.status='local';this.error=null;this.changed(false);
    });
  }
  async save(progress: Progress) {
    const epoch=this.epoch;
    await this.serial(async()=>{
      if(epoch!==this.epoch || !this.uid || !this.cache)throw new Error('Konto się zmieniło. Spróbuj ponownie.');
      const next={...this.cache,progress:checked(progress),dirty:true,localVersion:this.cache.localVersion+1};
      await this.ports.save(this.uid,next);this.cache=next;
      this.status=this.conflict?'conflict':'pending';this.changed(false);
    });
  }
  async useGuest(guest: Progress) {
    const epoch=this.epoch;
    await this.serial(async()=>{
      if(epoch!==this.epoch || !this.uid || !this.cache)return;
      const next={...this.cache,recovery:structuredClone(this.cache.progress),progress:checked(guest),dirty:true,localVersion:this.cache.localVersion+1};
      await this.ports.save(this.uid,next);this.cache=next;this.offerGuest=false;this.status='pending';this.changed(true);
    });
  }
  dismissGuest() { this.offerGuest=false;this.changed(false); }
  sync(): Promise<void> {
    if(this.flight)return this.flight;
    this.flight=this.performSync().finally(()=>{this.flight=null;});return this.flight;
  }
  private async performSync() {
    const uid=this.uid,epoch=this.epoch;
    const snapshot=await this.serial(async()=>this.cache?structuredClone(this.cache):null);
    if(!uid || !snapshot || this.conflict || epoch!==this.epoch)return;
    this.status='checking';this.error=null;this.changed(false);
    try {
      const remote=await this.ports.fetch(uid);
      if(epoch!==this.epoch)return;
      const revision=remote?.revision??0;
      if(snapshot.dirty){
        // Pozwala potwierdzić zapis, którego potwierdzenie zaginęło po drodze.
        if(remote && JSON.stringify(remote.progress)===JSON.stringify(snapshot.progress)){
          await this.acknowledge(epoch,snapshot,remote.revision);return;
        }
        if((snapshot.revision??0)!==revision)throw new SyncConflict(remote);
        const written=await this.ports.push(uid,snapshot.progress,revision);
        if(epoch!==this.epoch)return;
        await this.acknowledge(epoch,snapshot,written.revision);
      }else{
        await this.serial(async()=>{
          if(epoch!==this.epoch || !this.cache || this.cache.localVersion!==snapshot.localVersion || this.cache.dirty)return;
          if(!remote && snapshot.revision && hasProgress(snapshot.progress))throw new SyncConflict(null);
          const next={...this.cache,progress:remote?checked(remote.progress):this.cache.progress,revision,lastSync:new Date().toISOString()};
          await this.ports.save(uid,next);
          const different=JSON.stringify(next.progress)!==JSON.stringify(this.cache.progress);
          this.cache=next;this.status='saved';this.changed(different);
        });
        if(this.cache?.dirty)this.status='pending';
      }
    }catch(error){
      if(epoch!==this.epoch)return;
      if(error instanceof SyncConflict){this.conflict={remote:error.remote};this.status='conflict';}
      else {this.status='error';this.error=error;}
      this.changed(false);
    }
  }
  private async acknowledge(epoch:number,snapshot:AccountCache,revision:number) {
    await this.serial(async()=>{
      if(epoch!==this.epoch || !this.uid || !this.cache)return;
      const next={...this.cache,revision,dirty:this.cache.localVersion!==snapshot.localVersion,lastSync:new Date().toISOString()};
      await this.ports.save(this.uid,next);this.cache=next;this.status=next.dirty?'pending':'saved';this.changed(false);
    });
  }
  async resolve(choice: 'local'|'cloud') {
    const epoch=this.epoch;
    await this.serial(async()=>{
      if(!this.uid || !this.cache || !this.conflict)return;
      const remote=this.conflict.remote;
      const next={...this.cache,recovery:structuredClone(choice==='cloud'?this.cache.progress:remote?.progress??emptyProgress()),progress:choice==='cloud'?checked(remote?.progress??emptyProgress()):this.cache.progress,revision:remote?.revision??0,dirty:choice==='local',localVersion:this.cache.localVersion+1};
      await this.ports.save(this.uid,next);
      if(epoch!==this.epoch)return;
      this.cache=next;this.conflict=null;this.status=next.dirty?'pending':'saved';this.changed(true);
    });
    await this.sync();
  }
}
