import {normalizeAnswer} from '../answers.ts';
import type {Exercise} from './model.ts';
const splitArticle=(text:string)=>{const match=text.match(/^(a|an)\s+(.+)$/i);return match?{article:match[1].toLowerCase(),body:match[2]}:{article:null,body:text};};
export function vocabularyAssessment(q:Exercise,answer:string){
    if(q.kind!=='vocabulary'||!q.article)return null;
    const given=splitArticle(normalizeAnswer(answer,q.caseSensitive));
    const known=q.answers.some(a=>splitArticle(normalizeAnswer(a,q.caseSensitive)).body===given.body);
    const correct=known&&(given.article===null||given.article===q.article.expected);
    const missing=correct&&q.article.expected!==null&&given.article===null;
    const wrongArticle=given.article!==null&&given.article!==q.article.expected;
    return {correct,note:missing||wrongArticle||!correct?q.article.explanation:null};
}
export function vocabularyFullAnswer(q:Exercise){
    const answer=q.answers[0];
    return q.kind==='vocabulary'&&q.article?.expected?`${q.article.expected} ${splitArticle(answer).body}`:answer;
}
