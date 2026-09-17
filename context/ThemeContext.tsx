import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { AppTheme, palettes } from '@/constants/theme';

type ThemeValue={preference:AppTheme;setPreference:(value:AppTheme)=>void;isDark:boolean;colors:typeof palettes.light|typeof palettes.dark};
const ThemeContext=createContext<ThemeValue|null>(null);
const KEY='acadence.theme';
export function ThemeProvider({children}:PropsWithChildren){const system=useColorScheme();const [preference,setPreferenceState]=useState<AppTheme>('system');useEffect(()=>{AsyncStorage.getItem(KEY).then(v=>{if(v==='light'||v==='dark'||v==='system')setPreferenceState(v)})},[]);const setPreference=(value:AppTheme)=>{setPreferenceState(value);AsyncStorage.setItem(KEY,value)};const isDark=preference==='dark'||(preference==='system'&&system==='dark');const colors=isDark?palettes.dark:palettes.light;const value=useMemo(()=>({preference,setPreference,isDark,colors}),[preference,isDark,colors]);return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>}
export function useAppTheme(){const value=useContext(ThemeContext);if(!value)throw new Error('useAppTheme must be used inside ThemeProvider');return value}
