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
import { auth } from '../firebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';

export default function LoginScreen({ onNavigateToSignUp, onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // NOTE: Alert is used here for simple error/success messages
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      onLoginSuccess({ email: userCredential.user.email });
      Alert.alert('Success', 'Logged in!');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <ImageBackground
      source={require('../resources/9.png')} // <-- Set the background image source
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.contentContainer}>
        <Text style={styles.title}> Planet Pal </Text>
        <Text style={styles.subtitle}>Welcome Back!</Text>

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

        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onNavigateToSignUp}>
          <Text style={styles.link}>
            Don't have an account? Sign up
          </Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  // New style for ImageBackground
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  // Adjusted container style for content and added a dark overlay
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
    backgroundColor: '#52869eff',
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
    color: '#fff',
    marginTop: 20,
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});