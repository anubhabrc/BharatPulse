'use client';
import {useId,useRef,useState} from 'react';
import {suggestCompanies,type SearchCompany} from '@/domain/company-search';
import {companyColor,companyInitials} from '@/domain/presentation';
import {Icon} from './icons';
export default function CompanySearch({companies,initialQuery,onChoose}:{companies:SearchCompany[];initialQuery:string;onChoose:(name:string)=>void}){
  const [query,setQuery]=useState(initialQuery),[open,setOpen]=useState(false),[active,setActive]=useState(-1);
  const input=useRef<HTMLInputElement>(null),id=useId(),matches=suggestCompanies(companies,query),visible=open&&!!query.trim();
  function choose(name:string){setQuery(name);setOpen(false);setActive(-1);onChoose(name);}
  return <div className="company-search" onBlurCapture={event=>{if(!event.currentTarget.contains(event.relatedTarget))setOpen(false);}}>
    <div className="search-box"><Icon name="search"/><label className="sr-only" htmlFor="q">Company name</label>
      <input ref={input} id="q" name="q" role="combobox" aria-autocomplete="list" aria-expanded={visible} aria-controls={visible?id:undefined} aria-activedescendant={visible&&active>=0&&matches[active]?`${id}-${active}`:undefined} value={query} placeholder="Search companies…" maxLength={200} autoComplete="off" onFocus={()=>setOpen(true)} onChange={event=>{setQuery(event.target.value);setOpen(true);setActive(-1);}} onKeyDown={event=>{
        if(event.nativeEvent.isComposing)return;
        if(event.key==='Escape'){event.preventDefault();setOpen(false);setActive(-1);}
        else if((event.key==='ArrowDown'||event.key==='ArrowUp')&&matches.length){event.preventDefault();setOpen(true);setActive(value=>event.key==='ArrowDown'?(value+1)%matches.length:(value<0?matches.length-1:(value-1+matches.length)%matches.length));}
        else if(event.key==='Enter'&&visible&&active>=0&&matches[active]){event.preventDefault();choose(matches[active].name);}
      }}/>
      {query&&<button type="button" className="search-clear" aria-label="Clear company search" onClick={()=>{choose('');input.current?.focus();}}><Icon name="close" size={16}/></button>}
      <button type="submit" className="search-submit" aria-label="Search companies" onClick={()=>setOpen(false)}><Icon name="search" size={18}/></button>
    </div>
    {visible&&<div className="search-suggestions"><ul id={id} role="listbox" aria-label="Company suggestions">{matches.map((company,index)=><li id={`${id}-${index}`} key={company.slug} role="option" aria-selected={active===index} onPointerMove={()=>setActive(index)} onMouseDown={event=>event.preventDefault()} onClick={()=>choose(company.name)}><span className="suggestion-monogram" style={{background:companyColor(company.name)}}>{companyInitials(company.name)}</span><span>{company.name}</span><Icon name="search" size={15}/></li>)}</ul>{!matches.length&&<p>No matching companies in these filters.</p>}<div className="search-suggestion-hint">{matches.length?'↑↓ to choose · Enter to search · Esc to close':'Try another name or broaden the filters.'}</div></div>}
    <span className="sr-only" role="status">{visible?`${matches.length} company suggestions`:''}</span>
  </div>;
}
