export const newsStoryHref=(id:string)=>`/news?story=${encodeURIComponent(id)}#headline-${encodeURIComponent(id)}`;
export function newsPageForStory(items:{id:string}[],story:string|undefined,requested:string|undefined,size=50){
  const index=story?items.findIndex(item=>item.id===story):-1;
  if(index>=0)return Math.floor(index/size)+1;
  const page=Number(requested??1);
  return Math.min(Math.max(1,Number.isSafeInteger(page)?page:1),Math.max(1,Math.ceil(items.length/size)));
}
