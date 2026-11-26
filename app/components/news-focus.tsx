'use client';
import {useEffect} from 'react';
// Route transitions can update the fragment before its server-rendered item mounts.
export default function NewsFocus({id}:{id:string}){
  useEffect(()=>{const frame=requestAnimationFrame(()=>{const headline=document.getElementById(`headline-${id}`);headline?.scrollIntoView({block:'center',behavior:'instant'});headline?.focus({preventScroll:true});});return()=>cancelAnimationFrame(frame);},[id]);
  return null;
}
