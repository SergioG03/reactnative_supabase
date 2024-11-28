import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, Button, FlatList, Alert, TouchableOpacity } from 'react-native';
import { supabase } from '../lib/supabase';

export default function TaskManager() {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [editingTask, setEditingTask] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, []);

  // Fetch tasks from Supabase
  const fetchTasks = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) Alert.alert('Error fetching tasks', error.message);
    else setTasks(data);
    setLoading(false);
  };

  // Add or update a task
  const saveTask = async () => {
    if (!newTask.trim()) {
      Alert.alert('Validation', 'Task title cannot be empty');
      return;
    }

    if (editingTask) {
      // Update task
      const { error } = await supabase
        .from('tasks')
        .update({ title: newTask })
        .eq('id', editingTask.id);

      if (error) {
        Alert.alert('Error updating task', error.message);
        return;
      }

      // Update local state
      setTasks(tasks.map((task) =>
        task.id === editingTask.id ? { ...task, title: newTask } : task
      ));
      setEditingTask(null);
    } else {
      // Add new task
      const { data, error } = await supabase
        .from('tasks')
        .insert([{ title: newTask, is_complete: false }]);

      if (error) {
        Alert.alert('Error adding task', error.message);
        return;
      }

      // Update local state with the new task
      setTasks([data[0], ...tasks]);
    }

    setNewTask('');
  };

  // Mark task as complete or in-progress
  const toggleComplete = async (id, isComplete) => {
    const { error } = await supabase
      .from('tasks')
      .update({ is_complete: !isComplete })
      .eq('id', id);

    if (error) Alert.alert('Error updating task', error.message);
    else setTasks(tasks.map((task) =>
      task.id === id ? { ...task, is_complete: !isComplete } : task
    ));
  };

  // Delete a task
  const deleteTask = async (id) => {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) Alert.alert('Error deleting task', error.message);
    else setTasks(tasks.filter((task) => task.id !== id));
  };

  // Start editing a task
  const startEditing = (task) => {
    setNewTask(task.title);
    setEditingTask(task);
  };

  // Separate tasks into completed and pending
  const incompleteTasks = tasks.filter((task) => !task.is_complete);
  const completedTasks = tasks.filter((task) => task.is_complete);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Task Manager</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter Task"
        value={newTask}
        onChangeText={setNewTask}
      />
      <Button title={editingTask ? "Update Task" : "Add Task"} onPress={saveTask} />

      {/* Incomplete tasks */}
      <Text style={styles.subHeader}>Tasks to Complete</Text>
      <FlatList
        data={incompleteTasks}
        keyExtractor={(item) => item.id.toString()}
        refreshing={loading}
        onRefresh={fetchTasks}
        renderItem={({ item }) => (
          <View style={styles.taskItem}>
            <TouchableOpacity onPress={() => toggleComplete(item.id, item.is_complete)}>
              <Text style={styles.taskTitle}>{item.title}</Text>
            </TouchableOpacity>
            <View style={styles.actions}>
              <Button title="Edit" onPress={() => startEditing(item)} />
              <Button title="Completed" onPress={() => toggleComplete(item.id, item.is_complete)} />
              <Button title="Delete" onPress={() => deleteTask(item.id)} />
            </View>
          </View>
        )}
      />

      {/* Completed tasks */}
      <Text style={styles.subHeader}>Completed Tasks</Text>
      <FlatList
        data={completedTasks}
        keyExtractor={(item) => item.id.toString()}
        refreshing={loading}
        onRefresh={fetchTasks}
        renderItem={({ item }) => (
          <View style={styles.taskItem}>
            <TouchableOpacity onPress={() => toggleComplete(item.id, item.is_complete)}>
              <Text style={[styles.taskTitle, styles.completedTask]}>
                {item.title}
              </Text>
            </TouchableOpacity>
            <View style={styles.actions}>
              <Button title="Edit" onPress={() => startEditing(item)} />
              <Button title="Delete" onPress={() => deleteTask(item.id)} />
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  subHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  taskItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskTitle: {
    fontSize: 16,
    flex: 1,
  },
  completedTask: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
});
