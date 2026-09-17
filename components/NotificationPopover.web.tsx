import { useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "expo-router";
import { ArrowUpRight, Check, X } from "lucide-react-native";
import { useAppTheme } from "@/context/ThemeContext";
import { useNotifications } from "@/context/NotificationsContext";

const spring = "cubic-bezier(.2,.8,.2,1)",
  font = 'system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif';
export function NotificationPopover({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { colors } = useAppTheme();
  const router = useRouter();
  const { notices, unread, mark, markAll, status, error } = useNotifications();
  const preview = notices.slice(0, 3);
  const [hovered, setHovered] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = notices.find((n) => n.id === selectedId) || null;
  if (!visible || typeof document === "undefined") return null;
  const expanded = hovered || !!selected;
  const viewAll = () => {
    onClose();
    router.push("/(tabs)/notifications" as any);
  };
  const panel = (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2147483647,
        pointerEvents: "none",
        fontFamily: font,
      }}
    >
      <button
        aria-label="Close notifications"
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          border: 0,
          padding: 0,
          background: "rgba(20,35,28,.025)",
          pointerEvents: "auto",
          cursor: "default",
        }}
      />
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          position: "absolute",
          right: 28,
          top: 92,
          width: 320,
          maxWidth: "calc(100vw - 32px)",
          padding: 12,
          borderRadius: 24,
          background: colors.border,
          boxShadow: "0 18px 48px rgba(20,35,28,.16)",
          pointerEvents: "auto",
        }}
      >
        <div>
          {!notices.length && (
            <div
              role="status"
              style={{ padding: 16, fontSize: 13, color: colors.muted }}
            >
              {status || "No notifications yet. You’re all caught up."}
            </div>
          )}
          {preview.map((n, i) => (
            <div
              key={n.id}
              role="button"
              tabIndex={0}
              aria-label={n.title}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setSelectedId(n.id);
                }
              }}
              onClick={() => setSelectedId(n.id)}
              style={{
                position: "relative",
                zIndex: preview.length - i,
                marginTop: i === 0 ? 0 : expanded ? 4 : -44,
                transform: `scaleX(${expanded ? 1 : 1 - i * 0.05})`,
                transformOrigin: "center top",
                padding: "11px 16px",
                borderRadius: 12,
                background: colors.surface,
                boxShadow: expanded
                  ? "0 8px 20px rgba(20,35,28,.10)"
                  : "0 2px 7px rgba(20,35,28,.06)",
                transition: `margin-top 420ms ${spring}, transform 420ms ${spring}, box-shadow 200ms ease`,
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                }}
              >
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    fontSize: 14,
                    fontWeight: 800,
                    color: colors.text,
                  }}
                >
                  {!n.read && (
                    <span
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: 99,
                        background: colors.accent,
                        flex: "0 0 auto",
                      }}
                    />
                  )}
                  {n.title}
                </span>
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: colors.muted,
                  marginTop: 3,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {n.time} · {n.body}
              </div>
            </div>
          ))}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
            marginTop: 12,
          }}
        >
          <button
            onClick={viewAll}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              border: 0,
              background: "transparent",
              padding: 0,
              color: colors.muted,
              fontFamily: font,
              cursor: "pointer",
            }}
          >
            <span
              style={{
                width: 20,
                height: 20,
                borderRadius: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
                fontWeight: 800,
                color: "#fff",
                background: colors.muted,
              }}
            >
              {notices.length}
            </span>
            <span style={{ display: "grid", fontSize: 13, fontWeight: 700 }}>
              <span
                style={{
                  gridArea: "1 / 1",
                  opacity: expanded ? 0 : 1,
                  transform: `translateY(${expanded ? -16 : 0}px)`,
                  transition:
                    "opacity 220ms ease-in-out, transform 220ms ease-in-out",
                }}
              >
                Notifications
              </span>
              <span
                style={{
                  gridArea: "1 / 1",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  opacity: expanded ? 1 : 0,
                  transform: `translateY(${expanded ? 0 : 16}px)`,
                  transition:
                    "opacity 220ms ease-in-out, transform 220ms ease-in-out",
                }}
              >
                View all <ArrowUpRight size={15} color={colors.muted} />
              </span>
            </span>
          </button>
          {unread > 0 && (
            <button
              onClick={markAll}
              style={{
                border: 0,
                background: "transparent",
                padding: "4px 2px",
                display: "flex",
                alignItems: "center",
                gap: 4,
                color: colors.accent,
                fontFamily: font,
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              <Check size={13} color={colors.accent} />
              Mark all read
            </button>
          )}
        </div>
        {error && (
          <div
            role="alert"
            style={{ fontSize: 12, color: colors.danger, marginTop: 8 }}
          >
            {error}
          </div>
        )}
      </div>
      {selected && (
        <div
          onMouseEnter={() => setHovered(true)}
          className="acadence-notification-detail"
          role="dialog"
          aria-label={selected.title}
          style={{
            position: "absolute",
            right: 364,
            top: 92,
            width: 330,
            maxHeight: "calc(100vh - 130px)",
            overflowY: "auto",
            maxWidth: "calc(100vw - 32px)",
            padding: 18,
            borderRadius: 18,
            border: `1px solid ${colors.border}`,
            background: colors.surface,
            boxShadow: "0 18px 48px rgba(20,35,28,.18)",
            pointerEvents: "auto",
            transformOrigin: "right top",
            animation: "acadencePopoverSpring 360ms cubic-bezier(.16,1,.3,1)",
          }}
        >
          <button
            onClick={() => setSelectedId(null)}
            aria-label="Close notification detail"
            style={{
              position: "absolute",
              right: 12,
              top: 12,
              width: 28,
              height: 28,
              borderRadius: 9,
              border: `1px solid ${colors.border}`,
              background: colors.background,
              display: "grid",
              placeItems: "center",
              cursor: "pointer",
            }}
          >
            <X size={15} color={colors.muted} />
          </button>
          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              color: colors.accent,
              marginBottom: 7,
              letterSpacing: ".04em",
            }}
          >
            NOTIFICATION
          </div>
          <div
            style={{
              fontSize: 17,
              fontWeight: 800,
              color: colors.text,
              paddingRight: 30,
            }}
          >
            {selected.title}
          </div>
          <div style={{ fontSize: 12, color: colors.muted, marginTop: 5 }}>
            {selected.time}
          </div>
          <div
            style={{
              fontSize: 14,
              lineHeight: "21px",
              fontWeight: 400,
              color: colors.text,
              marginTop: 14,
            }}
          >
            {selected.body}
          </div>
          {selected.htmlUrl && (
            <a
              href={selected.htmlUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "block",
                color: colors.accent,
                fontSize: 13,
                marginTop: 12,
              }}
            >
              Open in Canvas <ArrowUpRight size={13} color={colors.accent} />
            </a>
          )}
          {!selected.read ? (
            <button
              onClick={() => mark(selected.id)}
              style={{
                marginTop: 16,
                height: 36,
                borderRadius: 10,
                border: 0,
                padding: "0 13px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                background: colors.accent,
                color: "#fff",
                fontFamily: font,
                fontSize: 13,
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              <Check size={15} color="#fff" />
              Mark as read
            </button>
          ) : (
            <div
              style={{
                marginTop: 16,
                display: "flex",
                alignItems: "center",
                gap: 5,
                fontSize: 12,
                fontWeight: 700,
                color: colors.muted,
              }}
            >
              <Check size={14} color={colors.muted} />
              Read
            </div>
          )}
        </div>
      )}
      <style>{`@media(max-width:760px){.acadence-notification-detail{right:16px!important;top:auto!important;bottom:16px;max-height:60vh!important;box-sizing:border-box}}@keyframes acadencePopoverSpring{0%{opacity:0;transform:translateX(10px) scale(.94)}65%{opacity:1;transform:translateX(-1px) scale(1.008)}100%{opacity:1;transform:translateX(0) scale(1)}}`}</style>
    </div>
  );
  return createPortal(panel, document.body);
}
