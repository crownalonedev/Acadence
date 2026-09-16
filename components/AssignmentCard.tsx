import { StyleSheet,Text,View } from 'react-native';
import { Clock3 } from 'lucide-react-native';
import { Assignment,Course } from '@/types';
import { radius } from '@/constants/theme';
import { useAppTheme } from '@/context/ThemeContext';

export function AssignmentCard({assignment,course}:{assignment:Assignment;course?:Course}){
  const {colors,isDark}=useAppTheme();
  return <View style={[s.card,{backgroundColor:isDark?colors.surfaceElevated:colors.surface,borderColor:colors.border}]}>
    <View style={[s.dot,{backgroundColor:course?.color??colors.accent}]}/>
    <View style={s.body}>
      <Text style={[s.title,{color:colors.text}]}>{assignment.title}</Text>
      <Text style={[s.course,{color:colors.muted}]}>{course?.code} · {course?.name}</Text>
      <View style={s.row}><Clock3 size={14} color={colors.muted}/><Text style={[s.time,{color:colors.muted}]}>{assignment.dueAt}</Text></View>
    </View>
    {assignment.pointsPossible?<Text style={[s.points,{color:colors.muted}]}>{assignment.pointsPossible} pts</Text>:null}
  </View>
}
const s=StyleSheet.create({card:{flexDirection:'row',gap:12,padding:16,borderRadius:radius.md,borderWidth:1,marginBottom:10},dot:{width:4,borderRadius:99},body:{flex:1},title:{fontSize:16,fontWeight:'700',marginBottom:4},course:{fontSize:13,marginBottom:10},row:{flexDirection:'row',alignItems:'center',gap:5},time:{fontSize:13},points:{fontSize:12,fontWeight:'600'}});
