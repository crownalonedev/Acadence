import { PropsWithChildren, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Minus } from 'lucide-react-native';
import { HomeWidgetId } from '@/context/HomeLayoutContext';

function SortableWidget({id,onRemove,children,accent,danger,surface,border}:{id:HomeWidgetId;onRemove:(id:HomeWidgetId)=>void;children:React.ReactNode;accent:string;danger:string;surface:string;border:string}){
  const {attributes,listeners,setNodeRef,transform,transition,isDragging}=useSortable({id});
  const style:any={transform:CSS.Transform.toString(transform),transition,zIndex:isDragging?50:1,opacity:isDragging?.22:1,position:'relative'};
  return <div ref={setNodeRef} style={style} {...attributes} className="acadence-sortable-widget"><View style={[s.frame,{borderColor:accent}]}><Pressable onPress={()=>onRemove(id)} style={[s.remove,{backgroundColor:danger}]}><Minus size={14} strokeWidth={3} color="#fff"/></Pressable><div {...listeners} style={{position:'absolute',right:-8,top:-12,zIndex:60,cursor:isDragging?'grabbing':'grab',touchAction:'none',userSelect:'none'}}><View style={[s.grip,{backgroundColor:surface,borderColor:border}]}><GripVertical size={21} color={accent}/></View></div>{children}</View></div>
}

export function WebSortableHome({items,setItems,hide,renderWidget,colors}:{items:HomeWidgetId[];setItems:(items:HomeWidgetId[])=>void;hide:(id:HomeWidgetId)=>void;renderWidget:(id:HomeWidgetId)=>React.ReactNode;colors:any}){
  const [active,setActive]=useState<HomeWidgetId|null>(null);
  const sensors=useSensors(useSensor(PointerSensor,{activationConstraint:{distance:4}}));
  const start=(e:DragStartEvent)=>setActive(e.active.id as HomeWidgetId);
  const end=(e:DragEndEvent)=>{setActive(null);const {active:dragged,over}=e;if(!over||dragged.id===over.id)return;const from=items.indexOf(dragged.id as HomeWidgetId),to=items.indexOf(over.id as HomeWidgetId);if(from>=0&&to>=0)setItems(arrayMove(items,from,to));};
  return <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={start} onDragEnd={end} onDragCancel={()=>setActive(null)}><SortableContext items={items} strategy={verticalListSortingStrategy}>{items.map(id=><SortableWidget key={id} id={id} onRemove={hide} accent={colors.accent} danger={colors.danger} surface={colors.surface} border={colors.border}>{renderWidget(id)}</SortableWidget>)}</SortableContext><DragOverlay dropAnimation={{duration:180,easing:'ease-out'}}>{active?<View style={[s.overlay,{backgroundColor:colors.background,borderColor:colors.accent}]}>{renderWidget(active)}</View>:null}</DragOverlay></DndContext>
}
const s=StyleSheet.create({frame:{position:'relative',borderWidth:1.5,borderRadius:18,padding:7,marginHorizontal:-7,marginBottom:8},remove:{position:'absolute',zIndex:70,left:-10,top:-10,width:26,height:26,borderRadius:13,alignItems:'center',justifyContent:'center',borderWidth:2,borderColor:'#fff'},grip:{width:48,height:40,borderRadius:20,borderWidth:1,alignItems:'center',justifyContent:'center'},overlay:{borderWidth:1.5,borderRadius:18,padding:7,opacity:.96,boxShadow:'0 18px 48px rgba(20,35,28,.18)' as any}});
