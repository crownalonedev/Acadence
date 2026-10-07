import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { ArrowUpRight, FileText, X } from 'lucide-react-native';
import { CanvasRichContent } from '@/components/CanvasRichContent';
import { useAppTheme } from '@/context/ThemeContext';

export type CourseViewerItem = {
  title: string;
  url?: string;
  publicUrl?: string;
  canvasUrl?: string;
  contentType?: string;
  filename?: string;
  fileId?: string;
  html?: string;
  baseUrl?: string;
};

export function CourseAssetViewer({ item, onClose }: { item: CourseViewerItem; onClose: () => void }) {
  const { colors } = useAppTheme();
  const url = item.canvasUrl || item.url || item.publicUrl;
  return (
    <View style={[s.wrap, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
      <View style={s.head}>
        <FileText size={18} color={colors.accent} />
        <Text numberOfLines={1} style={[s.title, { color: colors.text }]}>{item.title}</Text>
        <Pressable onPress={onClose}><X size={18} color={colors.muted} /></Pressable>
      </View>
      {item.html ? (
        <View style={s.rich}><CanvasRichContent html={item.html} baseUrl={item.baseUrl} /></View>
      ) : (
        <Text style={[s.copy, { color: colors.muted }]}>Built-in binary file previews are available on the web app. You can still open this item in Canvas here.</Text>
      )}
      {url ? (
        <Pressable onPress={() => void Linking.openURL(url)} style={[s.button, { backgroundColor: colors.accentSoft }]}> 
          <ArrowUpRight size={15} color={colors.accent} />
          <Text style={[s.buttonText, { color: colors.accent }]}>Open item</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { borderWidth: 1, borderRadius: 16, padding: 16 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  title: { flex: 1, fontWeight: '900' },
  rich: { marginTop: 14 },
  copy: { fontSize: 12, lineHeight: 18, marginTop: 14 },
  button: { alignSelf: 'flex-start', minHeight: 36, borderRadius: 10, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14 },
  buttonText: { fontWeight: '900', fontSize: 12 },
});
