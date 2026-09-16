import { Pressable, StyleSheet, View } from 'react-native';
import { DndContext, DragEndEvent, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import { restrictToParentElement, restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Minus } from 'lucide-react-native';
import { HomeWidgetId } from '@/context/HomeLayoutContext';

function SortableWidget({ id, onRemove, children, accent, danger, surface, border, background }: { id: HomeWidgetId; onRemove: (id: HomeWidgetId) => void; children: React.ReactNode; accent: string; danger: string; surface: string; border: string; background: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const verticalTransform = transform ? { x: 0, y: transform.y, scaleX: 1, scaleY: 1 } : null;
  const style: any = { transform: CSS.Transform.toString(verticalTransform), transition: isDragging ? undefined : transition, zIndex: isDragging ? 100 : 1, position: 'relative', width: '100%', opacity: 1, backgroundColor: background, borderRadius: 16, boxShadow: isDragging ? '0 14px 32px rgba(20,35,28,.14)' : 'none', willChange: 'transform' };
  return <div ref={setNodeRef} style={style} {...attributes}><View style={[s.frame, { borderColor: accent, backgroundColor: background }]}><View style={s.editRail}><Pressable onPress={() => onRemove(id)} hitSlop={7} style={[s.remove, { backgroundColor: danger }]}><Minus size={11} strokeWidth={3} color="#fff" /></Pressable><div {...listeners} aria-label="Drag widget" style={{ cursor: isDragging ? 'grabbing' : 'grab', touchAction: 'none', userSelect: 'none', borderRadius: 8 }}><View style={[s.grip, { backgroundColor: surface, borderColor: border }]}><GripVertical size={16} strokeWidth={2.2} color={accent} /></View></div></View><View style={s.content}>{children}</View></View></div>;
}

export function WebSortableHome({ items, setItems, hide, renderWidget, colors }: { items: HomeWidgetId[]; setItems: (items: HomeWidgetId[]) => void; hide: (id: HomeWidgetId) => void; renderWidget: (id: HomeWidgetId) => React.ReactNode; colors: any }) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const end = (e: DragEndEvent) => { const { active, over } = e; if (!over || active.id === over.id) return; const from = items.indexOf(active.id as HomeWidgetId); const to = items.indexOf(over.id as HomeWidgetId); if (from >= 0 && to >= 0) setItems(arrayMove(items, from, to)); };
  return <div style={{ position: 'relative', width: '100%', overflow: 'hidden', paddingTop: 4, paddingBottom: 4 }}><DndContext sensors={sensors} collisionDetection={closestCenter} modifiers={[restrictToVerticalAxis, restrictToParentElement]} onDragEnd={end}><SortableContext items={items} strategy={verticalListSortingStrategy}>{items.map((id) => <SortableWidget key={id} id={id} onRemove={hide} accent={colors.accent} danger={colors.danger} surface={colors.surface} border={colors.border} background={colors.background}>{renderWidget(id)}</SortableWidget>)}</SortableContext></DndContext></div>;
}

const s = StyleSheet.create({frame:{position:'relative',borderWidth:1,borderRadius:16,padding:8,marginBottom:10},editRail:{height:34,flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:2,marginBottom:4},content:{width:'100%'},remove:{width:22,height:22,borderRadius:11,alignItems:'center',justifyContent:'center',boxShadow:'0 1px 4px rgba(85,30,30,.16)' as any},grip:{width:28,height:28,borderRadius:8,borderWidth:1,alignItems:'center',justifyContent:'center',boxShadow:'0 1px 4px rgba(20,35,28,.07)' as any}});
