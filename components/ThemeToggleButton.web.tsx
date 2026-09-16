import { flushSync } from 'react-dom';
import { Monitor, Moon, Sun } from 'lucide-react-native';
import { useAppTheme } from '@/context/ThemeContext';
import { AppTheme } from '@/constants/theme';

type DocumentWithTransition=Document&{startViewTransition?:(callback:()=>void)=>{ready:Promise<void>;finished:Promise<void>}};
const modes:AppTheme[]=['light','dark','system'];
export function ThemeToggleButton(){
  const {preference,isDark,setPreference,colors}=useAppTheme();
  const next=()=>{const i=modes.indexOf(preference);return modes[(i+1)%modes.length]};
  const toggle=async()=>{
    const target=next();
    const doc=document as DocumentWithTransition;
    if(!doc.startViewTransition){setPreference(target);return;}
    const transition=doc.startViewTransition(()=>flushSync(()=>setPreference(target)));
    await transition.ready;
    document.documentElement.animate({clipPath:['inset(0 100% 0 0)','inset(0 0 0 0)']},{duration:700,easing:'ease-in-out',pseudoElement:'::view-transition-new(root)' as any});
  };
  const Icon=preference==='system'?Monitor:isDark?Moon:Sun;
  return <><button aria-label={`Theme: ${preference}. Change theme`} onClick={toggle} style={{width:42,height:42,borderRadius:21,border:`1px solid ${colors.border}`,background:colors.surface,color:colors.accent,display:'grid',placeItems:'center',cursor:'pointer',padding:0}}><Icon size={20} color={colors.accent} strokeWidth={2}/></button><style>{`::view-transition-old(root),::view-transition-new(root){animation:none;mix-blend-mode:normal}`}</style></>;
}
