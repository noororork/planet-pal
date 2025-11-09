import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import Login from './pages/login';
import SignUp from './pages/signup';
import Home from './pages/home';
import PlanetPage from './pages/PlanetPage';
import TasksScreen from './pages/TasksScreen';
import ChatbotScreen from './pages/ChatbotScreen';
import FriendsScreen from './pages/FriendsScreen';
import FriendRequestPage from './pages/FriendRequestPage';

export default function App() {
  const [planetHealth, setPlanetHealth] = useState(27);
  const [currentScreen, setCurrentScreen] = useState('login'); // 'login', 'signup', 'home'
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedFriend, setSelectedFriend] = useState(null);

  const navigateToNext = (healthValue) => {
    setPlanetHealth(healthValue);
    setCurrentScreen('planetpage');
  };

  const navigateToChatbot = () => {
    setCurrentScreen('chatbot');
  };

  const navigateToFriends = () => {
    setCurrentScreen('friends');
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

  const navigateToFriendPlanet = (friend) => {
    setSelectedFriend(friend);
    setCurrentScreen('friendplanet');
  };

  const navigateToAddFriends = () => {
    setCurrentScreen('addfriends');
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
          onNavigateToTasks={navigateToTasks}
          onNavigateToChatbot={navigateToChatbot}
          onNavigateToFriends={navigateToFriends}
          planetHealth={planetHealth}          
          setHealth={setPlanetHealth} 
        />
      )}

      {currentScreen === 'tasks' && (
        <TasksScreen onBack={() => setCurrentScreen('home')} />
      )}

      {currentScreen === 'planetpage' && (
        <PlanetPage health={planetHealth} 
        setHealth={setPlanetHealth} 
        onNavigateToFriends={navigateToFriends}/>
      )}

      {currentScreen === 'chatbot' && (
        <ChatbotScreen 
          onBack={() => setCurrentScreen('home')}
          currentUser={currentUser}
        />
      )}

      {currentScreen === 'friends' && (
        <FriendsScreen 
          onBack={() => setCurrentScreen('planetpage')}
          onVisitPlanet={navigateToFriendPlanet}
        />
      )}

      {currentScreen === 'friendplanet' && selectedFriend && (
        <PlanetPage 
          health={100} // make sure to chnage to fetch from their database
          setHealth={() => {}} // read only
          isFriendPlanet={true}
          friendData={selectedFriend}
          onNavigateToFriends={navigateToFriends}
          onBack={() => setCurrentScreen('friends')}
          onAddFriends={navigateToAddFriends}
        />
      )}

      {currentScreen === 'addfriends' && (
        <FriendRequestPage 
          onBack={() => setCurrentScreen('friends')}
        />
      )}

      <StatusBar style="auto" />
    </>
  );
}