import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, ZoomIn, ZoomOut } from 'react-native-reanimated';
import { Moon, Sun } from 'lucide-react-native';
import { useAppTheme } from '@/context/ThemeContext';

export function ThemeToggleButton(){
  const {isDark,setPreference,colors}=useAppTheme();
  const toggle=()=>setPreference(isDark?'light':'dark');
  return <Pressable accessibilityRole="button" accessibilityLabel={`Switch to ${isDark?'light':'dark'} mode`} onPress={toggle} style={({pressed})=>[s.button,{backgroundColor:colors.surface,borderColor:colors.border,transform:[{scale:pressed?.94:1}]}]}>
    <View style={s.iconStage}>
      {isDark?<Animated.View key="moon" entering={ZoomIn.duration(180)} exiting={ZoomOut.duration(120)} style={s.absolute}><Moon size={20} color={colors.accent} fill={colors.accentSoft}/></Animated.View>:<Animated.View key="sun" entering={FadeIn.duration(180)} exiting={FadeOut.duration(120)} style={s.absolute}><Sun size={21} color={colors.accent}/></Animated.View>}
    </View>
  </Pressable>;
}
const s=StyleSheet.create({button:{width:42,height:42,borderRadius:21,borderWidth:1,alignItems:'center',justifyContent:'center'},iconStage:{width:22,height:22,alignItems:'center',justifyContent:'center'},absolute:{position:'absolute',alignItems:'center',justifyContent:'center'}});
