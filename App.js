// import { StatusBar } from 'expo-status-bar';
// import { StyleSheet, Text, View } from 'react-native';

// export default function App() {
//   return (
//     <View style={styles.container}>
//       <Text>Open up App.js to start working on your app! loool</Text>
//       <StatusBar style="auto" />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#fff',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
// });

import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import Login from './pages/login';
import SignUp from './pages/signup';
import Home from './pages/home';
import PlanetPage from './pages/PlanetPage';

export default function App() {
  const [planetHealth, setPlanetHealth] = useState(27);
  const [currentScreen, setCurrentScreen] = useState('login'); // 'login', 'signup', 'home'
  const [currentUser, setCurrentUser] = useState(null);

  const navigateToNext = (healthValue) => {
    setPlanetHealth(healthValue);
    setCurrentScreen('planetpage');
  };
  const navigateToSignUp = () => setCurrentScreen('signup');
  const navigateToLogin = () => setCurrentScreen('login');
  const navigateToHome = (user) => {
    setCurrentUser(user);
    setCurrentScreen('home');
  };
  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentScreen('login');
  };

  return (
    <>
      {currentScreen === 'login' && (
        <Login 
          onNavigateToSignUp={navigateToSignUp}
          onLoginSuccess={navigateToHome}
        />
      )}
      {currentScreen === 'signup' && (
        <SignUp 
          onNavigateToLogin={navigateToLogin}
          onSignUpSuccess={navigateToHome}
        />
      )}
      {currentScreen === 'home' && (
        <Home 
          currentUser={currentUser}
          onLogout={handleLogout}
          onNextPage={navigateToNext}
          planetHealth={planetHealth}          
          setHealth={setPlanetHealth} 
        />
      )}
      <StatusBar style="auto" />
      {currentScreen === 'planetpage' && <PlanetPage health={planetHealth} setHealth={setPlanetHealth} />}
    </>
  );
}
