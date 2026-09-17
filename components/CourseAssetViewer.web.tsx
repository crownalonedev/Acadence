import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ArrowUpRight, FileText, X } from 'lucide-react-native';
import { CanvasRichContent } from '@/components/CanvasRichContent';
import { useAppTheme } from '@/context/ThemeContext';

const API = (
  process.env.EXPO_PUBLIC_ACADENCE_API_URL || 'http://localhost:8787'
).replace(/\/$/, '');

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
  if (item.html) return 'html';
  if (type.includes('pdf') || ext === 'pdf') return 'pdf';
  if (type.startsWith('video/') || ['mp4', 'mov', 'webm', 'm4v', 'ogv'].includes(ext)) return 'video';
  if (type.startsWith('audio/') || ['mp3', 'wav', 'm4a', 'aac', 'ogg', 'flac'].includes(ext)) return 'audio';
  if (type.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'heic'].includes(ext)) return 'image';
  if (
    ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext) ||
    type.includes('word') ||
    type.includes('excel') ||
    type.includes('spreadsheet') ||
    type.includes('powerpoint') ||
    type.includes('presentation')
  ) return 'office';
  if (type.startsWith('text/') || ['txt', 'csv', 'json', 'xml', 'md', 'html', 'htm'].includes(ext)) return 'text';
  return 'frame';
};

export function CourseAssetViewer({ item, onClose }: { item: CourseViewerItem; onClose: () => void }) {
  const { colors } = useAppTheme();
  const type = family(item);
  const proxied = item.fileId
    ? `${API}/api/connector/files/${encodeURIComponent(item.fileId)}/content`
    : undefined;
  const rawUrl = proxied || item.publicUrl || item.url || item.canvasUrl;
  const officeUrl = useMemo(
    () =>
      item.publicUrl
        ? `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(item.publicUrl)}`
        : undefined,
    [item.publicUrl],
  );
  const displayUrl = type === 'office' ? officeUrl : rawUrl;

  return (
    <View style={[s.wrap, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
      <View style={[s.head, { borderBottomColor: colors.border }]}> 
        <View style={[s.icon, { backgroundColor: colors.accentSoft }]}>
          <FileText size={17} color={colors.accent} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text numberOfLines={1} style={[s.title, { color: colors.text }]}>{item.title}</Text>
          <Text style={[s.sub, { color: colors.muted }]}>Acadence viewer</Text>
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
        {type === 'html' && item.html ? (
          <div style={{ padding: 24, minHeight: 360, overflow: 'auto' }}>
            <CanvasRichContent html={item.html} baseUrl={item.baseUrl} minHeight={300} />
          </div>
        ) : !displayUrl ? (
          <View style={s.empty}>
            <Text style={[s.emptyTitle, { color: colors.text }]}>Preview unavailable</Text>
            <Text style={[s.emptyText, { color: colors.muted }]}>Reload the Acadence extension and sync Canvas once. If the school still blocks the preview, use the Canvas button.</Text>
          </View>
        ) : type === 'video' ? (
          <video src={displayUrl} controls playsInline style={{ width: '100%', height: '100%', maxHeight: 720, background: '#0d1511' }} />
        ) : type === 'audio' ? (
          <div style={{ display: 'flex', minHeight: 280, width: '100%', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
            <audio src={displayUrl} controls style={{ width: 'min(720px, 100%)' }} />
          </div>
        ) : type === 'image' ? (
          <div style={{ display: 'flex', minHeight: 480, width: '100%', alignItems: 'center', justifyContent: 'center', padding: 24, overflow: 'auto' }}>
            <img src={displayUrl} alt={item.title} style={{ maxWidth: '100%', maxHeight: '72vh', objectFit: 'contain' }} />
          </div>
        ) : (
          <iframe
            title={item.title}
            src={displayUrl}
            style={{ width: '100%', height: '72vh', minHeight: 560, border: 0, background: '#fff' }}
            allow="autoplay; fullscreen"
          />
        )}
      </View>
      <Text style={[s.note, { color: colors.muted }]}>PDFs and media stream through Acadence using the temporary signed URL Canvas gives the student. Office files use an embedded document renderer. If a signed URL expires, reload the extension and sync Canvas again.</Text>
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
  empty: { minHeight: 360, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 7 },
  emptyTitle: { fontSize: 15, fontWeight: '900' },
  emptyText: { fontSize: 12, lineHeight: 18, textAlign: 'center', maxWidth: 520 },
  note: { fontSize: 10, lineHeight: 15, padding: 12 },
});
