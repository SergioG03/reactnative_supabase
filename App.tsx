import React from 'react';
import { View } from 'react-native';
import TaskManager from './components/TaskManager';

export default function App() {
  return (
    <View style={{ flex: 1 }}>
      <TaskManager />
    </View>
  );
}
