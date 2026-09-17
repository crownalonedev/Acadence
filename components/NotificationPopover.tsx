import { useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
  SlideInDown,
  SlideOutUp,
} from "react-native-reanimated";
import {
  Bell,
  BookOpen,
  Check,
  Clock3,
  GraduationCap,
  X,
} from "lucide-react-native";
import { useAppTheme } from "@/context/ThemeContext";
import { useNotifications } from "@/context/NotificationsContext";
import { CanvasNotice } from "@/services/notifications";
import { useRouter } from "expo-router";
function NoticeIcon({
  kind,
  color,
}: {
  kind: CanvasNotice["kind"];
  color: string;
}) {
  if (kind === "grade") return <GraduationCap size={17} color={color} />;
  if (kind === "assignment") return <BookOpen size={17} color={color} />;
  return <Bell size={17} color={color} />;
}
export function NotificationPopover({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { colors } = useAppTheme();
  const { width, height } = useWindowDimensions();
  const router = useRouter();
  const { notices, unread, mark, markAll, status, error } = useNotifications();
  const preview = notices.slice(0, 3);
  const [expanded, setExpanded] = useState(false);
  if (!visible) return null;
  const panelWidth = Math.min(410, Math.max(300, width - 32));
  const card = (
    <Animated.View
      entering={
        Platform.OS === "web" ? FadeIn.duration(140) : SlideInDown.duration(220)
      }
      exiting={
        Platform.OS === "web" ? FadeOut.duration(110) : SlideOutUp.duration(160)
      }
      style={[
        s.panel,
        {
          width: panelWidth,
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={s.header}>
        <View>
          <Text style={[s.heading, { color: colors.text }]}>Notifications</Text>
          <Text style={[s.sub, { color: colors.muted }]}>
            {unread ? `${unread} unread` : "You’re all caught up"}
          </Text>
        </View>
        <View style={s.actions}>
          {unread > 0 && (
            <Pressable onPress={markAll} style={s.textAction}>
              <Check size={14} color={colors.accent} />
              <Text style={[s.actionText, { color: colors.accent }]}>
                Mark all read
              </Text>
            </Pressable>
          )}
          <Pressable
            onPress={onClose}
            style={[s.close, { borderColor: colors.border }]}
          >
            <X size={17} color={colors.muted} />
          </Pressable>
        </View>
      </View>
      <View style={[s.divider, { backgroundColor: colors.border }]} />
      <ScrollView
        style={{ maxHeight: Math.max(160, height - 260) }}
        contentContainerStyle={s.stack}
      >
        {!notices.length && (
          <Text style={[s.body, { color: colors.muted, padding: 12 }]}>
            {status || "No notifications yet. You’re all caught up."}
          </Text>
        )}
        {preview.map((n, index) => {
          const stacked = !expanded && index > 0;
          return (
            <Animated.View
              key={n.id}
              layout={LinearTransition.duration(180)}
              entering={FadeIn.delay(index * 35).duration(160)}
              style={[s.cardWrap, stacked && { marginTop: -48, zIndex: index }]}
            >
              <Pressable
                onPress={() => {
                  mark(n.id);
                  setExpanded(true);
                }}
                style={[
                  s.notice,
                  {
                    backgroundColor: n.read
                      ? colors.background
                      : colors.accentSoft,
                    borderColor: n.read ? colors.border : colors.accent,
                  },
                ]}
              >
                <View style={[s.iconBox, { backgroundColor: colors.surface }]}>
                  <NoticeIcon
                    kind={n.kind}
                    color={n.read ? colors.muted : colors.accent}
                  />
                </View>
                <View style={s.copy}>
                  <View style={s.titleRow}>
                    <Text
                      numberOfLines={1}
                      style={[s.noticeTitle, { color: colors.text }]}
                    >
                      {n.title}
                    </Text>
                    {!n.read && (
                      <View
                        style={[s.dot, { backgroundColor: colors.accent }]}
                      />
                    )}
                  </View>
                  <Text
                    numberOfLines={expanded ? 3 : 2}
                    style={[s.body, { color: colors.muted }]}
                  >
                    {n.body}
                  </Text>
                  <View style={s.timeRow}>
                    <Clock3 size={11} color={colors.muted} />
                    <Text style={[s.time, { color: colors.muted }]}>
                      {n.time}
                    </Text>
                  </View>
                </View>
              </Pressable>
            </Animated.View>
          );
        })}
      </ScrollView>
      {error && (
        <Text
          accessibilityRole="alert"
          style={[s.body, { color: colors.danger, padding: 8 }]}
        >
          {error}
        </Text>
      )}
      <Pressable
        onPress={() => setExpanded((v) => !v)}
        style={[s.viewAll, { borderColor: colors.border }]}
      >
        <Text style={[s.viewAllText, { color: colors.accent }]}>
          {expanded ? "Collapse" : "Expand"}
        </Text>
      </Pressable>
      <Pressable
        onPress={() => {
          onClose();
          router.push("/(tabs)/notifications" as any);
        }}
        style={s.viewAll}
      >
        <Text style={[s.viewAllText, { color: colors.accent }]}>
          View all ({notices.length})
        </Text>
      </Pressable>
    </Animated.View>
  );
  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={s.modalRoot}>
        <Pressable
          style={[StyleSheet.absoluteFill, s.backdrop]}
          onPress={onClose}
        />
        <View
          pointerEvents="box-none"
          style={Platform.OS === "web" ? s.webAnchor : s.nativeAnchor}
        >
          {card}
        </View>
      </View>
    </Modal>
  );
}
const s = StyleSheet.create({
  modalRoot: { flex: 1, zIndex: 2147483647, elevation: 1000 },
  backdrop: { backgroundColor: "rgba(20,35,28,.035)" },
  webAnchor: {
    position: "absolute",
    top: 92,
    right: 28,
    alignItems: "flex-end",
  },
  nativeAnchor: {
    position: "absolute",
    top: 72,
    right: 16,
    left: 16,
    alignItems: "flex-end",
  },
  panel: {
    position: "relative",
    zIndex: 2,
    borderWidth: 1,
    borderRadius: 20,
    padding: 10,
    overflow: "hidden",
    boxShadow: "0 20px 60px rgba(20,35,28,.22)" as any,
    elevation: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 10,
    gap: 10,
  },
  heading: { fontSize: 18, fontWeight: "800" },
  sub: { fontSize: 12, marginTop: 2 },
  actions: { flexDirection: "row", alignItems: "center", gap: 6 },
  textAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    padding: 6,
  },
  actionText: { fontSize: 12, fontWeight: "700" },
  close: {
    width: 30,
    height: 30,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  divider: { height: 1, marginHorizontal: 4, marginBottom: 8 },
  stack: { paddingHorizontal: 4, paddingTop: 2 },
  cardWrap: { width: "100%" },
  notice: {
    minHeight: 88,
    flexDirection: "row",
    gap: 11,
    padding: 12,
    borderRadius: 15,
    borderWidth: 1,
    boxShadow: "0 5px 16px rgba(20,35,28,.08)" as any,
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  copy: { flex: 1 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  noticeTitle: { fontSize: 13, fontWeight: "800", flex: 1 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  body: { fontSize: 12, lineHeight: 17, marginTop: 3 },
  timeRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 7 },
  time: { fontSize: 10 },
  viewAll: {
    height: 36,
    marginTop: 9,
    borderTopWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  viewAllText: { fontSize: 12, fontWeight: "800" },
});
