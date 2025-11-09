import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity,
  Alert,
  ImageBackground // <-- Added ImageBackground
} from 'react-native';
import { auth, db } from '../firebaseConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

export default function SignUpScreen({ onNavigateToLogin, onSignUpSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [planetName, setPlanetName] = useState('');

  const handleSignUp = async () => {
    // Keeping Alert here as per the original file structure for now.
    if (!planetName || !email || !password) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const userId = userCredential.user.uid;

      // Save planet name and basic user data to Firestore
      await setDoc(doc(db, 'users', userId), {
        planetName: planetName,
        email: email,
        createdAt: new Date().toISOString()
      });

      onSignUpSuccess({ email, planetName });
      Alert.alert('Success', 'Account created! Welcome to Wellness Planet.');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <ImageBackground
      source={require('../resources/7.png')} // Set the background image source
      style={styles.background}
      resizeMode="cover"
    >
      {/* Content Container with dark overlay and centered content */}
      <View style={styles.contentContainer}>
        <Text style={styles.title}> New Journey </Text>
        <Text style={styles.subtitle}>Create Your Wellness Planet</Text>

        <TextInput
          style={styles.input}
          placeholder="Planet Name"
          placeholderTextColor="#6B7280"
          value={planetName}
          onChangeText={setPlanetName}
        />

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#6B7280"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#6B7280"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity style={styles.button} onPress={handleSignUp}>
          <Text style={styles.buttonText}>Sign Up</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onNavigateToLogin}>
          <Text style={styles.link}>
            Already have an account? Login
          </Text>
        </TouchableOpacity>
        
        <View style={styles.spacer} />
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  contentContainer: {
    flex: 1,
    // Semi-transparent overlay for text readability over the image
    backgroundColor: 'rgba(30, 27, 75, 0.85)', 
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    paddingVertical: 40, 
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    marginTop: -50,
  },
  subtitle: {
    fontSize: 18,
    color: '#fff',
    marginBottom: 40,
  },
  input: {
    width: '100%',
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 10,
    marginBottom: 16,
    fontSize: 16,
    color: '#1E1B4B',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  button: {
    width: '100%',
    backgroundColor: '#52869eff',
    padding: 18,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#52869eff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  link: {
    color: '#fff',
    marginTop: 30,
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  spacer: {
    flex: 0.1,
  }
});