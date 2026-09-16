import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import { restrictToParentElement, restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Minus } from 'lucide-react-native';
import { HomeWidgetId } from '@/context/HomeLayoutContext';

function SortableWidget({ id, onRemove, children, accent, danger, surface, border }: { id: HomeWidgetId; onRemove: (id: HomeWidgetId) => void; children: React.ReactNode; accent: string; danger: string; surface: string; border: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style: any = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 50 : 1, opacity: isDragging ? 0.12 : 1, position: 'relative', width: '100%' };
  return <div ref={setNodeRef} style={style} {...attributes}><View style={[s.frame, { borderColor: accent }]}><View style={s.editRail}><Pressable onPress={() => onRemove(id)} hitSlop={7} style={[s.remove, { backgroundColor: danger }]}><Minus size={11} strokeWidth={3} color="#fff" /></Pressable><div {...listeners} aria-label="Drag widget" style={{ cursor: isDragging ? 'grabbing' : 'grab', touchAction: 'none', userSelect: 'none', borderRadius: 8 }}><View style={[s.grip, { backgroundColor: surface, borderColor: border }]}><GripVertical size={16} strokeWidth={2.2} color={accent} /></View></div></View><View style={s.content}>{children}</View></View></div>;
}

export function WebSortableHome({ items, setItems, hide, renderWidget, colors }: { items: HomeWidgetId[]; setItems: (items: HomeWidgetId[]) => void; hide: (id: HomeWidgetId) => void; renderWidget: (id: HomeWidgetId) => React.ReactNode; colors: any }) {
  const [active, setActive] = useState<HomeWidgetId | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const start = (e: DragStartEvent) => setActive(e.active.id as HomeWidgetId);
  const end = (e: DragEndEvent) => {
    setActive(null);
    const { active: dragged, over } = e;
    if (!over || dragged.id === over.id) return;
    const from = items.indexOf(dragged.id as HomeWidgetId);
    const to = items.indexOf(over.id as HomeWidgetId);
    if (from >= 0 && to >= 0) setItems(arrayMove(items, from, to));
  };
  return <div style={{ position: 'relative', width: '100%', overflow: 'hidden', paddingTop: 4, paddingBottom: 4 }}><DndContext sensors={sensors} collisionDetection={closestCenter} modifiers={[restrictToVerticalAxis, restrictToParentElement]} onDragStart={start} onDragEnd={end} onDragCancel={() => setActive(null)}><SortableContext items={items} strategy={verticalListSortingStrategy}>{items.map((id) => <SortableWidget key={id} id={id} onRemove={hide} accent={colors.accent} danger={colors.danger} surface={colors.surface} border={colors.border}>{renderWidget(id)}</SortableWidget>)}</SortableContext><DragOverlay modifiers={[restrictToVerticalAxis]} dropAnimation={{ duration: 160, easing: 'ease-out' }}><div style={{ width: '100%', boxSizing: 'border-box', pointerEvents: 'none' }}><View style={[s.overlay, { backgroundColor: colors.background, borderColor: colors.accent }]}>{active ? renderWidget(active) : null}</View></div></DragOverlay></DndContext></div>;
}

const s = StyleSheet.create({
  frame: { position: 'relative', borderWidth: 1, borderRadius: 16, padding: 8, marginBottom: 10 },
  editRail: { height: 34, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 2, marginBottom: 4 },
  content: { width: '100%' },
  remove: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 4px rgba(85,30,30,.16)' as any },
  grip: { width: 28, height: 28, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 4px rgba(20,35,28,.07)' as any },
  overlay: { width: '100%', borderWidth: 1, borderRadius: 16, padding: 8, opacity: 0.98, boxShadow: '0 14px 34px rgba(20,35,28,.14)' as any },
});
