import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import {
  ArrowUpRight,
  Bell,
  BookOpen,
  Check,
  Clock3,
  GraduationCap,
} from "lucide-react-native";
import { Screen } from "@/components/Screen";
import { radius } from "@/constants/theme";
import { useAppTheme } from "@/context/ThemeContext";
import { useNotifications } from "@/context/NotificationsContext";

export default function Notifications() {
  const { colors, isDark } = useAppTheme();
  const { notices, unread, mark, markAll, status, error } = useNotifications();
  return (
    <Screen>
      <Text style={[s.eyebrow, { color: colors.accent }]}>ACADENCE</Text>
      <Text style={[s.title, { color: colors.text }]}>Notifications</Text>
      <Text style={[s.sub, { color: colors.muted }]}>
        Updates from your Canvas courses, assignments, and grades.
      </Text>
      <View style={s.toolbar}>
        <Text accessibilityLiveRegion="polite" style={{ color: colors.muted }}>
          {unread ? `${unread} unread` : "You’re all caught up"}
        </Text>
        {unread > 0 && (
          <Pressable
            accessibilityRole="button"
            onPress={markAll}
            style={s.action}
          >
            <Check size={15} color={colors.accent} />
            <Text style={[s.actionText, { color: colors.accent }]}>
              Mark all read
            </Text>
          </Pressable>
        )}
      </View>
      {error && (
        <Text
          accessibilityRole="alert"
          style={[s.body, { color: colors.danger }]}
        >
          {error}
        </Text>
      )}
      {!notices.length && (
        <Text style={[s.body, { color: colors.muted }]}>
          {status ||
            "No notifications yet. New Canvas updates will appear here."}
        </Text>
      )}
      <View style={s.list}>
        {notices.map((n) => {
          const Icon =
            n.kind === "grade"
              ? GraduationCap
              : n.kind === "assignment"
                ? BookOpen
                : Bell;
          return (
            <View
              key={n.id}
              style={[
                s.card,
                {
                  backgroundColor: isDark
                    ? colors.surfaceElevated
                    : colors.surface,
                  borderColor: n.read ? colors.border : colors.accent,
                },
              ]}
            >
              <View style={[s.icon, { backgroundColor: colors.accentSoft }]}>
                <Icon size={19} color={colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.cardTitle, { color: colors.text }]}>
                  {n.title}
                  {!n.read ? " · Unread" : ""}
                </Text>
                <Text style={[s.body, { color: colors.muted }]}>{n.body}</Text>
                <View style={s.time}>
                  <Clock3 size={12} color={colors.muted} />
                  <Text style={[s.timeText, { color: colors.muted }]}>
                    {n.time}
                  </Text>
                </View>
                <View style={s.toolbar}>
                  {n.read ? (
                    <Text style={[s.timeText, { color: colors.muted }]}>
                      Read
                    </Text>
                  ) : (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Mark ${n.title} as read`}
                      onPress={() => mark(n.id)}
                      style={s.action}
                    >
                      <Check size={14} color={colors.accent} />
                      <Text style={[s.actionText, { color: colors.accent }]}>
                        Mark as read
                      </Text>
                    </Pressable>
                  )}
                  {n.htmlUrl && (
                    <Pressable
                      accessibilityRole="link"
                      onPress={() => {
                        void Linking.openURL(n.htmlUrl!);
                      }}
                      style={s.action}
                    >
                      <Text style={[s.actionText, { color: colors.accent }]}>
                        Open in Canvas
                      </Text>
                      <ArrowUpRight size={14} color={colors.accent} />
                    </Pressable>
                  )}
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </Screen>
  );
}
const s = StyleSheet.create({
  eyebrow: { fontSize: 11, fontWeight: "800", letterSpacing: 1, marginTop: 12 },
  title: { fontSize: 30, fontWeight: "800", letterSpacing: -0.8, marginTop: 7 },
  sub: { fontSize: 14, marginTop: 6, marginBottom: 16 },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 12,
    marginVertical: 12,
  },
  action: {
    flexDirection: "row",
    gap: 5,
    alignItems: "center",
    paddingVertical: 5,
  },
  actionText: { fontSize: 12, fontWeight: "700" },
  list: { gap: 10 },
  card: {
    flexDirection: "row",
    gap: 13,
    padding: 17,
    borderWidth: 1,
    borderRadius: radius.md,
  },
  icon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: { fontSize: 15, fontWeight: "800" },
  body: { fontSize: 13, lineHeight: 20, marginTop: 5, maxWidth: 760 },
  time: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 10 },
  timeText: { fontSize: 11 },
});
