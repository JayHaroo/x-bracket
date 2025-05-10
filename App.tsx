import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import "./global.css"
import Landing from './pages/Landing';

export default function App() {
  return (
    <View className='flex-1'> 
      <Landing />
      <StatusBar style="auto" />
    </View>
  );
}

