// Small container check, independent of ffmpeg: Opus header, mono, complete pages and Ogg CRCs.
const table=Array.from({length:256},(_,i)=>{let n=i<<24;for(let bit=0;bit<8;bit++)n=n&0x80000000?(n<<1)^0x04c11db7:n<<1;return n>>>0;});
export function oggCRC(bytes){let crc=0;for(const byte of bytes)crc=((crc<<8)^table[((crc>>>24)^byte)&255])>>>0;return crc;}
export function inspectOpus(bytes){
 const bad=()=>{throw Error('Audio: uszkodzony lub niepoprawny plik Ogg Opus mono.');};
 let offset=0,sequence=0,serial,head,granule=0n,ended=false;
 while(offset<bytes.length){
  if(offset+27>bytes.length||bytes.toString('ascii',offset,offset+4)!=='OggS'||bytes[offset+4]!==0||ended)bad();
  const count=bytes[offset+26],start=offset+27+count;if(start>bytes.length)bad();
  const length=Array.from(bytes.subarray(offset+27,start)).reduce((n,v)=>n+v,0),end=start+length;if(end>bytes.length)bad();
  const page=Buffer.from(bytes.subarray(offset,end)),checksum=page.readUInt32LE(22);page.writeUInt32LE(0,22);if(oggCRC(page)!==checksum)bad();
  const stream=bytes.readUInt32LE(offset+14);if(serial!==undefined&&stream!==serial||bytes.readUInt32LE(offset+18)!==sequence++)bad();serial=stream;
  if(offset===0){if(!(bytes[offset+5]&2))bad();head=bytes.subarray(start,end);}
  granule=bytes.readBigUInt64LE(offset+6);ended=!!(bytes[offset+5]&4);offset=end;
 }
 if(!ended||!head||head.length<19||head.toString('ascii',0,8)!=='OpusHead'||head[8]!==1||head[9]!==1||head.readUInt32LE(12)!==24000)bad();
 const duration=(Number(granule)-head.readUInt16LE(10))/48000;if(!Number.isFinite(duration)||duration<=0||duration>120)bad();
 return {codec:'opus',channels:1,inputSampleRate:24000,durationSeconds:Math.round(duration*1000)/1000};
}
