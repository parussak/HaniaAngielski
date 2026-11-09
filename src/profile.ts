export function cleanName(value:string) {
  const name=value.trim().replace(/\s+/g,' ');
  if(!name || name.length>50)throw new Error('Wpisz imię od 1 do 50 znaków.');
  return name;
}
