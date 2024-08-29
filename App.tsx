/**
 * Sample React Native App from Claude AI using the To Do List Artifact
 *
 * @format
 */

import 'react-native-gesture-handler';
import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  StyleSheet,
  StatusBar,
  Platform,
  Alert,
} from 'react-native';
import axios from 'axios'; // You'll need to install this package

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY; // Replace with your actual API key

const Stack = createStackNavigator();

const ChatScreen = ({ navigation }) => {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!message.trim()) return;

    setIsLoading(true);
    try {
      const response = await axios.post(
        'https://api.anthropic.com/v1/messages',
        {
          model: "claude-3-opus-20240229",
          max_tokens: 1000,
          messages: [{ role: "user", content: message }]
        },
        {
          headers: {
            'x-api-key': ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json',
          },
        }
      );

      const aiResponse = response.data.content[0].text;
      const steps = parseResponseIntoSteps(aiResponse);
      navigation.navigate('TodoList', { steps, topic: message });
    } catch (error) {
      console.error('Error calling Anthropic API:', error);
      Alert.alert('Error', 'Failed to get a response from the AI. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const parseResponseIntoSteps = (response) => {
    // This is a simple parser. You might need to adjust it based on the AI's output format.
    const lines = response.split('\n');
    return lines.map((line, index) => ({
      id: (index + 1).toString(),
      text: line.replace(/^\d+\.\s*/, '').trim(),
      completed: false,
    })).filter(step => step.text);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.title}>AI How-to Chat</Text>
      </View>
      <View style={styles.chatContainer}>
        <Text style={styles.chatPrompt}>Ask a "How to" question:</Text>
        <TextInput
          style={styles.input}
          value={message}
          onChangeText={setMessage}
          placeholder="How to..."
          placeholderTextColor="#9E9E9E"
        />
        <TouchableOpacity 
          style={[styles.sendButton, isLoading && styles.disabledButton]} 
          onPress={handleSend}
          disabled={isLoading}
        >
          <Text style={styles.sendButtonText}>{isLoading ? 'Thinking...' : 'Send'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const TodoListScreen = ({ route }) => {
  const [todos, setTodos] = useState(route.params.steps);
  const [newTask, setNewTask] = useState('');
  const topic = route.params.topic;

  const toggleTodo = (id) => {
    setTodos(todos.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const addTask = () => {
    if (newTask.trim()) {
      setTodos([...todos, { id: Date.now().toString(), text: newTask.trim(), completed: false }]);
      setNewTask('');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.title}>{`How to ${topic}`}</Text>
      </View>
      <FlatList
        data={todos}
        renderItem={({ item }) => (
          <TodoItem item={item} onToggle={toggleTodo} />
        )}
        keyExtractor={item => item.id}
        style={styles.list}
      />
      <View style={styles.addTaskContainer}>
        <TextInput
          style={styles.addTaskInput}
          value={newTask}
          onChangeText={setNewTask}
          placeholder="Add a new task"
          placeholderTextColor="#9E9E9E"
        />
        <TouchableOpacity style={styles.addTaskButton} onPress={addTask}>
          <Text style={styles.addTaskButtonText}>Add</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const TodoItem = ({ item, onToggle }) => (
  <TouchableOpacity onPress={() => onToggle(item.id)} style={styles.todoItem}>
    <View style={[styles.checkbox, item.completed && styles.checked]} />
    <Text style={[styles.todoText, item.completed && styles.completedTodoText]}>
      {item.text}
    </Text>
  </TouchableOpacity>
);

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Chat" component={ChatScreen} />
        <Stack.Screen name="TodoList" component={TodoListScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#4169E1', // Changed from '#4A90E2' to royal blue
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    paddingBottom: 15,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 10,
  },
  chatContainer: {
    padding: 20,
  },
  chatPrompt: {
    fontSize: 18,
    color: '#333',
    marginBottom: 10,
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sendButton: {
    backgroundColor: '#4169E1', // Changed from '#4A90E2' to royal blue
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sendButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  list: {
    marginTop: 10,
    paddingHorizontal: 20,
  },
  todoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 10,
    marginBottom: 10,
    paddingVertical: 15,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4169E1', // Changed from '#4A90E2' to royal blue
    marginRight: 10,
  },
  checked: {
    backgroundColor: '#4169E1', // Changed from '#4A90E2' to royal blue
  },
  todoText: {
    flex: 1,
    fontSize: 16,
    color: '#212121',
  },
  completedTodoText: {
    textDecorationLine: 'line-through',
    color: '#9E9E9E',
  },
  addTaskContainer: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  addTaskInput: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: 10,
    marginRight: 10,
    fontSize: 16,
  },
  addTaskButton: {
    backgroundColor: '#4169E1', // Changed from '#4A90E2' to royal blue
    borderRadius: 10,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addTaskButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#A9A9A9',
  },
});

export default App;