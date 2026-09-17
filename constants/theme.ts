export const palettes={light:{background:'#F5F3ED',surface:'#FFFEFA',surfaceElevated:'#FFFFFF',text:'#18231E',muted:'#68736C',border:'#DDDCD3',accent:'#1F5A44',accentSoft:'#E4EFE9',danger:'#A63D40',warning:'#9A6A1B',success:'#2F6B4F'},dark:{background:'#101713',surface:'#17211C',surfaceElevated:'#1D2922',text:'#F1F0E8',muted:'#A6B0A9',border:'#2C3A32',accent:'#8EC7AA',accentSoft:'#213C30',danger:'#E07A7D',warning:'#D7AD62',success:'#7FC29E'}} as const;
export type AppTheme='light'|'dark'|'system';
export const colors=palettes.light;
export const radius={sm:10,md:16,lg:22};
