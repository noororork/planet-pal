import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import Login from './pages/login';
import SignUp from './pages/signup';
import Home from './pages/home';
import PlanetPage from './pages/PlanetPage';
import TasksScreen from './pages/TasksScreen';
import ChatbotScreen from './pages/ChatbotScreen';

export default function App() {
  const [planetHealth, setPlanetHealth] = useState(27);
  const [currentScreen, setCurrentScreen] = useState('login'); // 'login', 'signup', 'home'
  const [currentUser, setCurrentUser] = useState(null);

  const navigateToNext = (healthValue) => {
    setPlanetHealth(healthValue);
    setCurrentScreen('planetpage');
  };

  const navigateToChatbot = () => {
  setCurrentScreen('chatbot');
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

  const navigateToTasks = () => {
    setCurrentScreen('tasks');
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

      {currentScreen === 'tasks' && (
        <TasksScreen onBack={() => setCurrentScreen('home')} />
      )}

      {currentScreen === 'planetpage' && (
        <PlanetPage health={planetHealth} setHealth={setPlanetHealth} />
      )}

      {currentScreen === 'chatbot' && (
        <ChatbotScreen 
          onBack={() => setCurrentScreen('home')}
          currentUser={currentUser}
        />
      )}

      <StatusBar style="auto" />
    </>
  );
}