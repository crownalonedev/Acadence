import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Check, ChevronDown, ChevronUp, Link2, Plus, RotateCcw, Settings2 } from 'lucide-react-native';
import { Screen } from '@/components/Screen';
import { colors, radius } from '@/constants/theme';
import { navigationItems, NavigationItemId } from '@/constants/navigation';
import { useNavigationPreferences } from '@/context/NavigationContext';

export default function Settings() {
  const { items, setItems, reset } = useNavigationPreferences();
  const available = (Object.keys(navigationItems) as NavigationItemId[]).filter(id => !items.includes(id));
  const move = (index: number, direction: -1 | 1) => { const next = [...items]; const target = index + direction; if (target < 0 || target >= next.length) return; [next[index], next[target]] = [next[target], next[index]]; setItems(next); };
  const remove = (id: NavigationItemId) => { if (id === 'home' || items.length <= 2) return; setItems(items.filter(x => x !== id)); };
  const add = (id: NavigationItemId) => { if (items.length >= 5) return; setItems([...items, id]); };

  return <Screen>
    <Text style={s.title}>You</Text><Text style={s.sub}>Make Acadence yours.</Text>
    <View style={s.card}><Link2 size={21} color={colors.accent}/><View style={{flex:1}}><Text style={s.name}>Connect your college</Text><Text style={s.meta}>Canvas integration is coming next.</Text></View></View>
    <Text style={s.section}>Navigation</Text><Text style={s.help}>Choose up to five tabs. Home always stays available.</Text>
    <View style={s.panel}>{items.map((id,index) => { const item=navigationItems[id]; const Icon=item.icon; return <View key={id} style={s.navRow}><Icon size={20} color={colors.text}/><Text style={s.navName}>{item.label}</Text>{id==='home'?<View style={s.required}><Check size={13} color={colors.accent}/><Text style={s.requiredText}>Required</Text></View>:<Pressable onPress={()=>remove(id)}><Text style={s.remove}>Remove</Text></Pressable>}<Pressable disabled={index===0} onPress={()=>move(index,-1)} style={s.smallButton}><ChevronUp size={17} color={index===0?colors.border:colors.muted}/></Pressable><Pressable disabled={index===items.length-1} onPress={()=>move(index,1)} style={s.smallButton}><ChevronDown size={17} color={index===items.length-1?colors.border:colors.muted}/></Pressable></View>})}</View>
    {available.length>0 && <><Text style={s.available}>Available</Text><View style={s.panel}>{available.map(id=>{const item=navigationItems[id];const Icon=item.icon;const disabled=items.length>=5;return <Pressable key={id} onPress={()=>add(id)} disabled={disabled} style={s.navRow}><Icon size={20} color={disabled?colors.border:colors.text}/><Text style={[s.navName,disabled&&{color:colors.muted}]}>{item.label}</Text><Plus size={19} color={disabled?colors.border:colors.accent}/></Pressable>})}</View></>}
    <Pressable onPress={reset} style={s.reset}><RotateCcw size={16} color={colors.muted}/><Text style={s.resetText}>Reset navigation</Text></Pressable>
    <View style={[s.card,{marginTop:24}]}><Settings2 size={21} color={colors.muted}/><View><Text style={s.name}>Preferences</Text><Text style={s.meta}>Notifications, appearance and study settings.</Text></View></View>
  </Screen>;
}

const s=StyleSheet.create({title:{fontSize:30,fontWeight:'800',color:colors.text,marginTop:14},sub:{fontSize:14,color:colors.muted,marginTop:5,marginBottom:24},card:{flexDirection:'row',alignItems:'center',gap:14,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border,borderRadius:radius.md,padding:18,marginBottom:10},name:{fontSize:16,fontWeight:'700',color:colors.text},meta:{fontSize:13,color:colors.muted,marginTop:4},section:{fontSize:19,fontWeight:'800',color:colors.text,marginTop:24},help:{fontSize:13,color:colors.muted,marginTop:5,marginBottom:12},panel:{backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border,borderRadius:radius.md,overflow:'hidden'},navRow:{minHeight:56,flexDirection:'row',alignItems:'center',gap:12,paddingHorizontal:15,borderBottomWidth:StyleSheet.hairlineWidth,borderBottomColor:colors.border},navName:{fontSize:15,fontWeight:'700',color:colors.text,flex:1},required:{flexDirection:'row',alignItems:'center',gap:4},requiredText:{fontSize:12,fontWeight:'700',color:colors.accent},remove:{fontSize:12,fontWeight:'700',color:colors.muted},smallButton:{padding:5},available:{fontSize:13,fontWeight:'700',color:colors.muted,marginTop:18,marginBottom:8,textTransform:'uppercase',letterSpacing:.5},reset:{flexDirection:'row',alignItems:'center',gap:7,alignSelf:'flex-start',marginTop:14,paddingVertical:7},resetText:{fontSize:13,fontWeight:'700',color:colors.muted}});
