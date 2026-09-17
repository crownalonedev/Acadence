import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ArrowUpRight, FileText, X } from 'lucide-react-native';
import { useAppTheme } from '@/context/ThemeContext';

export type CourseViewerItem = {
  title: string;
  url?: string;
  canvasUrl?: string;
  contentType?: string;
  filename?: string;
};

const extension = (item: CourseViewerItem) =>
  (item.filename || item.title || item.url || '')
    .split('?')[0]
    .split('#')[0]
    .split('.')
    .pop()
    ?.toLowerCase() || '';

const family = (item: CourseViewerItem) => {
  const type = String(item.contentType || '').toLowerCase();
  const ext = extension(item);
  if (type.includes('pdf') || ext === 'pdf') return 'pdf';
  if (type.startsWith('video/') || ['mp4', 'mov', 'webm', 'm4v', 'ogv'].includes(ext)) return 'video';
  if (type.startsWith('audio/') || ['mp3', 'wav', 'm4a', 'aac', 'ogg', 'flac'].includes(ext)) return 'audio';
  if (type.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'heic'].includes(ext)) return 'image';
  if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext)) return 'office';
  return 'frame';
};

export function CourseAssetViewer({ item, onClose }: { item: CourseViewerItem; onClose: () => void }) {
  const { colors } = useAppTheme();
  const url = item.url || item.canvasUrl;
  const type = family(item);
  const officeUrl =
    type === 'office' && url
      ? `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`
      : url;

  return (
    <View style={[s.wrap, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
      <View style={[s.head, { borderBottomColor: colors.border }]}> 
        <View style={[s.icon, { backgroundColor: colors.accentSoft }]}>
          <FileText size={17} color={colors.accent} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text numberOfLines={1} style={[s.title, { color: colors.text }]}>{item.title}</Text>
          <Text style={[s.sub, { color: colors.muted }]}>Built-in course viewer</Text>
        </View>
        {item.canvasUrl ? (
          <Pressable
            onPress={() => window.open(item.canvasUrl, '_blank', 'noopener,noreferrer')}
            style={({ hovered }: any) => [s.action, { borderColor: colors.border }, hovered && { transform: [{ translateY: -1 }] }]}
          >
            <ArrowUpRight size={14} color={colors.accent} />
            <Text style={[s.actionText, { color: colors.accent }]}>Canvas</Text>
          </Pressable>
        ) : null}
        <Pressable onPress={onClose} style={[s.close, { borderColor: colors.border }]}>
          <X size={17} color={colors.muted} />
        </Pressable>
      </View>

      <View style={s.stage}>
        {!url ? (
          <View style={s.empty}><Text style={[s.emptyText, { color: colors.muted }]}>This item does not expose a preview URL.</Text></View>
        ) : type === 'video' ? (
          <video src={url} controls playsInline style={{ width: '100%', height: '100%', maxHeight: 720, background: '#0d1511' }} />
        ) : type === 'audio' ? (
          <div style={{ display: 'flex', minHeight: 280, width: '100%', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
            <audio src={url} controls style={{ width: 'min(720px, 100%)' }} />
          </div>
        ) : type === 'image' ? (
          <div style={{ display: 'flex', minHeight: 480, width: '100%', alignItems: 'center', justifyContent: 'center', padding: 24, overflow: 'auto' }}>
            <img src={url} alt={item.title} style={{ maxWidth: '100%', maxHeight: '72vh', objectFit: 'contain' }} />
          </div>
        ) : (
          <iframe
            title={item.title}
            src={officeUrl}
            style={{ width: '100%', height: '72vh', minHeight: 560, border: 0, background: '#fff' }}
            allow="autoplay; fullscreen"
          />
        )}
      </View>
      <Text style={[s.note, { color: colors.muted }]}>PDFs, media, images and common Office documents open here when Canvas provides a usable preview/download URL. If an institution blocks embedding, use the Canvas button above.</Text>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { borderWidth: 1, borderRadius: 18, overflow: 'hidden' },
  head: { minHeight: 64, borderBottomWidth: 1, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  icon: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 14, fontWeight: '900' },
  sub: { fontSize: 10, marginTop: 2 },
  action: { height: 34, borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 5 },
  actionText: { fontSize: 11, fontWeight: '900' },
  close: { width: 34, height: 34, borderWidth: 1, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  stage: { minHeight: 360 },
  empty: { minHeight: 360, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyText: { fontSize: 13 },
  note: { fontSize: 10, lineHeight: 15, padding: 12 },
});
