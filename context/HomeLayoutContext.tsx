import { createContext, PropsWithChildren, useContext, useMemo, useState } from 'react';

export type HomeWidgetId = 'insight' | 'attention' | 'courses' | 'schedule' | 'changes' | 'grades';
export const homeWidgets: Record<HomeWidgetId,{label:string;description:string}> = {
  insight:{label:'Acadence insight',description:'Smart overview of what matters now.'},
  attention:{label:'Needs attention',description:'Assignments and deadlines that need action.'},
  courses:{label:'Your courses',description:'Quick access to current courses.'},
  schedule:{label:"Today's schedule",description:'Classes and events happening today.'},
  changes:{label:'Recent changes',description:'New grades, files, and changed due dates.'},
  grades:{label:'Grade snapshot',description:'A quick look at current grades.'},
};
const defaults:HomeWidgetId[]=['insight','attention','courses'];
type Value={items:HomeWidgetId[];hidden:HomeWidgetId[];move:(id:HomeWidgetId,to:number)=>void;hide:(id:HomeWidgetId)=>void;show:(id:HomeWidgetId)=>void;reset:()=>void};
const Context=createContext<Value|null>(null);
export function HomeLayoutProvider({children}:PropsWithChildren){const [items,setItems]=useState<HomeWidgetId[]>(defaults);const [hidden,setHidden]=useState<HomeWidgetId[]>(['schedule','changes','grades']);const value=useMemo<Value>(()=>({items,hidden,move:(id,to)=>setItems(current=>{const from=current.indexOf(id);if(from<0||to<0||to>=current.length)return current;const next=[...current];next.splice(from,1);next.splice(to,0,id);return next}),hide:(id)=>{setItems(x=>x.filter(v=>v!==id));setHidden(x=>x.includes(id)?x:[...x,id])},show:(id)=>{setHidden(x=>x.filter(v=>v!==id));setItems(x=>x.includes(id)?x:[...x,id])},reset:()=>{setItems(defaults);setHidden(['schedule','changes','grades'])}}),[items,hidden]);return <Context.Provider value={value}>{children}</Context.Provider>}
export function useHomeLayout(){const value=useContext(Context);if(!value)throw new Error('useHomeLayout must be used inside HomeLayoutProvider');return value}
