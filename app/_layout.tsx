import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { HomeLayoutProvider } from '@/context/HomeLayoutContext';

export default function RootLayout(){return <SafeAreaProvider><HomeLayoutProvider><StatusBar style="dark"/><Stack screenOptions={{headerShown:false}}/></HomeLayoutProvider></SafeAreaProvider>}
