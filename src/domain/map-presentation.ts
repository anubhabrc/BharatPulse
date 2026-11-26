export function sectorStyle(sector:string|null){
  if(/fintech|financial|lending|payment|credit|banking|invest/i.test(sector??''))return {name:'Finance',color:'#6235a5'};
  if(/mobility|electric|\bev\b|automotive|logistic|transport|ride|motorcycle/i.test(sector??''))return {name:'Mobility',color:'#b54b16'};
  if(/space|climate|clean|energy|agri|sustainab|aerospace/i.test(sector??''))return {name:'Climate & space',color:'#176b4e'};
  if(/\bAI\b|saas|software|data|tech|cyber|cloud/i.test(sector??''))return {name:'Technology',color:'#2462a2'};
  return {name:'Consumer & more',color:'#292d38'};
}
