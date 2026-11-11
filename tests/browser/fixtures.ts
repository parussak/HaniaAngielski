import {test as base,type BrowserContext,type Browser} from '@playwright/test';
import {foodCourse} from '../materials.ts';
export * from '@playwright/test';
// UI regressions declare their Food scenario. Tests that install a different
// library route override these handlers; real-catalog smoke tests use base.
async function foodRoutes(context:BrowserContext){
  await context.route('**/content/katalog.json',r=>r.fulfill({json:{version:1,coursesFile:'kursy.json',modules:['02-food']}}));
  await context.route('**/content/kursy.json',r=>r.fulfill({json:{version:1,courses:[{...foodCourse,moduleIds:['unit-2-food']}]}}));
}
export const test=base.extend<{foodCatalog:void}>({
 browser:[async({browser},use)=>{
  // Multi-device/account tests create their own contexts too. Scope those
  // contexts to the same scenario instead of leaking the growing catalog.
  const scoped=new Proxy(browser,{
   get(target,key){
    if(key==='newContext')return async(options:Parameters<Browser['newContext']>[0])=>{const context=await target.newContext(options);await foodRoutes(context);return context;};
    const value=Reflect.get(target,key,target);return typeof value==='function'?value.bind(target):value;
   }
  });
  await use(scoped);
 },{scope:'worker'}],
 foodCatalog:[async({context},use)=>{
  await foodRoutes(context);
  await use();
 },{auto:true}]
});
