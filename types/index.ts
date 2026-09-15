export type AssignmentStatus = 'upcoming' | 'submitted' | 'missing' | 'late' | 'graded';
export interface Course { id:string; code:string; name:string; instructor:string; color:string; grade?:string; }
export interface Assignment { id:string; courseId:string; title:string; dueAt:string; pointsPossible?:number; status:AssignmentStatus; }
