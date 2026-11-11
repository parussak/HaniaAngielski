/** Existing Polish noun forms; the interface remains Polish for every course. */
export const polishCount=(n:number,one:string,few:string,many:string)=>`${n} ${n===1?one:n%10>=2&&n%10<=4&&(n%100<12||n%100>14)?few:many}`;
