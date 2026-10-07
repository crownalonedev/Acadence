import { StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '@/context/ThemeContext';

function plainText(value: string) {
  return String(value || '')
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_m, text) => `\n• ${plainText(text)}`)
    .replace(/<\/(p|div|section|article|tr|table|ul|ol|h[1-6])>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function CanvasRichContent({ html }: { html: string; baseUrl?: string; minHeight?: number }) {
  const { colors } = useAppTheme();
  return (
    <View>
      <Text selectable style={[s.text, { color: colors.text }]}>{plainText(html)}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  text: { fontSize: 14, lineHeight: 23 },
});
