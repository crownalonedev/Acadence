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
import { restrictToParentElement, restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  ChevronLeft,
  ChevronRight,
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

function SortableNavItem({ id, active, colors }: { id: NavigationItemId; active: boolean; colors: any }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const item = navigationItems[id];
  const Icon = item.icon;
  const t = transform ? { x: 0, y: transform.y, scaleX: 1, scaleY: 1 } : null;
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
            backgroundColor: isDragging ? colors.accentSoft : active ? colors.accentSoft : colors.background,
            borderColor: isDragging ? colors.accent : colors.border,
          },
        ]}
      >
        <Icon size={19} color={active || isDragging ? colors.accent : colors.text} />
        <Text style={[s.label, { color: active || isDragging ? colors.accent : colors.text }]}>{item.label}</Text>
        <div {...listeners} style={{ cursor: isDragging ? 'grabbing' : 'grab', touchAction: 'none', userSelect: 'none', padding: 5 }}>
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
  const [collapsed, setCollapsed] = useState(false);
  const [secretOpen, setSecretOpen] = useState(false);
  const [focusRunning, setFocusRunning] = useState(false);
  const [focusSeconds, setFocusSeconds] = useState(FOCUS_SECONDS);
  const [brandHovered, setBrandHovered] = useState(false);

  const main = items.filter((id) => id !== 'profile');
  const profileItem = navigationItems.profile;
  const ProfileIcon = profileItem.icon;
  const profileActive = path.includes('settings');
  const studentName = profile?.name?.trim() || 'You';
  const brandGradient = focusRunning
    ? 'linear-gradient(135deg, #D8F2E3 0%, #A7D9BC 48%, #7AB493 100%)'
    : brandHovered
      ? 'linear-gradient(135deg, #F7FFF9 0%, #DDF4E6 38%, #9FD4B4 100%)'
      : 'linear-gradient(135deg, #F2FBF5 0%, #D8F0E1 44%, #A8D8BB 100%)';
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

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

  const navPressable = (id: NavigationItemId) => {
    const item = navigationItems[id];
    const Icon = item.icon;
    const active = id === 'home' ? path === '/' || path.endsWith('/(tabs)') : path.includes(item.route);
    return (
      <div key={id} title={collapsed ? item.label : undefined} style={{ width: '100%' }}>
        <Pressable
          accessibilityLabel={item.label}
          onPress={() => router.push(item.route === 'index' ? '/(tabs)' : (`/(tabs)/${item.route}` as any))}
          style={({ hovered, pressed }: any) => [
            s.item,
            collapsed && s.itemCollapsed,
            {
              backgroundColor: active ? colors.accentSoft : colors.background,
              borderColor: active ? colors.accentSoft : colors.border,
            },
            hovered && !active && { transform: [{ translateX: collapsed ? 0 : 2 }, { scale: collapsed ? 1.03 : 1 }] },
            pressed && { opacity: 0.78 },
          ]}
        >
          <Icon size={19} color={active ? colors.accent : colors.text} />
          {!collapsed ? <Text style={[s.label, { color: active ? colors.accent : colors.text }]}>{item.label}</Text> : null}
        </Pressable>
      </div>
    );
  };

  return (
    <View
      style={[
        s.sidebar,
        collapsed && s.sidebarCollapsed,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <View>
        <View style={[s.brandRow, collapsed && s.brandRowCollapsed]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Acadence"
            accessibilityHint="Open a hidden study focus tool"
            onHoverIn={() => setBrandHovered(true)}
            onHoverOut={() => setBrandHovered(false)}
            onPress={() => !collapsed && setSecretOpen((open) => !open)}
            style={({ pressed }) => [
              s.brandDepth,
              collapsed && s.brandDepthCollapsed,
              brandHovered && !pressed && s.brandDepthHover,
              pressed && s.brandDepthPressed,
            ]}
          >
            <View style={[s.brandPill, collapsed && s.brandPillCollapsed, brandHovered && s.brandPillHover]}>
              <div
                aria-hidden="true"
                style={{ position: 'absolute', inset: 0, borderRadius: 999, background: brandGradient, transition: 'background 180ms ease' }}
              />
              <View style={s.brandHighlight} />
              <Text style={[s.brand, collapsed && s.brandCollapsed]}>{collapsed ? 'a' : 'acadence'}</Text>
              {!collapsed ? (
                <View
                  style={[
                    s.secretDot,
                    {
                      backgroundColor: focusRunning ? '#173F31' : '#2F6B4F',
                      transform: [{ scale: brandHovered ? 1.18 : 1 }],
                    },
                  ]}
                />
              ) : null}
            </View>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={collapsed ? 'Expand navigation' : 'Collapse navigation'}
            onPress={() => {
              setCollapsed((value) => !value);
              setSecretOpen(false);
            }}
            style={({ hovered, pressed }: any) => [
              s.collapseButton,
              collapsed && s.collapseButtonCollapsed,
              { backgroundColor: colors.background, borderColor: colors.border },
              hovered && { transform: [{ scale: 1.06 }] },
              pressed && { transform: [{ translateY: 2 }, { scale: 0.97 }] },
            ]}
          >
            {collapsed ? <ChevronRight size={16} color={colors.muted} /> : <ChevronLeft size={16} color={colors.muted} />}
          </Pressable>
        </View>
        {!collapsed ? <Text style={[s.semester, { color: colors.muted }]}>Current semester</Text> : null}

        {secretOpen && !collapsed ? (
          <View style={[s.secretCard, { backgroundColor: isDark ? '#18261F' : '#EDF7F0', borderColor: isDark ? '#365844' : '#B9D8C5' }]}> 
            <View style={s.secretTitleRow}>
              <View style={s.secretSparkle}><Sparkles size={13} color="#2F6B4F" /></View>
              <Text style={[s.secretTitle, { color: colors.text }]}>Secret study sprint</Text>
            </View>
            <Text style={[s.secretCopy, { color: colors.muted }]}> 
              {focusSeconds === 0 ? 'Nice. Ten focused minutes, done.' : 'Pick one thing and give it ten distraction-free minutes.'}
            </Text>
            <View style={[s.timerChip, { backgroundColor: isDark ? '#284735' : '#DCEFE3' }]}> 
              <Text style={s.timerText}>{formatFocusTime(focusSeconds)}</Text>
            </View>
            <View style={s.secretActions}>
              <Pressable
                accessibilityRole="button"
                onPress={toggleFocus}
                style={({ hovered, pressed }: any) => [
                  s.focusButton,
                  hovered && { transform: [{ translateY: -1 }] },
                  pressed && { transform: [{ translateY: 1 }, { scale: 0.98 }] },
                ]}
              >
                {focusRunning ? <Pause size={13} color="#F4FBF6" fill="#F4FBF6" /> : <Play size={13} color="#F4FBF6" fill="#F4FBF6" />}
                <Text style={s.focusButtonText}>{focusRunning ? 'Pause' : focusSeconds === 0 ? 'Again' : 'Start'}</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Reset focus timer"
                onPress={resetFocus}
                style={[s.resetButton, { borderColor: isDark ? '#40604E' : '#BCD5C5' }]}
              >
                <RotateCcw size={13} color={colors.muted} />
              </Pressable>
            </View>
          </View>
        ) : null}
      </View>

      <View style={[s.nav, collapsed && s.navCollapsed]}>
        {editing && !collapsed ? (
          <DndContext sensors={sensors} collisionDetection={closestCenter} modifiers={[restrictToVerticalAxis, restrictToParentElement]} onDragEnd={end}>
            <SortableContext items={main} strategy={verticalListSortingStrategy}>
              <View style={{ gap: 5 }}>
                {main.map((id) => (
                  <SortableNavItem
                    key={id}
                    id={id}
                    active={id === 'home' ? path === '/' || path.endsWith('/(tabs)') : path.includes(navigationItems[id].route)}
                    colors={colors}
                  />
                ))}
              </View>
            </SortableContext>
          </DndContext>
        ) : (
          main.map(navPressable)
        )}
      </View>

      <View style={{ flex: 1 }} />
      <div title={collapsed ? 'Ask Acadence' : undefined} style={{ width: '100%' }}>
        <Pressable
          onPress={() => router.push('/(tabs)/ai')}
          style={({ hovered }: any) => [
            s.ai,
            collapsed && s.aiCollapsed,
            { borderColor: colors.border, backgroundColor: colors.background },
            hovered && { transform: [{ translateY: -1 }] },
          ]}
        >
          <Sparkles size={17} color={colors.accent} />
          {!collapsed ? (
            <View>
              <Text style={[s.aiTitle, { color: colors.text }]}>Ask Acadence</Text>
              <Text style={[s.aiSub, { color: colors.muted }]}>Your academic assistant</Text>
            </View>
          ) : null}
        </Pressable>
      </div>
      <div title={collapsed ? studentName : undefined} style={{ width: '100%' }}>
        <Pressable
          onPress={() => router.push('/(tabs)/settings')}
          style={[
            s.item,
            collapsed && s.itemCollapsed,
            { backgroundColor: profileActive ? colors.accentSoft : colors.background, borderColor: colors.border },
          ]}
        >
          <ProfileIcon size={19} color={profileActive ? colors.accent : colors.text} />
          {!collapsed ? <Text numberOfLines={1} style={[s.label, { color: profileActive ? colors.accent : colors.text }]}>{studentName}</Text> : null}
        </Pressable>
      </div>
    </View>
  );
}

const s = StyleSheet.create({
  sidebar: { width: 244, minHeight: '100%', borderRightWidth: 1, padding: 24, paddingTop: 30 },
  sidebarCollapsed: { width: 78, paddingHorizontal: 10, paddingTop: 22 },
  brandRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  brandRowCollapsed: { flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', gap: 10 },
  collapseButton: { width: 30, height: 30, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginTop: 3 },
  collapseButtonCollapsed: { width: 34, height: 34, marginTop: 0, borderRadius: 11 },
  brandDepth: { alignSelf: 'flex-start', backgroundColor: '#2F6B4F', borderRadius: 999, paddingBottom: 5, boxShadow: '0px 7px 12px rgba(23,63,49,0.22)' as any },
  brandDepthCollapsed: { paddingBottom: 5, alignSelf: 'center' },
  brandDepthHover: { paddingBottom: 7, transform: [{ translateY: -1 }, { scale: 1.02 }], boxShadow: '0px 9px 16px rgba(23,63,49,0.30)' as any },
  brandDepthPressed: { paddingBottom: 0, transform: [{ translateY: 6 }], boxShadow: '0px 2px 5px rgba(23,63,49,0.10)' as any },
  brandPill: { position: 'relative', overflow: 'hidden', borderColor: '#F4FBF6', borderWidth: 1, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 8, transform: [{ translateY: -1 }], flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandPillCollapsed: { width: 44, height: 44, paddingHorizontal: 0, paddingVertical: 0, justifyContent: 'center' },
  brandPillHover: { borderColor: '#FFFFFF' },
  brandHighlight: { position: 'absolute', zIndex: 2, top: 2, left: 12, right: 12, height: 2, borderRadius: 999, backgroundColor: 'rgba(255,255,255,.76)', pointerEvents: 'none' },
  brand: { zIndex: 1, color: '#163F30', fontSize: 22, fontWeight: '900', letterSpacing: -0.7 },
  brandCollapsed: { fontSize: 24, letterSpacing: -1 },
  secretDot: { zIndex: 1, width: 8, height: 8, borderRadius: 999, borderWidth: 1.5, borderColor: '#F4FBF6' },
  semester: { fontSize: 12, marginTop: 9 },
  secretCard: { marginTop: 12, borderWidth: 1, borderRadius: 15, padding: 12, boxShadow: '0px 5px 12px rgba(31,90,68,0.12)' as any },
  secretTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  secretSparkle: { width: 25, height: 25, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: '#D6EEDF' },
  secretTitle: { fontSize: 12, fontWeight: '900' },
  secretCopy: { fontSize: 10, lineHeight: 15, marginTop: 8 },
  timerChip: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, marginTop: 10 },
  timerText: { color: '#1F5A44', fontSize: 18, fontWeight: '900', letterSpacing: -0.4, fontVariant: ['tabular-nums'] },
  secretActions: { flexDirection: 'row', gap: 7, marginTop: 10 },
  focusButton: { minHeight: 32, borderRadius: 10, backgroundColor: '#1F5A44', paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  focusButtonText: { color: '#F4FBF6', fontSize: 11, fontWeight: '900' },
  resetButton: { width: 34, height: 32, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  nav: { gap: 5, marginTop: 30 },
  navCollapsed: { marginTop: 22, gap: 7 },
  item: { minHeight: 44, borderRadius: 11, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12, borderWidth: 1 },
  itemCollapsed: { width: 44, height: 44, minHeight: 44, paddingHorizontal: 0, justifyContent: 'center', alignSelf: 'center', borderRadius: 12 },
  label: { fontSize: 14, fontWeight: '700', flex: 1 },
  ai: { flexDirection: 'row', gap: 10, borderWidth: 1, borderRadius: 13, padding: 12, marginBottom: 8, alignItems: 'center' },
  aiCollapsed: { width: 44, height: 44, padding: 0, justifyContent: 'center', alignSelf: 'center', borderRadius: 12 },
  aiTitle: { fontSize: 13, fontWeight: '800' },
  aiSub: { fontSize: 10, marginTop: 2 },
});
