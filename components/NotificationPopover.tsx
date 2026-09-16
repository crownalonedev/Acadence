import { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition, SlideInDown, SlideOutUp } from 'react-native-reanimated';
import { Bell, BookOpen, Check, Clock3, GraduationCap, X } from 'lucide-react-native';
import { useAppTheme } from '@/context/ThemeContext';

type Notice={id:string;title:string;body:string;time:string;read:boolean;kind:'assignment'|'change'|'grade'};
const initial:Notice[]=[
  {id:'1',title:'Assignment due tonight',body:'Programming Project #4 is due at 11:59 PM.',time:'12 min ago',read:false,kind:'assignment'},
  {id:'2',title:'Deadline changed',body:'Biology Lab Report is now due tomorrow at 11:59 PM.',time:'1 hr ago',read:false,kind:'change'},
  {id:'3',title:'New grade posted',body:'Calculus II Quiz 3 has been graded.',time:'Yesterday',read:true,kind:'grade'},
];

function NoticeIcon({kind,color}:{kind:Notice['kind'];color:string}){if(kind==='grade')return <GraduationCap size={17} color={color}/>;if(kind==='assignment')return <BookOpen size={17} color={color}/>;return <Bell size={17} color={color}/>}

export function NotificationPopover({visible,onClose}:{visible:boolean;onClose:()=>void}){
  const {colors}=useAppTheme();
  const {width}=useWindowDimensions();
  const [notices,setNotices]=useState(initial);
  const [expanded,setExpanded]=useState(false);
  const unread=notices.filter(n=>!n.read).length;
  const markAll=()=>setNotices(v=>v.map(n=>({...n,read:true})));
  const mark=(id:string)=>setNotices(v=>v.map(n=>n.id===id?{...n,read:true}:n));
  if(!visible)return null;
  const panelWidth=Math.min(410,Math.max(300,width-32));
  const visibleNotices=expanded?notices:notices.slice(0,3);
  const card=(
    <Animated.View entering={Platform.OS==='web'?FadeIn.duration(140):SlideInDown.duration(220)} exiting={Platform.OS==='web'?FadeOut.duration(110):SlideOutUp.duration(160)} style={[s.panel,{width:panelWidth,backgroundColor:colors.surface,borderColor:colors.border}]}>
      <View style={s.header}>
        <View><Text style={[s.heading,{color:colors.text}]}>Notifications</Text><Text style={[s.sub,{color:colors.muted}]}>{unread?`${unread} unread`:'You’re all caught up'}</Text></View>
        <View style={s.actions}>{unread>0&&<Pressable onPress={markAll} style={s.textAction}><Check size={14} color={colors.accent}/><Text style={[s.actionText,{color:colors.accent}]}>Mark all read</Text></Pressable>}<Pressable onPress={onClose} style={[s.close,{borderColor:colors.border}]}><X size={17} color={colors.muted}/></Pressable></View>
      </View>
      <View style={[s.divider,{backgroundColor:colors.border}]}/>
      <View style={s.stack}>
        {visibleNotices.map((n,index)=>{
          const depth=visibleNotices.length-1-index;
          const stacked=!expanded&&index>0;
          return <Animated.View key={n.id} layout={LinearTransition.duration(180)} entering={FadeIn.delay(index*35).duration(160)} style={[s.cardWrap,stacked&&{marginTop:-46,transform:[{scale:1-depth*0.018}],zIndex:index}]}>
            <Pressable onPress={()=>{mark(n.id);setExpanded(true)}} style={[s.notice,{backgroundColor:n.read?colors.background:colors.accentSoft,borderColor:n.read?colors.border:colors.accent}]}>
              <View style={[s.iconBox,{backgroundColor:colors.surface}]}><NoticeIcon kind={n.kind} color={n.read?colors.muted:colors.accent}/></View>
              <View style={s.copy}><View style={s.titleRow}><Text numberOfLines={1} style={[s.noticeTitle,{color:colors.text}]}>{n.title}</Text>{!n.read&&<View style={[s.dot,{backgroundColor:colors.accent}]}/>}</View><Text numberOfLines={expanded?3:2} style={[s.body,{color:colors.muted}]}>{n.body}</Text><View style={s.timeRow}><Clock3 size={11} color={colors.muted}/><Text style={[s.time,{color:colors.muted}]}>{n.time}</Text></View></View>
            </Pressable>
          </Animated.View>
        })}
      </View>
      <Pressable onPress={()=>setExpanded(v=>!v)} style={[s.viewAll,{borderColor:colors.border}]}><Text style={[s.viewAllText,{color:colors.accent}]}>{expanded?'Collapse':'View all'}</Text></Pressable>
    </Animated.View>
  );
  return Platform.OS==='web'?<View pointerEvents="box-none" style={s.webPortal}><Pressable style={s.backdrop} onPress={onClose}/><View pointerEvents="box-none" style={s.webAnchor}>{card}</View></View>:<Modal transparent visible animationType="none" onRequestClose={onClose}><View style={s.nativeBackdrop}><Pressable style={StyleSheet.absoluteFill} onPress={onClose}/><View style={s.nativeAnchor}>{card}</View></View></Modal>;
}

const s=StyleSheet.create({
  webPortal:{position:'fixed' as any,zIndex:100000,top:0,right:0,bottom:0,left:0,pointerEvents:'box-none' as any},backdrop:{position:'absolute',top:0,right:0,bottom:0,left:0,backgroundColor:'transparent'},webAnchor:{position:'absolute',top:92,right:28,alignItems:'flex-end'},nativeBackdrop:{flex:1,backgroundColor:'rgba(0,0,0,.10)'},nativeAnchor:{position:'absolute',top:72,right:16,left:16,alignItems:'flex-end'},panel:{position:'relative',borderWidth:1,borderRadius:20,padding:10,overflow:'hidden',boxShadow:'0 20px 60px rgba(20,35,28,.18)' as any,elevation:18},header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',padding:10,gap:10},heading:{fontSize:18,fontWeight:'800'},sub:{fontSize:12,marginTop:2},actions:{flexDirection:'row',alignItems:'center',gap:6},textAction:{flexDirection:'row',alignItems:'center',gap:4,padding:6},actionText:{fontSize:12,fontWeight:'700'},close:{width:30,height:30,borderRadius:10,borderWidth:1,alignItems:'center',justifyContent:'center'},divider:{height:1,marginHorizontal:4,marginBottom:8},stack:{paddingHorizontal:4,paddingTop:2},cardWrap:{width:'100%'},notice:{minHeight:88,flexDirection:'row',gap:11,padding:12,borderRadius:15,borderWidth:1,boxShadow:'0 5px 16px rgba(20,35,28,.08)' as any},iconBox:{width:34,height:34,borderRadius:11,alignItems:'center',justifyContent:'center'},copy:{flex:1},titleRow:{flexDirection:'row',alignItems:'center',gap:7},noticeTitle:{fontSize:13,fontWeight:'800',flex:1},dot:{width:7,height:7,borderRadius:4},body:{fontSize:12,lineHeight:17,marginTop:3},timeRow:{flexDirection:'row',alignItems:'center',gap:4,marginTop:7},time:{fontSize:10},viewAll:{height:36,marginTop:9,borderTopWidth:1,alignItems:'center',justifyContent:'center'},viewAllText:{fontSize:12,fontWeight:'800'}
});
