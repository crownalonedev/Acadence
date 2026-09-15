import 'react-native-gesture-handler';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { HomeLayoutProvider } from '@/context/HomeLayoutContext';
import { ThemeProvider, useAppTheme } from '@/context/ThemeContext';

function AppStack(){const {isDark}=useAppTheme();return <><StatusBar style={isDark?'light':'dark'}/><Stack screenOptions={{headerShown:false}}/></>}
export default function RootLayout(){return <GestureHandlerRootView style={{flex:1}}><SafeAreaProvider><ThemeProvider><HomeLayoutProvider><AppStack/></HomeLayoutProvider></ThemeProvider></SafeAreaProvider></GestureHandlerRootView>}
