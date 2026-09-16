import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Check, Link2, RefreshCw, Unlink } from 'lucide-react-native';
import { radius } from '@/constants/theme';
import { useAppTheme } from '@/context/ThemeContext';
import { CanvasConnectionResult, connectCanvas } from '@/services/canvas';

export function CanvasConnectionCard() {
  const { colors } = useAppTheme();
  const [url, setUrl] = useState('');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [connection, setConnection] = useState<CanvasConnectionResult | null>(null);

  const connect = async () => {
    setLoading(true); setError('');
    try { setConnection(await connectCanvas(url, token)); }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not connect to Canvas.'); }
    finally { setLoading(false); }
  };
  const disconnect = () => { setConnection(null); setToken(''); setError(''); };

  if (connection) return <View style={[s.card,{backgroundColor:colors.surface,borderColor:colors.border}]}><View style={s.heading}><View style={[s.icon,{backgroundColor:colors.accentSoft}]}><Check size={19} color={colors.accent}/></View><View style={{flex:1}}><Text style={[s.title,{color:colors.text}]}>Canvas connected</Text><Text style={[s.meta,{color:colors.muted}]}>{connection.profile.name}</Text></View></View><View style={s.stats}><View style={[s.stat,{backgroundColor:colors.background}]}><Text style={[s.number,{color:colors.text}]}>{connection.courses.length}</Text><Text style={[s.statLabel,{color:colors.muted}]}>courses</Text></View><View style={[s.stat,{backgroundColor:colors.background}]}><Text style={[s.number,{color:colors.text}]}>{connection.assignments.length}</Text><Text style={[s.statLabel,{color:colors.muted}]}>upcoming assignments</Text></View></View><Text style={[s.help,{color:colors.muted}]}>Connection verified. This first version reads your profile, active courses, and upcoming assignments. Data is not persisted yet.</Text><View style={s.buttons}><Pressable onPress={connect} disabled={loading} style={[s.secondary,{borderColor:colors.border}]}><RefreshCw size={15} color={colors.accent}/><Text style={[s.secondaryText,{color:colors.accent}]}>Sync now</Text></Pressable><Pressable onPress={disconnect} style={[s.secondary,{borderColor:colors.border}]}><Unlink size={15} color={colors.muted}/><Text style={[s.secondaryText,{color:colors.muted}]}>Disconnect</Text></Pressable></View></View>;

  return <View style={[s.card,{backgroundColor:colors.surface,borderColor:colors.border}]}><View style={s.heading}><View style={[s.icon,{backgroundColor:colors.accentSoft}]}><Link2 size={19} color={colors.accent}/></View><View style={{flex:1}}><Text style={[s.title,{color:colors.text}]}>Canvas</Text><Text style={[s.meta,{color:colors.muted}]}>Test your Canvas connection and import your academic data.</Text></View></View><Text style={[s.label,{color:colors.text}]}>Canvas URL</Text><TextInput value={url} onChangeText={setUrl} autoCapitalize="none" autoCorrect={false} placeholder="https://your-school.instructure.com" placeholderTextColor={colors.muted} style={[s.input,{color:colors.text,backgroundColor:colors.background,borderColor:colors.border}]}/><Text style={[s.label,{color:colors.text}]}>Access token</Text><TextInput value={token} onChangeText={setToken} autoCapitalize="none" autoCorrect={false} secureTextEntry placeholder="Paste your Canvas access token" placeholderTextColor={colors.muted} style={[s.input,{color:colors.text,backgroundColor:colors.background,borderColor:colors.border}]}/><Text style={[s.help,{color:colors.muted}]}>Testing only: the token stays in component memory and is not saved. Production Acadence will use Canvas OAuth instead.</Text>{error?<Text style={[s.error,{color:colors.danger}]}>{error}</Text>:null}<Pressable disabled={loading} onPress={connect} style={[s.primary,{backgroundColor:colors.accent,opacity:loading?.7:1}]}>{loading?<ActivityIndicator color="#fff"/>:<Text style={s.primaryText}>Connect Canvas</Text>}</Pressable></View>;
}
const s=StyleSheet.create({card:{borderWidth:1,borderRadius:radius.md,padding:18,marginBottom:18},heading:{flexDirection:'row',alignItems:'center',gap:12,marginBottom:18},icon:{width:38,height:38,borderRadius:12,alignItems:'center',justifyContent:'center'},title:{fontSize:17,fontWeight:'800'},meta:{fontSize:13,marginTop:3},label:{fontSize:12,fontWeight:'800',marginBottom:7,marginTop:4},input:{height:46,borderWidth:1,borderRadius:12,paddingHorizontal:13,fontSize:14,marginBottom:12},help:{fontSize:12,lineHeight:18,marginTop:2},error:{fontSize:12,fontWeight:'700',marginTop:10},primary:{height:44,borderRadius:12,alignItems:'center',justifyContent:'center',marginTop:16},primaryText:{color:'#fff',fontSize:13,fontWeight:'800'},stats:{flexDirection:'row',gap:9,marginBottom:13},stat:{flex:1,borderRadius:12,padding:13},number:{fontSize:20,fontWeight:'900'},statLabel:{fontSize:11,marginTop:2},buttons:{flexDirection:'row',gap:8,marginTop:14},secondary:{height:38,borderRadius:10,borderWidth:1,paddingHorizontal:12,flexDirection:'row',alignItems:'center',gap:6},secondaryText:{fontSize:12,fontWeight:'800'}});
