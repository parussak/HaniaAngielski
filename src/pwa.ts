interface InstallPrompt extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{outcome:'accepted'|'dismissed'}>;
}
export const pwa={
  ready:false,preparing:false,failed:false,updateAvailable:false,
  installed:window.matchMedia('(display-mode: standalone)').matches,
  canInstall:false,online:navigator.onLine,
};
let changed=()=>{};
let registration:ServiceWorkerRegistration|undefined;
let installPrompt:InstallPrompt|undefined;
let applying=false;
const notify=()=>changed();
window.addEventListener('beforeinstallprompt',event=>{
  event.preventDefault();installPrompt=event as InstallPrompt;pwa.canInstall=true;notify();
});
window.addEventListener('appinstalled',()=>{installPrompt=undefined;pwa.installed=true;pwa.canInstall=false;notify();});
window.addEventListener('online',()=>{pwa.online=true;notify();});
window.addEventListener('offline',()=>{pwa.online=false;notify();});
function watch(worker:ServiceWorker){
  const update=()=>{
    if(worker.state==='installed' && registration?.active)pwa.updateAvailable=true;
    if(worker.state==='activated'){pwa.ready=true;pwa.preparing=false;pwa.failed=false;}
    if(worker.state==='redundant' && !registration?.active){pwa.preparing=false;pwa.failed=true;}
    notify();
  };
  worker.addEventListener('statechange',update);update();
}
export async function prepareOffline(){
  if(!import.meta.env.PROD || !('serviceWorker' in navigator))return;
  pwa.preparing=!pwa.ready;pwa.failed=false;notify();
  try{
    registration=await navigator.serviceWorker.register(new URL('sw.js',document.baseURI),{updateViaCache:'none'});
    if(registration.active){pwa.ready=true;pwa.preparing=false;}
    if(registration.waiting)pwa.updateAvailable=true;
    if(registration.installing)watch(registration.installing);
    registration.addEventListener('updatefound',()=>{if(registration?.installing)watch(registration.installing);});
    void registration.update().catch(()=>{});
    notify();
  }catch{pwa.failed=true;pwa.preparing=false;notify();}
}
export function startPwa(onChange:()=>void){
  changed=onChange;
  if('serviceWorker' in navigator)navigator.serviceWorker.addEventListener('controllerchange',()=>{
    if(applying)window.location.reload();
  });
  void prepareOffline();
}
export async function installPwa(){
  if(!installPrompt)return;
  const prompt=installPrompt;installPrompt=undefined;pwa.canInstall=false;
  await prompt.prompt();await prompt.userChoice;notify();
}
export function applyUpdate(){
  if(!registration?.waiting)return;
  applying=true;registration.waiting.postMessage({type:'APPLY_UPDATE'});
}
