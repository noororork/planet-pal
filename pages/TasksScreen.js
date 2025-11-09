import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity,
  Alert,
  ScrollView
} from 'react-native';
import { db, auth } from '../firebaseConfig';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export default function TasksScreen({ onBack }) {
  const [tasks, setTasks] = useState({
    water: null,
    meals: null,
    exercise: null,
    sleep: null
  });
  const [loading, setLoading] = useState(true);

  const taskDetails = {
    water: { label: '💧 Drink 8 Glasses of Water', icon: '💧' },
    meals: { label: '🍽️ Eat 3 Meals', icon: '🍽️' },
    exercise: { label: '🏃 Exercise 30 Minutes', icon: '🏃' },
    sleep: { label: '😴 Sleep 7-8 Hours', icon: '😴' }
  };

  useEffect(() => {
    loadTodaysTasks();
  }, []);

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0]; // Format: YYYY-MM-DD
  };

  const loadTodaysTasks = async () => {
    try {
      const userId = auth.currentUser?.uid;
      console.log('Current user ID:', userId);
      if (!userId) return;

      const todayDate = getTodayDate();
      const taskDocRef = doc(db, 'users', userId, 'dailyTasks', todayDate);
      const taskDoc = await getDoc(taskDocRef);

      if (taskDoc.exists()) {
        setTasks(taskDoc.data().tasks || {
          water: null,
          meals: null,
          exercise: null,
          sleep: null
        });
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
      Alert.alert('Error', 'Failed to load today\'s tasks');
    } finally {
      setLoading(false);
    }
  };

  const toggleTask = async (taskKey, newValue) => {
    console.log('Button clicked!', taskKey, newValue);
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      const updatedTasks = { ...tasks, [taskKey]: newValue };
      setTasks(updatedTasks);

      // Calculate completed count
      const completedCount = Object.values(updatedTasks).filter(v => v === true).length;

      // Save to Firebase
      const todayDate = getTodayDate();
      const taskDocRef = doc(db, 'users', userId, 'dailyTasks', todayDate);
      
      await setDoc(taskDocRef, {
        date: todayDate,
        tasks: updatedTasks,
        completedCount: completedCount,
        lastUpdated: new Date().toISOString()
      });

      console.log('Task updated:', taskKey, newValue, 'Completed:', completedCount);

    } catch (error) {
      console.error('Error updating task:', error);
      Alert.alert('Error', 'Failed to update task');
    }
  };

  const getCompletionPercentage = () => {
    const completed = Object.values(tasks).filter(v => v === true).length;
    return Math.round((completed / 4) * 100);
  };

  const renderTaskItem = (taskKey) => {
    const task = taskDetails[taskKey];
    const isCompleted = tasks[taskKey] === true;
    const isIncomplete = tasks[taskKey] === false;

    return (
      <View key={taskKey} style={styles.taskItem}>
        <Text style={styles.taskLabel}>{task.label}</Text>
        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={[
              styles.statusButton,
              isCompleted && styles.completedButton
            ]}
            onPress={() => toggleTask(taskKey, true)}
          >
            <Text style={[
              styles.statusIcon,
              isCompleted && styles.statusIconActive
            ]}>✓</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.statusButton,
              isIncomplete && styles.incompleteButton
            ]}
            onPress={() => toggleTask(taskKey, false)}
          >
            <Text style={[
              styles.statusIcon,
              isIncomplete && styles.statusIconActive
            ]}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Daily Wellness Tasks</Text>
        <Text style={styles.dateText}>{new Date().toLocaleDateString()}</Text>
        
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            {getCompletionPercentage()}% Complete
          </Text>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${getCompletionPercentage()}%` }
              ]} 
            />
          </View>
        </View>
      </View>

      <View style={styles.tasksList}>
        {Object.keys(taskDetails).map(taskKey => renderTaskItem(taskKey))}
      </View>

      {onBack && (
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>Back to Home</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1B4B',
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  dateText: {
    fontSize: 16,
    color: '#C4B5FD',
    marginBottom: 20,
  },
  progressContainer: {
    marginTop: 10,
  },
  progressText: {
    fontSize: 18,
    color: '#A78BFA',
    marginBottom: 8,
    fontWeight: '600',
  },
  progressBar: {
    height: 10,
    backgroundColor: '#2D2463',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#7C3AED',
    borderRadius: 5,
  },
  tasksList: {
    padding: 20,
    paddingTop: 10,
  },
  taskItem: {
    backgroundColor: '#2D2463',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskLabel: {
    fontSize: 16,
    color: '#fff',
    flex: 1,
    fontWeight: '500',
  },
  buttonGroup: {
    flexDirection: 'row',
    // Removed gap property - not supported in all React Native versions
  },
  statusButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1E1B4B',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4C3A8F',
    marginLeft: 8, // Added margin instead of gap
  },
  completedButton: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  incompleteButton: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  statusIcon: {
    fontSize: 20,
    color: '#8B7BC3',
    fontWeight: 'bold',
  },
  statusIconActive: {
    color: '#fff',
  },
  backButton: {
    margin: 20,
    backgroundColor: '#7C3AED',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 100,
  },
});