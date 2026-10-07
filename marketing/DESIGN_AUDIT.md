# Acadence design audit

I wrote this audit before building the marketing site. It is based on the `develop` branch: `constants/theme.ts`, `app/(tabs)/*`, `components/DesktopSidebar.tsx`, `components/CustomizeHomeModal.tsx`, `components/*.web.tsx`, `extension/popup.html` and `assets/favicon.png`.

## 1. Visual identity
The app looks calm and paper-like. Most surfaces are warm off-white or deep forest green, and almost every color is a shade of green. Layouts are mostly cards with plenty of air and confident headings. There are a few playful details: the raised, pressable `acadence` wordmark pill, the bell that rings on hover, the hand-drawn strike-through when you complete a task, a hidden focus timer, and a diagonal wipe when switching themes. It looks like a quiet study desk, not a busy dashboard.

## 2. Colors (`constants/theme.ts`)
| Token | Light | Dark |
|---|---|---|
| background | `#F5F3ED` (warm paper) | `#101713` |
| surface | `#FFFEFA` | `#17211C` |
| surfaceElevated | `#FFFFFF` | `#1D2922` |
| text | `#18231E` | `#F1F0E8` |
| muted | `#68736C` | `#A6B0A9` |
| border | `#DDDCD3` | `#2C3A32` |
| accent | `#1F5A44` (forest) | `#8EC7AA` (sage) |
| accentSoft | `#E4EFE9` | `#213C30` |
| warning / danger / success | `#9A6A1B` / `#A63D40` / `#2F6B4F` | `#D7AD62` / `#E07A7D` / `#7FC29E` |

For WCAG AA text contrast, the marketing site slightly darkens two light-theme tokens: `muted` goes to `#5F6A63` (the app's value is 4.45:1 on `background`) and `warning` goes to `#855A12`.

Brand-only colors (sidebar pill): a mint gradient `#F2FBF5 → #D8F0E1 → #A8D8BB`, depth `#2F6B4F`, wordmark ink `#163F30`. Course covers sit under a dark scrim `rgba(12,20,16,.72)`. No purple or blue is used anywhere.

## 3. Typography
The app uses the system stack only (`system-ui, -apple-system, "Segoe UI", Roboto…`), with no custom web font. Weights are heavy: titles are 800–900 at 30px, section headings 800 at 18–20px, card titles 800 at 15px, and metadata 11–13px in `muted`. Overline labels ("PINNED ASSIGNMENTS", "YOUR WIDGETS") are 10–11px at weight 800–900 with about 0.8px tracking. The wordmark is lowercase, 900 weight, with -0.7 letter-spacing.

## 4. Border radius
Radii are generous and soft: `radius = { sm: 10, md: 16, lg: 22 }`. Course and grade cards use 18, buttons 10–12, icon buttons are full circles (42px), chips are about 11 or fully round, and sheets are 28. The overall feel is rounded but never bubbly.

## 5. Spacing
Screens use 24px padding with a 1120px max width. Card padding is 14–18, list gaps 8–10, and grid gaps 10–14. There are about 24px between a screen header and its content. The UI is dense enough to be useful without feeling cramped.

## 6. Cards and components
- Cards are `surface` with a 1px `border` and radius 16–18. Shadows are rare and only used on raised or brand elements.
- Icon tiles are 34–42px squares at radius 10–13, filled with `accentSoft` and holding an `accent` icon.
- Due chips are tinted (`accentSoft`, or warning at 9% when due soon). They show a bold label and a muted exact time.
- The primary button is solid `accent` with white text at weight 800 and radius 11–12. Secondary buttons are bordered and transparent.
- Sidebar items are 44px rows with a 1px border; the active item is filled with `accentSoft` and colored `accent`.
- Dashed "Add Widget" buttons and grip handles (`GripVertical`) show where things can be edited.

## 7. Icons
Lucide (`lucide-react-native`) at 2px stroke, 13–21px, colored `accent` or `text`. Icons used: House, BookOpen, GraduationCap, ListTodo, CalendarDays, Megaphone, Sparkles, Pin, CalendarClock, RefreshCw, GripVertical, EyeOff, Plus, Bell.

## 8. Motion
- Reanimated springs with damping 20 and stiffness 320 for list reordering
- 180–220ms fades
- Hover lifts of about 1px with a 0.98 press scale
- A bell ring on hover
- A 700ms clip-path wipe for theme changes
- A pushable 3D wordmark that sinks when pressed

Motion is short and physical, with no ambient looping animation.

## 9. Light and dark mode
Both themes are first-class, and the app follows the system setting by default (`'system'`). Dark mode is a green-black rather than neutral gray, and the accent lightens to sage. The toggle is a round sun/moon button.

## 10. What carries over to the marketing site
- The exact palette tokens in both themes, the system font stack, heavy weights and tight tracking
- Card, chip, icon-tile and button styles taken directly from the app
- The `acadence` pushable wordmark pill as the logo, plus the existing favicon
- Lucide icons (`lucide-react`, the web version of the app's icon set)
- An HTML/CSS recreation of the real desktop Home: sidebar, insight, pinned and needs-attention rows, and course cards
- The Customize Home widget list, as an interactive demo
- Due chips, grade cards with weight chips and What-If, calendar dots, the announcement accordion and the notification feed
- Short spring-like motion, ~1px hover lifts and a theme toggle with the clip-path wipe, all turned off under `prefers-reduced-motion`
- The site leaves out gradients and glows, except for the brand pill's existing mint gradient.

## How honest the copy is
| What the site says | Evidence in the repo |
|---|---|
| Built and working: Canvas sync of courses, assignments, grades, announcements and assignment groups through the Acadence Connector extension | `extension/`, `docs/canvas-notifications.md` |
| Built and working: Home widgets you can rearrange (drag on web, hide/show/reset) | `HomeLayoutContext`, `WebSortableHome`, `CustomizeHomeModal` |
| Built and working: pinned assignments, tasks, a month calendar of due dates and an announcements feed | the matching screens in `app/(tabs)/` |
| Built and working: in-app change notifications | `NotificationsContext`, `server/src/notifications.js` |
| Built and working: per-course grades, weights, What-If simulation and a GPA calculator | `grades.tsx`, `GpaCalculator.tsx` |
| Built and working: course hubs with an in-app file preview | `course/[id].tsx`, `CourseAssetViewer` |
| Built and working: a navigation order you can customize, and light/dark/system themes | `DesktopSidebar`, settings, `ThemeContext` |
| Built and working: one Expo codebase for web, iOS and Android, with a desktop sidebar from 900px and a mobile tab bar | `app.json`, `_layout.tsx` |
| Shown as "in progress": the Ask Acadence assistant, the unified Inbox, the Files library and Canvas OAuth sign-in | these are placeholder `FeatureScreen`s plus an unfinished OAuth service |
| Not mentioned at all: push notifications or due-date reminders | the docs say none exist yet |
| Not mentioned at all: app-store availability, user counts, schools or testimonials | none exist in the repo |
