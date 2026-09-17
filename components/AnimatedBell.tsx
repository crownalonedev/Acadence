import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated,{Easing,useAnimatedStyle,useSharedValue,withSequence,withTiming} from 'react-native-reanimated';
import { Bell } from 'lucide-react-native';
export function AnimatedBell({size=20,color='#000',animate=false}:{size?:number;color?:string;animate?:boolean}){const rotation=useSharedValue(0);useEffect(()=>{if(animate)rotation.value=withSequence(withTiming(13,{duration:90,easing:Easing.out(Easing.quad)}),withTiming(-11,{duration:90}),withTiming(8,{duration:80}),withTiming(-5,{duration:70}),withTiming(2,{duration:60}),withTiming(0,{duration:70}))},[animate,rotation]);const style=useAnimatedStyle(()=>({transform:[{rotate:`${rotation.value}deg`}]}));return <Animated.View style={[s.icon,style]}><Bell size={size} color={color}/></Animated.View>}
const s=StyleSheet.create({icon:{alignItems:'center',justifyContent:'center'}});
