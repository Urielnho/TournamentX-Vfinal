import { Tournament } from '../types';

export const normalizeSearch = (value:string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();

const aliases:Record<string,string> = { lol:'league of legends', mk:'mortal kombat', mk1:'mortal kombat 1', futbol:'futbol soccer', football:'futbol soccer', rl:'rocket league', fort:'fortnite', vivo:'live en vivo', abierto:'open inscripciones abiertas', finalizado:'completed terminado' };
const distance=(a:string,b:string)=>{const row=Array.from({length:b.length+1},(_,i)=>i);for(let i=1;i<=a.length;i++){let previous=row[0];row[0]=i;for(let j=1;j<=b.length;j++){const saved=row[j];row[j]=Math.min(row[j]+1,row[j-1]+1,previous+(a[i-1]===b[j-1]?0:1));previous=saved;}}return row[b.length];};
const tokenMatches=(token:string,text:string)=>text.includes(token)||text.split(' ').some(word=>word.startsWith(token)||(token.length>=4&&word.length>=4&&distance(token,word)<=1));

export function tournamentSearchScore(t:Tournament,query:string){
  const normalized=normalizeSearch(query); if(!normalized)return 1;
  const expanded=normalized.split(' ').flatMap(token=>[token,...(aliases[token]?.split(' ')||[])]);
  const fields=[{text:t.title,weight:12},{text:t.game,weight:9},{text:t.gameMode,weight:7},{text:t.organizer.name,weight:6},{text:t.description,weight:3},{text:t.format,weight:4},{text:t.category==='esports'?'esports videojuegos':'deportes tradicionales',weight:3},{text:t.status,weight:3}].map(field=>({...field,text:normalizeSearch(field.text||'')}));
  let score=fields[0].text.includes(normalized)?30:0;
  for(const token of expanded){let best=0;for(const field of fields)if(tokenMatches(token,field.text))best=Math.max(best,field.weight+(field.text===token?3:0));if(!best&&normalized.split(' ').includes(token))return 0;score+=best;}
  return score;
}
