import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  restrictToParentElement,
  restrictToVerticalAxis,
} from '@dnd-kit/modifiers';
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  GripVertical,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
} from 'lucide-react-native';
import { navigationItems, NavigationItemId } from '@/constants/navigation';
import { useNavigationPreferences } from '@/context/NavigationContext';
import { useCanvasData } from '@/context/CanvasDataContext';
import { useAppTheme } from '@/context/ThemeContext';

const FOCUS_SECONDS = 10 * 60;

function formatFocusTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function SortableNavItem({
  id,
  active,
  colors,
}: {
  id: NavigationItemId;
  active: boolean;
  colors: any;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });
  const item = navigationItems[id];
  const Icon = item.icon;
  const t = transform
    ? { x: 0, y: transform.y, scaleX: 1, scaleY: 1 }
    : null;

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(t),
        transition: isDragging ? undefined : transition,
        width: '100%',
        zIndex: isDragging ? 30 : 1,
        position: 'relative',
      }}
      {...attributes}
    >
      <View
        style={[
          s.item,
          {
            backgroundColor: isDragging
              ? colors.accentSoft
              : active
                ? colors.accentSoft
                : colors.background,
            borderColor: isDragging ? colors.accent : colors.border,
          },
        ]}
      >
        <Icon
          size={19}
          color={active || isDragging ? colors.accent : colors.text}
        />
        <Text
          style={[
            s.label,
            { color: active || isDragging ? colors.accent : colors.text },
          ]}
        >
          {item.label}
        </Text>
        <div
          {...listeners}
          style={{
            cursor: isDragging ? 'grabbing' : 'grab',
            touchAction: 'none',
            userSelect: 'none',
            padding: 5,
          }}
        >
          <GripVertical size={18} color={colors.muted} />
        </div>
      </View>
    </div>
  );
}

export function DesktopSidebar() {
  const router = useRouter();
  const path = usePathname();
  const { items, setItems, editing } = useNavigationPreferences();
  const { colors, isDark } = useAppTheme();
  const { profile } = useCanvasData();
  const [secretOpen, setSecretOpen] = useState(false);
  const [focusRunning, setFocusRunning] = useState(false);
  const [focusSeconds, setFocusSeconds] = useState(FOCUS_SECONDS);

  const main = items.filter((id) => id !== 'profile');
  const profileItem = navigationItems.profile;
  const ProfileIcon = profileItem.icon;
  const profileActive = path.includes('settings');
  const studentName = profile?.name?.trim() || 'You';
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  useEffect(() => {
    if (!focusRunning) return;
    const interval = setInterval(() => {
      setFocusSeconds((seconds) => {
        if (seconds <= 1) {
          setFocusRunning(false);
          return 0;
        }
        return seconds - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [focusRunning]);

  const end = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    const from = main.indexOf(e.active.id as NavigationItemId);
    const to = main.indexOf(e.over.id as NavigationItemId);
    if (from < 0 || to < 0) return;
    const reordered = arrayMove(main, from, to);
    const profileIndex = items.indexOf('profile');
    setItems(profileIndex >= 0 ? [...reordered, 'profile'] : reordered);
  };

  const toggleFocus = () => {
    if (focusSeconds === 0) {
      setFocusSeconds(FOCUS_SECONDS);
      setFocusRunning(true);
      return;
    }
    setFocusRunning((running) => !running);
  };

  const resetFocus = () => {
    setFocusRunning(false);
    setFocusSeconds(FOCUS_SECONDS);
  };

  const renderNormal = main.map((id) => {
    const item = navigationItems[id];
    const Icon = item.icon;
    const active =
      id === 'home'
        ? path === '/' || path.endsWith('/(tabs)')
        : path.includes(item.route);

    return (
      <Pressable
        key={id}
        onPress={() =>
          router.push(
            item.route === 'index'
              ? '/(tabs)'
              : (`/(tabs)/${item.route}` as any),
          )
        }
        style={[
          s.item,
          {
            backgroundColor: active ? colors.accentSoft : colors.background,
            borderColor: active ? colors.accentSoft : colors.border,
          },
        ]}
      >
        <Icon size={19} color={active ? colors.accent : colors.text} />
        <Text
          style={[s.label, { color: active ? colors.accent : colors.text }]}
        >
          {item.label}
        </Text>
      </Pressable>
    );
  });

  return (
    <View
      style={[
        s.sidebar,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Acadence"
          accessibilityHint="Open a hidden study focus tool"
          onPress={() => setSecretOpen((open) => !open)}
          style={({ pressed }) => [
            s.brandDepth,
            pressed && s.brandDepthPressed,
          ]}
        >
          <View
            style={[
              s.brandPill,
              {
                backgroundColor: focusRunning ? '#F7D9A4' : '#BDE7CE',
              },
            ]}
          >
            <View pointerEvents="none" style={s.brandHighlight} />
            <Text style={s.brand}>acadence</Text>
            <View
              style={[
                s.secretDot,
                {
                  backgroundColor: focusRunning ? '#E79B61' : '#CE7378',
                },
              ]}
            />
          </View>
        </Pressable>
        <Text style={[s.semester, { color: colors.muted }]}>Current semester</Text>

        {secretOpen ? (
          <View
            style={[
              s.secretCard,
              {
                backgroundColor: isDark ? '#242C27' : '#FFF2E7',
                borderColor: isDark ? '#704C50' : '#E7A9AD',
              },
            ]}
          >
            <View style={s.secretTitleRow}>
              <View style={s.secretSparkle}>
                <Sparkles size={13} color="#A95660" />
              </View>
              <Text style={[s.secretTitle, { color: colors.text }]}>Secret study sprint</Text>
            </View>

            <Text style={[s.secretCopy, { color: colors.muted }]}> 
              {focusSeconds === 0
                ? 'Nice. Ten focused minutes, done.'
                : 'Pick one thing and give it ten distraction-free minutes.'}
            </Text>

            <View
              style={[
                s.timerChip,
                {
                  backgroundColor: isDark ? '#30453A' : '#DDEFE4',
                },
              ]}
            >
              <Text style={s.timerText}>{formatFocusTime(focusSeconds)}</Text>
            </View>

            <View style={s.secretActions}>
              <Pressable
                accessibilityRole="button"
                onPress={toggleFocus}
                style={({ pressed }) => [
                  s.focusButton,
                  pressed && { transform: [{ translateY: 1 }] },
                ]}
              >
                {focusRunning ? (
                  <Pause size={13} color="#FFF9F3" fill="#FFF9F3" />
                ) : (
                  <Play size={13} color="#FFF9F3" fill="#FFF9F3" />
                )}
                <Text style={s.focusButtonText}>
                  {focusRunning ? 'Pause' : focusSeconds === 0 ? 'Again' : 'Start'}
                </Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Reset focus timer"
                onPress={resetFocus}
                style={[
                  s.resetButton,
                  { borderColor: isDark ? '#506159' : '#D8C9BE' },
                ]}
              >
                <RotateCcw size={13} color={colors.muted} />
              </Pressable>
            </View>
          </View>
        ) : null}
      </View>

      <View style={s.nav}>
        {editing ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis, restrictToParentElement]}
            onDragEnd={end}
          >
            <SortableContext
              items={main}
              strategy={verticalListSortingStrategy}
            >
              <View style={{ gap: 5 }}>
                {main.map((id) => (
                  <SortableNavItem
                    key={id}
                    id={id}
                    active={
                      id === 'home'
                        ? path === '/' || path.endsWith('/(tabs)')
                        : path.includes(navigationItems[id].route)
                    }
                    colors={colors}
                  />
                ))}
              </View>
            </SortableContext>
          </DndContext>
        ) : (
          renderNormal
        )}
      </View>

      <View style={{ flex: 1 }} />

      <Pressable
        onPress={() => router.push('/(tabs)/ai')}
        style={[
          s.ai,
          { borderColor: colors.border, backgroundColor: colors.background },
        ]}
      >
        <Sparkles size={17} color={colors.accent} />
        <View>
          <Text style={[s.aiTitle, { color: colors.text }]}>Ask Acadence</Text>
          <Text style={[s.aiSub, { color: colors.muted }]}>Your academic assistant</Text>
        </View>
      </Pressable>

      <Pressable
        onPress={() => router.push('/(tabs)/settings')}
        style={[
          s.item,
          {
            backgroundColor: profileActive
              ? colors.accentSoft
              : colors.background,
            borderColor: colors.border,
          },
        ]}
      >
        <ProfileIcon
          size={19}
          color={profileActive ? colors.accent : colors.text}
        />
        <Text
          numberOfLines={1}
          style={[
            s.label,
            { color: profileActive ? colors.accent : colors.text },
          ]}
        >
          {studentName}
        </Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  sidebar: {
    width: 244,
    minHeight: '100%',
    borderRightWidth: 1,
    padding: 24,
    paddingTop: 30,
  },
  brandDepth: {
    alignSelf: 'flex-start',
    backgroundColor: '#D89196',
    borderRadius: 999,
    paddingBottom: 5,
    shadowColor: '#7D9D8A',
    shadowOpacity: 0.26,
    shadowRadius: 11,
    shadowOffset: { width: 0, height: 7 },
    elevation: 5,
  },
  brandDepthPressed: {
    paddingBottom: 2,
    transform: [{ translateY: 3 }],
  },
  brandPill: {
    position: 'relative',
    overflow: 'hidden',
    borderColor: '#F7FFF9',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
    transform: [{ translateY: -1 }],
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandHighlight: {
    position: 'absolute',
    top: 2,
    left: 16,
    right: 16,
    height: 2,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,.82)',
  },
  brand: {
    color: '#184B39',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.7,
  },
  secretDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: '#FFF8F4',
  },
  semester: { fontSize: 12, marginTop: 9 },
  secretCard: {
    marginTop: 12,
    borderWidth: 1,
    borderRadius: 15,
    padding: 12,
    shadowColor: '#8B6C65',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },
  secretTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  secretSparkle: {
    width: 25,
    height: 25,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F2CFD1',
  },
  secretTitle: { fontSize: 12, fontWeight: '900' },
  secretCopy: { fontSize: 10, lineHeight: 15, marginTop: 8 },
  timerChip: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 10,
  },
  timerText: {
    color: '#245B47',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.4,
    fontVariant: ['tabular-nums'],
  },
  secretActions: {
    flexDirection: 'row',
    gap: 7,
    marginTop: 10,
  },
  focusButton: {
    minHeight: 32,
    borderRadius: 10,
    backgroundColor: '#B6646C',
    paddingHorizontal: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  focusButtonText: { color: '#FFF9F3', fontSize: 11, fontWeight: '900' },
  resetButton: {
    width: 34,
    height: 32,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nav: { gap: 5, marginTop: 30 },
  item: {
    minHeight: 44,
    borderRadius: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
  },
  label: { fontSize: 14, fontWeight: '700', flex: 1 },
  ai: {
    flexDirection: 'row',
    gap: 10,
    borderWidth: 1,
    borderRadius: 13,
    padding: 12,
    marginBottom: 8,
  },
  aiTitle: { fontSize: 13, fontWeight: '800' },
  aiSub: { fontSize: 10, marginTop: 2 },
});
