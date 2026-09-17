import { Pressable, StyleSheet, Text, View } from 'react-native';
import { DndContext, DragEndEvent, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import { restrictToParentElement, restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Check, GripVertical } from 'lucide-react-native';
import { navigationItems, NavigationItemId } from '@/constants/navigation';

function Row({ id, colors, onRemove }: { id: NavigationItemId; colors: any; onRemove: (id: NavigationItemId) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const item = navigationItems[id];
  const Icon = item.icon;
  const verticalTransform = transform ? { x: 0, y: transform.y, scaleX: 1, scaleY: 1 } : null;
  return <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(verticalTransform), transition: isDragging ? undefined : transition, width: '100%', position: 'relative', zIndex: isDragging ? 50 : 1, background: colors.background, borderRadius: 13, boxShadow: isDragging ? '0 10px 26px rgba(20,35,28,.12)' : 'none' }} {...attributes}><View style={[s.row, { backgroundColor: colors.surface, borderColor: isDragging ? colors.accent : colors.border }]}><Icon size={19} color={isDragging ? colors.accent : colors.text} /><Text style={[s.name, { color: colors.text }]}>{item.label}</Text>{id === 'home' ? <View style={s.required}><Check size={13} color={colors.accent} /><Text style={{ color: colors.accent, fontSize: 11, fontWeight: '700' }}>Required</Text></View> : <Pressable onPress={() => onRemove(id)}><Text style={{ color: colors.muted, fontSize: 12, fontWeight: '700' }}>Remove</Text></Pressable>}<div {...listeners} aria-label={`Move ${item.label}`} style={{ cursor: isDragging ? 'grabbing' : 'grab', touchAction: 'none', userSelect: 'none', padding: 7 }}><GripVertical size={20} color={isDragging ? colors.accent : colors.muted} /></div></View></div>;
}

export function WebSortableNavigation({ items, setItems, colors, onRemove }: { items: NavigationItemId[]; setItems: (v: NavigationItemId[]) => void; colors: any; onRemove: (id: NavigationItemId) => void }) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const end = (e: DragEndEvent) => { if (!e.over || e.active.id === e.over.id) return; const from = items.indexOf(e.active.id as NavigationItemId); const to = items.indexOf(e.over.id as NavigationItemId); if (from >= 0 && to >= 0) setItems(arrayMove(items, from, to)); };
  return <div style={{ width: '100%', position: 'relative', overflow: 'hidden' }}><DndContext sensors={sensors} collisionDetection={closestCenter} modifiers={[restrictToVerticalAxis, restrictToParentElement]} onDragEnd={end}><SortableContext items={items} strategy={verticalListSortingStrategy}><div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>{items.map((id) => <Row key={id} id={id} colors={colors} onRemove={onRemove} />)}</div></SortableContext></DndContext></div>;
}

const s = StyleSheet.create({ row: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, borderWidth: 1, borderRadius: 13 }, name: { fontSize: 14, fontWeight: '700', flex: 1 }, required: { flexDirection: 'row', alignItems: 'center', gap: 4 } });
