import { BookOpen, CalendarDays, CircleUserRound, FileText, GraduationCap, House, Inbox, ListTodo, Sparkles } from 'lucide-react-native';

export const navigationItems = {
  home: { label: 'Home', route: 'index', icon: House },
  courses: { label: 'Courses', route: 'courses', icon: BookOpen },
  tasks: { label: 'Tasks', route: 'tasks', icon: ListTodo },
  calendar: { label: 'Calendar', route: 'calendar', icon: CalendarDays },
  grades: { label: 'Grades', route: 'grades', icon: GraduationCap },
  inbox: { label: 'Inbox', route: 'inbox', icon: Inbox },
  files: { label: 'Files', route: 'files', icon: FileText },
  ai: { label: 'Acadence', route: 'ai', icon: Sparkles },
  profile: { label: 'You', route: 'settings', icon: CircleUserRound },
} as const;

export type NavigationItemId = keyof typeof navigationItems;
export const defaultNavigation: NavigationItemId[] = ['home', 'courses', 'tasks', 'calendar', 'profile'];
