
export interface AnswerPart { text: string; different: boolean }

// Zachowujemy wpisany tekst, ale porównujemy według zasad oceniania.
function characters(text: string, caseSensitive: boolean) {
  const raw=Array.from(text.normalize('NFC'));
  const tokens: {key:string;index:number}[]=[];
  raw.forEach((char,index)=>{
    if(/[.,!?…]/u.test(char))return;
    const key=/\s/u.test(char)?' ':char.replace(/[’‘]/g,"'");
    if(key===' ' && (!tokens.length || tokens.at(-1)!.key===' '))return;
    tokens.push({key:caseSensitive?key:key.toLocaleLowerCase(),index});
  });
  if(tokens.at(-1)?.key===' ')tokens.pop();
  return {raw,tokens};
}

export function compareAnswer(given: string, expected: string, caseSensitive=false) {
  const a=characters(given,caseSensitive),b=characters(expected,caseSensitive);
  const aChanged=new Set<number>(),bChanged=new Set<number>();
  // Kotwice zachowują całe zgodne początki i końce, np. „I [would] like milk”.
  let prefix=0;
  while(prefix<a.tokens.length && prefix<b.tokens.length && a.tokens[prefix].key===b.tokens[prefix].key)prefix++;
  let aEnd=a.tokens.length,bEnd=b.tokens.length;
  while(aEnd>prefix && bEnd>prefix && a.tokens[aEnd-1].key===b.tokens[bEnd-1].key){aEnd--;bEnd--;}
  a.tokens=a.tokens.slice(prefix,aEnd);b.tokens=b.tokens.slice(prefix,bEnd);
  const n=a.tokens.length,m=b.tokens.length;
  // Bardzo długie teksty z kopii nie powinny blokować widoku telefonu.
  if(n>600 || m>600){
    a.tokens.forEach(t=>aChanged.add(t.index));b.tokens.forEach(t=>bChanged.add(t.index));
  }else{
    const lengths=Array.from({length:n+1},()=>new Uint16Array(m+1));
    for(let i=n-1;i>=0;i--)for(let j=m-1;j>=0;j--)
      lengths[i][j]=a.tokens[i].key===b.tokens[j].key?1+lengths[i+1][j+1]:Math.max(lengths[i+1][j],lengths[i][j+1]);
    let i=0,j=0;
    while(i<n || j<m){
      if(i<n && j<m && a.tokens[i].key===b.tokens[j].key){i++;j++;}
      else if(i<n && (j===m || lengths[i+1][j]>=lengths[i][j+1]))aChanged.add(a.tokens[i++].index);
      else bChanged.add(b.tokens[j++].index);
    }
  }
  const parts=(raw:string[],changed:Set<number>)=>raw.reduce<AnswerPart[]>((out,text,index)=>{
    const different=changed.has(index),last=out.at(-1);
    if(last?.different===different)last.text+=text;else out.push({text,different});
    return out;
  },[]);
  return {given:parts(a.raw,aChanged),expected:parts(b.raw,bChanged),distance:aChanged.size+bChanged.size};
}

export function closestAnswer(given: string, answers: string[], caseSensitive=false) {
  return answers.reduce((best,answer)=>{
    const candidate=compareAnswer(given,answer,caseSensitive);
    return candidate.distance<best.distance?{...candidate,answer}:best;
  },{...compareAnswer(given,answers[0],caseSensitive),answer:answers[0]});
}
