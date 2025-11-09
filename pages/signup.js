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
  const [displayName, setDisplayName] = useState('');

  const handleSignUp = async () => {
    if (!planetName || !email || !password || !displayName) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const userId = userCredential.user.uid;

      // Save user data to Firestore (Functionality preserved from file 1)
      await setDoc(doc(db, 'users', userId), {
        planetName: planetName,
        displayName: displayName,
        email: email,
        friendCount: 0,
        createdAt: new Date().toISOString()
      });

      onSignUpSuccess({ email, planetName, displayName });
      Alert.alert('Success', 'Account created!');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <ImageBackground
      source={require('../resources/9.png')} // Replace with your actual image path if different
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.contentContainer}>
        <Text style={styles.title}>Wellness Planet</Text> 
        <Text style={styles.subtitle}>Create Account</Text>

        <TextInput
          style={styles.input}
          placeholder="Display Name (for friends to find you)"
          placeholderTextColor="#6B7280"
          value={displayName}
          onChangeText={setDisplayName}
        />

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
      </View>
    </ImageBackground>
  );
}

// Styles are copied from the second file for consistency
const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  contentContainer: {
    flex: 1,
    // Semi-transparent overlay for text readability over the image
    backgroundColor: 'rgba(30, 27, 75, 0.7)', 
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
    color: '#fff',
    marginBottom: 32,
  },
  input: {
    width: '100%',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    fontSize: 16,
    color: '#1E1B4B', // Ensure input text is dark
  },
  button: {
    width: '100%',
    backgroundColor: '#52869eff', // Button color from the second file
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
  link: {
    color: '#fff', // White link color for contrast
    marginTop: 20,
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});