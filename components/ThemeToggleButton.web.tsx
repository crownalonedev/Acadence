import { flushSync } from 'react-dom';
import { Moon, Sun } from 'lucide-react-native';
import { useAppTheme } from '@/context/ThemeContext';

export function ThemeToggleButton(){
  const {isDark,setPreference,colors}=useAppTheme();
  const toggle=async()=>{
    const target=isDark?'light':'dark';
    const doc=document as Document&{startViewTransition?:(callback:()=>void)=>{ready:Promise<void>}};
    if(!doc.startViewTransition){setPreference(target);return;}
    const transition=doc.startViewTransition(()=>flushSync(()=>setPreference(target)));
    await transition.ready;
    document.documentElement.animate({clipPath:['inset(0 100% 0 0)','inset(0 0 0 0)']},{duration:700,easing:'ease-in-out',pseudoElement:'::view-transition-new(root)' as any});
  };
  const Icon=isDark?Moon:Sun;
  return <><button aria-label={`Switch to ${isDark?'light':'dark'} mode`} onClick={toggle} style={{width:42,height:42,borderRadius:21,border:`1px solid ${colors.border}`,background:colors.surface,color:colors.accent,display:'grid',placeItems:'center',cursor:'pointer',padding:0}}><Icon size={20} color={colors.accent} strokeWidth={2}/></button><style>{`::view-transition-old(root),::view-transition-new(root){animation:none;mix-blend-mode:normal}`}</style></>;
}
