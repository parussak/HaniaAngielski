import type {OwnerCall} from '../app/action-payloads.ts';
import {isOwnedBy,unhandled} from '../app/actions.ts';
import type {Module,Progress} from '../learning/model.ts';
import {buildReport,planCategory,parseReports,reportCategories,reportSubject,reportableUtterances,screenUtterances,type PlaybackRecord,type ProblemReport,type ReportCategory,type ReportDraft,type ReportOutcome} from '../learning/problem-report.ts';

/** Najwęższy dostęp do stanu: czyta sesję, moduły i konto, zmienia tylko szkic zgłoszenia. */
export interface ReportControllerState{
    readonly modules:Module[];
    readonly progress:Pick<Progress,'active'>;
    readonly readingShown?:{sessionId:string;count:number};
    readonly user:{uid:string}|null;
    report?:ReportDraft;
}
export interface ReportPorts{
    speech:{available:(language:string,text:string)=>boolean;last:()=>PlaybackRecord|undefined;recordingOf:(text:string,language:string)=>string|undefined};
    /** Kolejka niewysłanych zgłoszeń na tym urządzeniu (osobno od postępów). */
    outbox:{read:()=>Promise<unknown>;write:(list:ProblemReport[])=>Promise<void>};
    /** Zapis w chmurze pod stałym identyfikatorem zgłoszenia: powtórzenie nie tworzy kopii. */
    send:(uid:string,report:ProblemReport)=>Promise<void>;
    isOnline:()=>boolean;now:()=>Date;newId:()=>string;
    /** Przerysowanie okna zgłoszenia (nie ekranu nauki). */
    changed:()=>void;
}
const saveFailed='Nie udało się zapisać zgłoszenia na tym urządzeniu. Spróbuj jeszcze raz.';
const needsText='Napisz krótko, co się stało.';

// D-80: zgłoszenie nie dotyka postępów ani sesji. Najpierw trafia do kolejki na urządzeniu, dopiero potem jest wysyłane;
// „Wysłano” pokazujemy po potwierdzeniu zapisu w chmurze, a w każdym innym razie mówimy, że zgłoszenie czeka.
export function createReportController(state:ReportControllerState,ports:ReportPorts){
    let chain:Promise<unknown>=Promise.resolve(),running:Promise<void>|undefined,again=false;
    const outcomes=new Map<string,ReportOutcome>();
    /** Zmiany kolejki idą pojedynczo, żeby dwa zapisy nie nadpisały się nawzajem. */
    function edit(change:(list:ProblemReport[])=>ProblemReport[]){
        const done=chain.then(async()=>ports.outbox.write(change(parseReports(await ports.outbox.read()))));
        chain=done.catch(()=>undefined);return done;
    }
    const add=(report:ProblemReport)=>edit(list=>list.some(x=>x.id===report.id)?list:[...list,report]);
    const remove=(id:string)=>edit(list=>list.filter(x=>x.id!==id));

    async function attempt(report:ProblemReport):Promise<ReportOutcome>{
        const uid=state.user?.uid;
        if(!uid)return 'waiting-login';
        if(!ports.isOnline())return 'waiting-offline';
        try{await ports.send(uid,report);}catch{return 'waiting-error';}
        // Wysłane zgłoszenie, którego nie udało się wyjąć z kolejki, wyjdzie jeszcze raz pod tym samym identyfikatorem — bez kopii.
        try{await remove(report.id);}catch{/* the next pass sends the same document again */}
        return 'sent';
    }
    async function pass(){
        let list:ProblemReport[]=[];
        try{list=parseReports(await ports.outbox.read());}catch{return;}
        for(const report of list){
            const outcome=await attempt(report);outcomes.set(report.id,outcome);
            if(state.report?.id===report.id&&state.report.step==='done'&&state.report.outcome!==outcome){state.report.outcome=outcome;ports.changed();}
        }
    }
    /** Wysyła wszystko, co czeka. Jedna wysyłka naraz, więc to samo zgłoszenie nie wychodzi dwa razy równolegle. */
    function flush():Promise<void>{
        if(running){again=true;return running;}
        running=(async()=>{do{again=false;await pass();}while(again);})().finally(()=>{running=undefined;});
        return running;
    }

    function open(){
        const s=state.progress.active;
        if(!s||state.report?.step==='sending')return;
        const subject=reportSubject(state.modules,s);
        if(!subject)return;
        const shown=state.readingShown?.sessionId===s.id?state.readingShown.count:undefined;
        const {list,lastIndex}=reportableUtterances(screenUtterances(state.modules,s,shown),{canSpeak:ports.speech.available,recordingOf:ports.speech.recordingOf,last:ports.speech.last()});
        state.report={id:ports.newId(),subject,utterances:list,...(lastIndex!==undefined?{lastIndex}:{}),step:'category'};
        ports.changed();
    }
    async function submit(category:ReportCategory,utterance?:number,comment?:string){
        const draft=state.report;
        if(!draft||draft.step==='sending'||draft.step==='done')return;
        // Zmiana kroku przed pierwszym oczekiwaniem: szybkie drugie kliknięcie trafia w „sending” i nic nie robi.
        draft.step='sending';draft.category=category;delete draft.problem;ports.changed();
        const report=buildReport({id:draft.id,now:ports.now(),category,comment,subject:draft.subject,utterance:utterance===undefined?undefined:draft.utterances[utterance]});
        try{await add(report);}
        catch{
            if(state.report?.id===draft.id){draft.step='category';draft.problem=saveFailed;ports.changed();}
            return;
        }
        outcomes.delete(report.id);
        await flush();
        const outcome=outcomes.get(report.id)??'waiting-error';
        if(state.report?.id===draft.id){draft.step='done';draft.outcome=outcome;ports.changed();}
    }
    async function submitComment(text:string){
        const draft=state.report;
        if(draft?.step!=='comment'||!draft.category)return;
        if(!text.trim()){draft.problem=needsText;ports.changed();return;}
        await submit(draft.category,undefined,text);
    }

    async function handleAction(...[action,payload]:OwnerCall<'report'>):Promise<boolean>{
        if(!isOwnedBy('report',action))return false;
        switch(action){
            case 'report-open':open();return true;
            case 'report-close':state.report=undefined;ports.changed();return true;
            case 'report-category':{
                const draft=state.report,category=payload.category as ReportCategory;
                if(draft?.step!=='category'||!reportCategories.includes(category))return true;
                const plan=planCategory(category,draft.utterances.length,draft.lastIndex);
                if(plan.kind==='send')await submit(category,plan.utterance);
                else{draft.step=plan.kind==='ask-comment'?'comment':'which';draft.category=category;delete draft.problem;ports.changed();}
                return true;
            }
            case 'report-utterance':{
                const draft=state.report;
                if(draft?.step!=='which'||!draft.category||!Number.isInteger(payload.index)||!draft.utterances[payload.index])return true;
                await submit(draft.category,payload.index);
                return true;
            }
            default:return unhandled(action);
        }
    }
    return {handleAction,submitComment,flush};
}
