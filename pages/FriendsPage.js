import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Image
} from 'react-native';
import {
  collection,
  onSnapshot,
} from 'firebase/firestore';

import { db, auth } from '../firebaseConfig';

const { width, height } = Dimensions.get('window');

const FriendsPage = ({ onBack, onVisitPlanet, onAddFriends }) => {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const currentUser = auth.currentUser;

  
  useEffect(() => {
    if (!currentUser || !currentUser.uid) {
      console.log('No user logged in or no UID');
      setLoading(false);
      return;
    }

    console.log('Setting up listener for user:', currentUser.uid); 

    const unsubscribe = onSnapshot(
      collection(db, 'friends', currentUser.uid, 'userFriends'),
      (snapshot) => {
        console.log('Firestore snapshot received:', snapshot.docs.length, 'friends');
        const friendsList = snapshot.docs.slice(0, 5).map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        
        setFriends(friendsList);
        setLoading(false);
      },
      (error) => {
        console.error('Error listening to friends:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Navigate to friend's planet
  const visitPlanet = (friend) => {
    onVisitPlanet(friend);
  };

  // Get position based on number of friends and index
  const getButtonPosition = (index, totalFriends) => {
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Different layouts based on number of friends
    switch (totalFriends) {
      case 1:
        // Single friend - center
        return { top: centerY - 40, left: centerX - 40 };
      
      case 2:
        // Two friends - left and right
        return index === 0
          ? { top: centerY - 40, left: centerX - 140 }
          : { top: centerY - 40, left: centerX + 60 };
      
      case 3:
        // Three friends - triangle formation
        if (index === 0) {
          return { top: centerY - 120, left: centerX - 40 }; // Top
        } else if (index === 1) {
          return { top: centerY + 20, left: centerX - 140 }; // Bottom left
        } else {
          return { top: centerY + 20, left: centerX + 60 }; // Bottom right
        }
      
      case 4:
        // Four friends - square formation
        if (index === 0) {
          return { top: centerY - 120, left: centerX - 140 }; // Top left
        } else if (index === 1) {
          return { top: centerY - 120, left: centerX + 60 }; // Top right
        } else if (index === 2) {
          return { top: centerY + 20, left: centerX - 140 }; // Bottom left
        } else {
          return { top: centerY + 20, left: centerX + 60 }; // Bottom right
        }
      
      case 5:
        // Five friends - pentagon/cross formation
        if (index === 0) {
          return { top: centerY - 140, left: centerX - 40 }; // Top center
        } else if (index === 1) {
          return { top: centerY - 40, left: centerX - 140 }; // Middle left
        } else if (index === 2) {
          return { top: centerY - 40, left: centerX + 60 }; // Middle right
        } else if (index === 3) {
          return { top: centerY + 60, left: centerX - 100 }; // Bottom left
        } else {
          return { top: centerY + 60, left: centerX + 20 }; // Bottom right
        }
      
      default:
        return { top: centerY - 40, left: centerX - 40 };
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.addFriendsButton} onPress={onAddFriends}>
        <Image 
            source={require("../resources/plus_icon.png")} 
            style={styles.button}
            />
      </TouchableOpacity>
      <Text style={styles.title}>Friends' Planets</Text>
      
      {friends.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No friends yet!</Text>
          <Text style={styles.emptySubtext}>Add friends to visit their planets</Text>
          <TouchableOpacity style={styles.emptyAddButton} onPress={onAddFriends}>
            <Text style={styles.buttonText}>Add Friends Now</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {friends.map((friend, index) => {
            const position = getButtonPosition(index, friends.length);
            
            return (
              <TouchableOpacity
                key={friend.id}
                style={[styles.planetButton, position]}
                onPress={() => visitPlanet(friend)}
                activeOpacity={0.8}
              >
                <View style={styles.planetIcon}>
                  <Text style={styles.planetEmoji}>🪐</Text>
                </View>
                <Text style={styles.friendName} numberOfLines={1}>
                  {friend.username}
                </Text>
              </TouchableOpacity>
            );
          })}
        </>
      )}

      {friends.length > 0 && friends.length < 5 && (
        <Text style={styles.slotsText}>
          {5 - friends.length} more friend slot{5 - friends.length !== 1 ? 's' : ''} available
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginTop: 60,
    marginBottom: 20,
  },
  planetButton: {
    position: 'absolute',
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planetIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  planetEmoji: {
    fontSize: 40,
  },
  backButton: { 
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    padding: 10,
  },
  friendName: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    maxWidth: 80,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
  slotsText: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
  },
});

export default FriendsPage;