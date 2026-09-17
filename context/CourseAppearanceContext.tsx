import { createContext,PropsWithChildren,useContext,useMemo,useState } from 'react';
import { useCanvasData } from '@/context/CanvasDataContext';

export type CourseAppearance={image?:string;position?:number};
type State=Record<string,CourseAppearance>;
type Value={appearance:State;setCourseAppearance:(id:string,value:CourseAppearance)=>void;resetCourseAppearance:(id:string)=>void};
const KEY='acadence.courseAppearance';
const C=createContext<Value|null>(null);
const load=():State=>{if(typeof localStorage==='undefined')return {};try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return {}}};

export function CourseAppearanceProvider({children}:PropsWithChildren){
  const [customAppearance,setCustomAppearance]=useState<State>(load);
  const {allCourses}=useCanvasData();
  const persist=(next:State)=>{setCustomAppearance(next);if(typeof localStorage!=='undefined')localStorage.setItem(KEY,JSON.stringify(next))};
  const appearance=useMemo(()=>{
    const canvasAppearance:State={};
    for(const course of allCourses){
      if(course.imageUrl) canvasAppearance[String(course.id)]={image:course.imageUrl};
    }
    // A student's explicit Acadence cover wins; Canvas is the default when one exists.
    return {...canvasAppearance,...customAppearance};
  },[allCourses,customAppearance]);
  const value=useMemo(()=>({
    appearance,
    setCourseAppearance:(id:string,v:CourseAppearance)=>persist({...customAppearance,[id]:v}),
    resetCourseAppearance:(id:string)=>{const next={...customAppearance};delete next[id];persist(next)}
  }),[appearance,customAppearance]);
  return <C.Provider value={value}>{children}</C.Provider>
}

export function useCourseAppearance(){const v=useContext(C);if(!v)throw new Error('useCourseAppearance must be inside CourseAppearanceProvider');return v}
