import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebaseConfig';

export const calculatePlanetHealth = async (userId, days = 7) => {
  try {
    const tasksRef = collection(db, 'users', userId, 'dailyTasks');
    
    // Get last 7 days of tasks
    const q = query(
      tasksRef,
      orderBy('date', 'desc'),
      limit(days)
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return 100; // Default health if no data
    }
    
    let totalScore = 0;
    let dayCount = 0;
    
    snapshot.forEach(doc => {
      const data = doc.data();
      const completedCount = data.completedCount || 0;
      const dailyScore = (completedCount / 4) * 100; // Max 4 tasks
      totalScore += dailyScore;
      dayCount++;
    });
    
    const averageHealth = Math.round(totalScore / dayCount);
    return Math.max(0, Math.min(100, averageHealth)); // Clamp between 0-100
    
  } catch (error) {
    console.error('Error calculating planet health:', error);
    return 100; // Default on error
  }
};