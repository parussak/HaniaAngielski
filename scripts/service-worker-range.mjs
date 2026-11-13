/** Full cached media responses must also satisfy the browser's byte-range requests offline. */
export async function mediaRangeResponse(request,response){
 const range=request.headers.get('Range');if(!range||response.status!==200)return response;
 const data=await response.arrayBuffer(),length=data.byteLength,match=/^bytes=(\d*)-(\d*)$/.exec(range);
 const invalid=()=>new Response(null,{status:416,headers:{'Content-Range':`bytes */${length}`,'Accept-Ranges':'bytes'}});
 if(!match||(!match[1]&&!match[2]))return invalid();
 let start=match[1]?Number(match[1]):Math.max(0,length-Number(match[2])),end=match[1]?(match[2]?Number(match[2]):length-1):length-1;
 if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start<0||start>=length||end<start||!length)return invalid();
 end=Math.min(end,length-1);const headers=new Headers(response.headers);headers.set('Content-Range',`bytes ${start}-${end}/${length}`);headers.set('Content-Length',String(end-start+1));headers.set('Accept-Ranges','bytes');
 return new Response(data.slice(start,end+1),{status:206,headers});
}
