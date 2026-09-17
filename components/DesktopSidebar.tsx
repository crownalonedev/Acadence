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
import { GripVertical, Sparkles } from 'lucide-react-native';
import { navigationItems, NavigationItemId } from '@/constants/navigation';
import { useNavigationPreferences } from '@/context/NavigationContext';
import { useCanvasData } from '@/context/CanvasDataContext';
import { useAppTheme } from '@/context/ThemeContext';

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
  const { colors } = useAppTheme();
  const { profile } = useCanvasData();
  const main = items.filter((id) => id !== 'profile');
  const profileItem = navigationItems.profile;
  const ProfileIcon = profileItem.icon;
  const profileActive = path.includes('settings');
  const studentName = profile?.name?.trim() || 'You';
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  const end = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    const from = main.indexOf(e.active.id as NavigationItemId);
    const to = main.indexOf(e.over.id as NavigationItemId);
    if (from < 0 || to < 0) return;
    const reordered = arrayMove(main, from, to);
    const profileIndex = items.indexOf('profile');
    setItems(profileIndex >= 0 ? [...reordered, 'profile'] : reordered);
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
        <View style={s.brandDepth}>
          <View style={s.brandPill}>
            <View pointerEvents="none" style={s.brandHighlight} />
            <Text style={s.brand}>acadence</Text>
          </View>
        </View>
        <Text style={[s.semester, { color: colors.muted }]}>Current semester</Text>
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
    backgroundColor: '#A7CDB8',
    borderRadius: 999,
    paddingBottom: 4,
    shadowColor: '#7FAE96',
    shadowOpacity: 0.24,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  brandPill: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#E6F2EB',
    borderColor: '#F7FBF8',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 15,
    paddingVertical: 7,
    transform: [{ translateY: -1 }],
  },
  brandHighlight: {
    position: 'absolute',
    top: 2,
    left: 14,
    right: 14,
    height: 2,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,.78)',
  },
  brand: {
    color: '#245C47',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.7,
  },
  semester: { fontSize: 12, marginTop: 8 },
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
