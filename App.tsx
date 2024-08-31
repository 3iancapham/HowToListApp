import React, { useState, useEffect } from 'react';
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
import { sendMessage, Task, Subtask } from './src/aiConfig';

const Stack = createStackNavigator();

const ChatScreen = ({ navigation }: { navigation: any }) => {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!message.trim()) return;

    setIsLoading(true);
    try {
      const tasks = await sendMessage(message);
      console.log('Received tasks in ChatScreen:', JSON.stringify(tasks, null, 2));
      if (tasks.length > 0) {
        navigation.navigate('TodoList', { tasks: tasks, topic: message });
      } else {
        console.log('No tasks received from AI');
        Alert.alert('Error', 'No tasks were generated. Please try a different question.');
      }
    } catch (error) {
      console.error('Error getting AI response:', error);
      Alert.alert('Error', 'Failed to get a response from the AI. Please try again.');
    } finally {
      setIsLoading(false);
    }
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

const TodoListScreen = ({ route }: { route: any }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [expandedTasks, setExpandedTasks] = useState<string[]>([]);
  const topic = route.params?.topic || 'Unknown Topic';

  useEffect(() => {
    console.log('Route params:', JSON.stringify(route.params, null, 2));
    if (route.params?.tasks && Array.isArray(route.params.tasks)) {
      console.log('Setting tasks:', JSON.stringify(route.params.tasks, null, 2));
      setTasks(route.params.tasks);
    } else {
      console.log('No tasks received or tasks are not in the expected format');
    }
  }, [route.params]);

  const toggleTask = (taskId: string) => {
    setExpandedTasks(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  const toggleSubtask = (taskId: string, subtaskId: string) => {
    setTasks(tasks.map(task => 
      task.id === taskId
        ? {
            ...task,
            subtasks: task.subtasks.map(subtask =>
              subtask.id === subtaskId
                ? { ...subtask, completed: !subtask.completed }
                : subtask
            ),
          }
        : task
    ));
  };

  const renderSubtask = ({ item, taskId }: { item: Subtask; taskId: string }) => (
    <TouchableOpacity onPress={() => toggleSubtask(taskId, item.id)} style={styles.subtaskItem}>
      <View style={[styles.checkbox, item.completed && styles.checked]} />
      <Text style={[styles.subtaskText, item.completed && styles.completedText]}>
        {item.text}
      </Text>
    </TouchableOpacity>
  );

  const renderTask = ({ item }: { item: Task }) => (
    <View style={styles.taskItem}>
      <TouchableOpacity onPress={() => toggleTask(item.id)} style={styles.taskHeader}>
        <Text style={styles.taskText}>{item.text}</Text>
        <Text>{expandedTasks.includes(item.id) ? '▲' : '▼'}</Text>
      </TouchableOpacity>
      {expandedTasks.includes(item.id) && (
        <>
          <FlatList
            data={item.subtasks}
            renderItem={({ item: subtask }) => renderSubtask({ item: subtask, taskId: item.id })}
            keyExtractor={(subtask) => subtask.id}
          />
          {item.media && (
            <Text style={styles.mediaText}>{item.media}</Text>
          )}
        </>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.title}>{topic}</Text>
      </View>
      {tasks.length > 0 ? (
        <FlatList
          data={tasks}
          renderItem={renderTask}
          keyExtractor={(item) => item.id}
          style={styles.list}
        />
      ) : (
        <Text style={styles.noTasksText}>No tasks available</Text>
      )}
    </SafeAreaView>
  );
};

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
    backgroundColor: '#4169E1',
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
    backgroundColor: '#4169E1',
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
  disabledButton: {
    backgroundColor: '#A9A9A9',
  },
  list: {
    flex: 1,
    padding: 20,
  },
  taskItem: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskText: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 10,
  },
  subtaskItem: {
    marginLeft: 20,
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  subtaskText: {
    fontSize: 16,
    flex: 1,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: 'gray',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#4169E1',
    marginRight: 10,
  },
  checked: {
    backgroundColor: '#4169E1',
  },
  noTasksText: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 20,
  },
  mediaText: {
    fontStyle: 'italic',
    marginTop: 10,
    color: '#666',
  },
});

export default App;