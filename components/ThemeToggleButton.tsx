import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { Easing, FadeIn, FadeOut, ZoomIn, ZoomOut } from 'react-native-reanimated';
import { Laptop, Moon, Sun } from 'lucide-react-native';
import { AppTheme } from '@/constants/theme';
import { useAppTheme } from '@/context/ThemeContext';
const modes:AppTheme[]=['light','dark','system'];
export function ThemeToggleButton(){const {preference,isDark,setPreference,colors}=useAppTheme();const toggle=()=>{const i=modes.indexOf(preference);setPreference(modes[(i+1)%modes.length])};const Icon=preference==='system'?Laptop:isDark?Moon:Sun;return <Pressable accessibilityRole="button" accessibilityLabel={`Theme: ${preference}. Change theme`} onPress={toggle} style={({pressed})=>[s.button,{backgroundColor:colors.surface,borderColor:colors.border,transform:[{scale:pressed?.96:1}]}]}><View style={s.stage}><Animated.View key={preference} entering={ZoomIn.duration(260).easing(Easing.inOut(Easing.ease))} exiting={ZoomOut.duration(180).easing(Easing.inOut(Easing.ease))} style={s.icon}><Icon size={20} color={colors.accent}/></Animated.View></View></Pressable>}
const s=StyleSheet.create({button:{width:42,height:42,borderRadius:21,borderWidth:1,alignItems:'center',justifyContent:'center'},stage:{width:22,height:22,alignItems:'center',justifyContent:'center'},icon:{position:'absolute',alignItems:'center',justifyContent:'center'}});
