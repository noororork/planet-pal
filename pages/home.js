import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity 
} from 'react-native';

export default function HomeScreen({ currentUser, onLogout }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome! 🌍</Text>
      <Text style={styles.subtitle}>{currentUser?.email}</Text>
      {currentUser?.planetName && (
        <Text style={styles.planetName}>Planet: {currentUser.planetName}</Text>
      )}
      <TouchableOpacity style={styles.button} onPress={onLogout}>
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1B4B',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#C4B5FD',
    marginBottom: 32,
  },
  planetName: {
    fontSize: 16,
    color: '#A78BFA',
    marginBottom: 20,
  },
  button: {
    width: '100%',
    backgroundColor: '#7C3AED',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});