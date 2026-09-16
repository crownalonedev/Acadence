import { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInUp, SlideOutUp } from 'react-native-reanimated';
import { Bell, Check, Clock3, X } from 'lucide-react-native';
import { useAppTheme } from '@/context/ThemeContext';

type Notice={id:string;title:string;body:string;time:string;read:boolean};
const initial:Notice[]=[{id:'1',title:'Assignment due tonight',body:'Programming Project #4 is due at 11:59 PM.',time:'12 min ago',read:false},{id:'2',title:'Deadline changed',body:'Biology Lab Report is now due tomorrow at 11:59 PM.',time:'1 hr ago',read:false},{id:'3',title:'New grade posted',body:'Calculus II Quiz 3 has been graded.',time:'Yesterday',read:true}];

export function NotificationPopover({visible,onClose}:{visible:boolean;onClose:()=>void}){
  const {colors}=useAppTheme();
  const {width}=useWindowDimensions();
  const [notices,setNotices]=useState(initial);
  const unread=notices.filter(n=>!n.read).length;
  const markAll=()=>setNotices(v=>v.map(n=>({...n,read:true})));
  const mark=(id:string)=>setNotices(v=>v.map(n=>n.id===id?{...n,read:true}:n));
  if(!visible)return null;
  const panelWidth=Math.min(390,Math.max(300,width-32));
  const card=<Animated.View entering={Platform.OS==='web'?FadeIn.duration(150):SlideInUp.duration(220)} exiting={Platform.OS==='web'?FadeOut.duration(120):SlideOutUp.duration(180)} style={[s.card,{width:panelWidth,backgroundColor:colors.surface,borderColor:colors.border}]} onStartShouldSetResponder={()=>true}>
    <View style={s.head}><View style={{flex:1}}><Text style={[s.title,{color:colors.text}]}>Notifications</Text><Text style={[s.sub,{color:colors.muted}]}>{unread?`${unread} unread`:'You’re all caught up'}</Text></View><View style={s.headActions}>{unread>0&&<Pressable onPress={markAll} style={s.markAll}><Check size={15} color={colors.accent}/><Text style={[s.markText,{color:colors.accent}]}>Mark all read</Text></Pressable>}<Pressable onPress={onClose} style={[s.close,{borderColor:colors.border}]}><X size={17} color={colors.muted}/></Pressable></View></View>
    <View style={[s.divider,{backgroundColor:colors.border}]}/>
    {notices.map(n=><Pressable key={n.id} onPress={()=>mark(n.id)} style={[s.notice,!n.read&&{backgroundColor:colors.accentSoft}]}><View style={[s.noticeIcon,{backgroundColor:n.read?colors.background:colors.surface}]}><Bell size={16} color={n.read?colors.muted:colors.accent}/></View><View style={{flex:1}}><View style={s.noticeTop}><Text style={[s.noticeTitle,{color:colors.text}]}>{n.title}</Text>{!n.read&&<View style={[s.dot,{backgroundColor:colors.accent}]}/>}</View><Text style={[s.body,{color:colors.muted}]}>{n.body}</Text><View style={s.timeRow}><Clock3 size={12} color={colors.muted}/><Text style={[s.time,{color:colors.muted}]}>{n.time}</Text></View></View></Pressable>)}
  </Animated.View>;
  return Platform.OS==='web'?<View pointerEvents="box-none" style={s.webPortal}><Pressable style={s.backdrop} onPress={onClose}/><View pointerEvents="box-none" style={s.webAnchor}>{card}</View></View>:<Modal transparent visible animationType="none" onRequestClose={onClose}><View style={s.nativeBackdrop}><Pressable style={StyleSheet.absoluteFill} onPress={onClose}/><View style={s.nativeAnchor}>{card}</View></View></Modal>;
}

const s=StyleSheet.create({
  webPortal:{position:'fixed' as any,zIndex:100000,top:0,right:0,bottom:0,left:0,pointerEvents:'box-none' as any},
  backdrop:{position:'absolute',top:0,right:0,bottom:0,left:0,backgroundColor:'transparent'},
  webAnchor:{position:'absolute',top:92,right:28,alignItems:'flex-end'},
  nativeBackdrop:{flex:1,backgroundColor:'rgba(0,0,0,.10)'},
  nativeAnchor:{position:'absolute',top:72,right:16,left:16,alignItems:'flex-end'},
  card:{position:'relative',borderWidth:1,borderRadius:18,padding:10,overflow:'hidden',boxShadow:'0 18px 55px rgba(20,35,28,.18)' as any,elevation:18},
  head:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',padding:10,gap:10},title:{fontSize:17,fontWeight:'800'},sub:{fontSize:12,marginTop:2},headActions:{flexDirection:'row',alignItems:'center',gap:8},markAll:{flexDirection:'row',alignItems:'center',gap:4,padding:6},markText:{fontSize:12,fontWeight:'700'},close:{width:30,height:30,borderRadius:10,borderWidth:1,alignItems:'center',justifyContent:'center'},divider:{height:1,marginHorizontal:4},notice:{flexDirection:'row',gap:11,padding:12,borderRadius:13,marginTop:5},noticeIcon:{width:32,height:32,borderRadius:10,alignItems:'center',justifyContent:'center'},noticeTop:{flexDirection:'row',alignItems:'center',gap:7},noticeTitle:{fontSize:13,fontWeight:'800',flex:1},dot:{width:7,height:7,borderRadius:4},body:{fontSize:12,lineHeight:17,marginTop:3},timeRow:{flexDirection:'row',alignItems:'center',gap:4,marginTop:7},time:{fontSize:10}
});
