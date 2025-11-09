import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity,
  Alert,
  ScrollView,
  ImageBackground
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
    water: { label: 'Drink 8 Glasses of Water', icon: '💧' },
    meals: { label: 'Eat 3 Meals', icon: '🍽️' },
    exercise: { label: 'Exercise 30 Minutes', icon: '🏃' },
    sleep: { label: 'Sleep 7-8 Hours', icon: '😴' }
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
      // NOTE: Using a mock user ID if auth is unavailable in the environment
      const userId = auth.currentUser?.uid || 'mock-tasks-user'; 
      if (!userId) return;

      const todayDate = getTodayDate();
      // Using a simplified mock path for safety in this environment
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
    try {
      const userId = auth.currentUser?.uid || 'mock-tasks-user';
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
      }, { merge: true }); // Use merge to prevent overwriting other fields

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
        <Text style={styles.taskLabel}>{task.icon} {task.label}</Text>
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
      <View style={[styles.background, styles.loadingOverlay]}>
        <Text style={styles.loadingText}>Loading tasks from your planet...</Text>
      </View>
    );
  }

  return (
    <ImageBackground
      source={require('../resources/9.png')} // Background image source
      style={styles.background}
      resizeMode="cover"
    >
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Your Daily Missions </Text>
          <Text style={styles.dateText}>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</Text>
          
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>
              {getCompletionPercentage()}% Progress
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
            <Text style={styles.backButtonText}>← Back to Home</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  // --- COLOR PALETTE ---
  // Deep Teal Blue: #1C3B5E (Base/Dark)
  // Soft Blue/Grey: #396C8E (Card BG)
  // Teal Blue Accent: #60B3B0 (Primary Button/Progress Fill)
  // Mint Green: #8EE4AF (Accents/Progress Text)
  // Pale Cyan: #E0F7FA (Light Text)
  // Pastel Green: #77DD77 (Completed)
  // Pastel Orange: #FFB347 (Incomplete)

  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  contentContainer: {
    flexGrow: 1,
    backgroundColor: 'rgba(28, 59, 94, 0.9)', // Deep Teal Blue overlay
    paddingBottom: 40,
  },
  loadingOverlay: {
    backgroundColor: 'rgba(28, 59, 94, 1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 30,
    paddingTop: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#E0F7FA', // Pale Cyan text
    marginBottom: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  dateText: {
    fontSize: 16,
    color: '#A9D6E5', // Light Blue text
    marginBottom: 25,
  },
  progressContainer: {
    marginTop: 15,
    backgroundColor: 'rgba(57, 108, 142, 0.5)', // Soft Blue/Grey transparent background
    padding: 15,
    borderRadius: 12,
  },
  progressText: {
    fontSize: 18,
    color: '#8EE4AF', // Mint Green
    marginBottom: 10,
    fontWeight: '700',
  },
  progressBar: {
    height: 12,
    backgroundColor: '#1C3B5E', // Deep Teal Blue track
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#60B3B0', // Teal Blue fill
    borderRadius: 6,
  },
  tasksList: {
    paddingHorizontal: 30,
    paddingVertical: 10,
  },
  taskItem: {
    backgroundColor: '#396C8E', // Soft Blue/Grey card background
    borderRadius: 16,
    padding: 20,
    marginBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 8,
  },
  taskLabel: {
    fontSize: 17,
    color: '#E0F7FA', // Pale Cyan text
    flex: 1,
    fontWeight: '500',
  },
  buttonGroup: {
    flexDirection: 'row',
  },
  statusButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1C3B5E', // Deep Teal Blue button background
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#A9D6E5', // Light Blue border
    marginLeft: 10,
  },
  completedButton: {
    backgroundColor: '#77DD77', // Pastel Green
    borderColor: '#4CAF50',
  },
  incompleteButton: {
    backgroundColor: '#f6e248ff', // Pastel Orange
    borderColor: '#f6e248ff',
  },
  statusIcon: {
    fontSize: 22,
    color: '#A9D6E5', // Light Blue icon idle color
    fontWeight: 'bold',
  },
  statusIconActive: {
    color: '#fff',
  },
  backButton: {
    marginHorizontal: 30,
    marginTop: 20,
    backgroundColor: '#60B3B0', // Teal Blue button
    padding: 18,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#60B3B0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  backButtonText: {
    color: '#E0F7FA',
    fontSize: 16,
    fontWeight: '700',
  },
  loadingText: {
    color: '#E0F7FA',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 100,
  },
});