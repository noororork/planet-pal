import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Dimensions,
  Image,
  ImageBackground
} from 'react-native';
import { db, auth } from '../firebaseConfig';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc,
  updateDoc,
  doc,
  deleteDoc,
  increment,
  getDoc
} from 'firebase/firestore';

export default function FriendsScreen({ onBack, currentUser }) {
  const [activeTab, setActiveTab] = useState('friends');
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const { width, height } = Dimensions.get('window');

  useEffect(() => {
    loadFriends();
    loadFriendRequests();
  }, []);

  const loadFriends = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      // Query friendships where user is participant and status is accepted
      const friendshipsRef = collection(db, 'friendships');
      const q = query(
        friendshipsRef,
        where('users', 'array-contains', userId),
        where('status', '==', 'accepted')
      );

      const snapshot = await getDocs(q);
      const friendsList = [];
      

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        // Get the OTHER user's ID (not current user)
        const friendId = data.users.find(id => id !== userId);
        
        // Get friend's user data
        const userDocRef = doc(db, 'users', friendId);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const friendData = userDoc.data();
          friendsList.push({
            id: friendId,
            friendshipId: docSnap.id,
            displayName: friendData.displayName,
            planetName: friendData.planetName,
            email: friendData.email
          });
        }
      }

      setFriends(friendsList);
    } catch (error) {
      console.error('Error loading friends:', error);
      Alert.alert('Error', `Failed to load friends: ${error.message}`);
    }
  };

  const loadFriendRequests = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      const friendshipsRef = collection(db, 'friendships');
      const q = query(
        friendshipsRef,
        where('requestedTo', '==', userId),
        where('status', '==', 'pending')
      );

      const snapshot = await getDocs(q);
      const requestsList = [];

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        
        // Get requester's user data
        const userDocRef = doc(db, 'users', data.requestedBy);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const requesterData = userDoc.data();
          requestsList.push({
            id: data.requestedBy,
            friendshipId: docSnap.id,
            displayName: requesterData.displayName,
            planetName: requesterData.planetName,
            email: requesterData.email
          });
        }
      }

      setFriendRequests(requestsList);
    } catch (error) {
      console.error('Error loading friend requests:', error);
      Alert.alert('Error', `Failed to load requests: ${error.message}`);
    }
  };

  const searchUsers = async () => {
    if (!searchQuery.trim()) {
      Alert.alert('Error', 'Please enter a search term');
      return;
    }

    setLoading(true);
    try {
      const userId = auth.currentUser?.uid;
      const usersRef = collection(db, 'users');
      
      const q = query(
        usersRef,
        where('displayName', '>=', searchQuery),
        where('displayName', '<=', searchQuery + '\uf8ff')
      );

      const snapshot = await getDocs(q);
      const results = [];

      snapshot.forEach(docSnap => {
        if (docSnap.id !== userId) {
          results.push({
            id: docSnap.id,
            ...docSnap.data()
          });
        }
      });

      setSearchResults(results);
    } catch (error) {
      console.error('Error searching users:', error);
      Alert.alert('Error', 'Failed to search users');
    } finally {
      setLoading(false);
    }
  };

  const sendFriendRequest = async (toUserId, toUserName) => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      // Check if friendship already exists
      const friendshipsRef = collection(db, 'friendships');
      const existingQuery = query(
        friendshipsRef,
        where('users', 'array-contains', userId)
      );
      
      const existingSnapshot = await getDocs(existingQuery);
      const alreadyExists = existingSnapshot.docs.some(docSnap => {
        const data = docSnap.data();
        return data.users.includes(toUserId);
      });

      if (alreadyExists) {
        Alert.alert('Info', 'Friend request already sent or you are already friends');
        return;
      }

      // Create friendship document
      const users = [userId, toUserId].sort();
      
      await addDoc(collection(db, 'friendships'), {
        users: users,
        status: 'pending',
        requestedBy: userId,
        requestedTo: toUserId,
        createdAt: new Date().toISOString()
      });

      Alert.alert('Success', `Friend request sent to ${toUserName}!`);
    } catch (error) {
      console.error('Error sending friend request:', error);
      Alert.alert('Error', 'Failed to send friend request');
    }
  };

  const acceptFriendRequest = async (friendshipId, friendId) => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) return;
    
    // Update friendship status to accepted
    const friendshipRef = doc(db, 'friendships', friendshipId);
    await updateDoc(friendshipRef, {
      status: 'accepted',
      acceptedAt: new Date().toISOString()
    });

    // Only update current user's friend count (not the other user's)
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      friendCount: increment(1)
    });

    Alert.alert('Success', 'Friend request accepted!');
    
    // Reload both lists
    loadFriends();
    loadFriendRequests();
  } catch (error) {
    console.error('Error accepting friend request:', error);
    Alert.alert('Error', `Failed to accept: ${error.message}`);
  }
};

  const rejectFriendRequest = async (friendshipId) => {
    try {
      await deleteDoc(doc(db, 'friendships', friendshipId));
      Alert.alert('Success', 'Friend request rejected');
      loadFriendRequests();
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      Alert.alert('Error', 'Failed to reject friend request');
    }
  };


  const getButtonPosition = (index, totalFriends) => {
    const centerX = width / 2;
    const centerY = height / 2;
    
    switch (totalFriends) {
      case 1:
        return { top: centerY - 40, left: centerX - 40 };
      
      case 2:
        return index === 0
          ? { top: centerY - 40, left: centerX - 140 }
          : { top: centerY - 40, left: centerX + 60 };
      
      case 3:
        if (index === 0) {
          return { top: centerY - 120, left: centerX - 40 };
        } else if (index === 1) {
          return { top: centerY + 20, left: centerX - 140 };
        } else {
          return { top: centerY + 20, left: centerX + 60 };
        }
      
      case 4:
        if (index === 0) {
          return { top: centerY - 120, left: centerX - 140 };
        } else if (index === 1) {
          return { top: centerY - 120, left: centerX + 60 };
        } else if (index === 2) {
          return { top: centerY + 20, left: centerX - 140 };
        } else {
          return { top: centerY + 20, left: centerX + 60 };
        }
      
      case 5:
        if (index === 0) {
          return { top: centerY - 140, left: centerX - 40 };
        } else if (index === 1) {
          return { top: centerY - 40, left: centerX - 140 };
        } else if (index === 2) {
          return { top: centerY - 40, left: centerX + 60 };
        } else if (index === 3) {
          return { top: centerY + 60, left: centerX - 100 };
        } else {
          return { top: centerY + 60, left: centerX + 20 };
        }
      
      default:
        return { top: centerY - 40, left: centerX - 40 };
    }
  };

  // Navigate to friend's planet
  const visitPlanet = (friend) => {
    onVisitPlanet(friend);
  };

  // Render individual friend with your database structure
  const renderFriend = (friend, index) => {
    const position = getButtonPosition(index, friends.length);
    
    return (
      <TouchableOpacity
      key={friend.id}
      style={[styles.planetButton, position]}
      onPress={() => visitPlanet(friend)}
      activeOpacity={0.8}>
      <Image source={require('../resources/glow.png')} style={styles.planetImage} />

      <View style={styles.planetTextContainer}>
        <Text style={styles.planetDisplayName}>
          {friend.displayName || friend.username}
        </Text>
        <Text style={styles.planetName}>
          {friend.planetName || `${friend.username}'s Planet`}
        </Text>
      </View>
    </TouchableOpacity>
    );
  };

  const renderFriendRequest = (request) => (
    <View key={request.id} style={styles.userCard}>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{request.displayName}</Text>
        <Text style={styles.userPlanet}>🌍 {request.planetName}</Text>
      </View>
      <View style={styles.requestButtons}>
        <TouchableOpacity 
          style={styles.acceptButton}
          onPress={() => acceptFriendRequest(request.friendshipId, request.id)}
        >
          <Text style={styles.acceptButtonText}>Accept</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.rejectButton}
          onPress={() => rejectFriendRequest(request.friendshipId)}
        >
          <Text style={styles.rejectButtonText}>Reject</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSearchResult = (user) => (
    <View key={user.id} style={styles.userCard}>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{user.displayName}</Text>
        <Text style={styles.userPlanet}>🌍 {user.planetName}</Text>
      </View>
      <TouchableOpacity 
        style={styles.addButton}
        onPress={() => sendFriendRequest(user.id, user.displayName)}
      >
        <Text style={styles.addButtonText}>Add Friend</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Friends 👥</Text>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'friends' && styles.activeTab]}
          onPress={() => setActiveTab('friends')}
        >
          <Text style={[styles.tabText, activeTab === 'friends' && styles.activeTabText]}>
            My Friends ({friends.length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'requests' && styles.activeTab]}
          onPress={() => setActiveTab('requests')}
        >
          <Text style={[styles.tabText, activeTab === 'requests' && styles.activeTabText]}>
            Requests ({friendRequests.length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'search' && styles.activeTab]}
          onPress={() => setActiveTab('search')}
        >
          <Text style={[styles.tabText, activeTab === 'search' && styles.activeTabText]}>
            Search
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {activeTab === 'friends' && (
          <View style={styles.friendsContainer}>
          {friends.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No friends yet. Search for users to add!</Text>
            </View>
          ) : (
            friends.map((friend, index) => renderFriend(friend, index))
          )}
        </View>
        )}

        {activeTab === 'requests' && (
          <View>
            {friendRequests.length === 0 ? (
              <Text style={styles.emptyText}>No pending friend requests</Text>
            ) : (
              friendRequests.map(request => renderFriendRequest(request))
            )}
          </View>
        )}

        {activeTab === 'search' && (
          <View>
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search by display name..."
                placeholderTextColor="#8B7BC3"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              <TouchableOpacity 
                style={styles.searchButton}
                onPress={searchUsers}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.searchButtonText}>Search</Text>
                )}
              </TouchableOpacity>
            </View>
            
            {searchResults.length === 0 ? (
              <Text style={styles.emptyText}>
                {searchQuery ? 'No users found' : 'Enter a name to search'}
              </Text>
            ) : (
              searchResults.map(user => renderSearchResult(user))
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#060644',
  },
  friendsBackground: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
  },
  friendsContainer: {
    flex: 1,
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#9ec694',
    borderBottomWidth: 1,
    borderBottomColor: '#566253',
  },
  backButton: {
    marginBottom: 10,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#9ec694',
    borderBottomWidth: 1,
    borderBottomColor: '#566253',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: '#566253',
  },
  tabText: {
    color: '#566253',
    fontSize: 14,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  emptyText: {
    color: '#8B7BC3',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 40,
  },
  userCard: {
    backgroundColor: '#060644',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userPlanet: {
    color: '#A78BFA',
    fontSize: 14,
  },
  addButton: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  requestButtons: {
    flexDirection: 'row',
  },
  acceptButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  rejectButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  rejectButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#1E1B4B',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 16,
    marginRight: 12,
  },
  searchButton: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    minWidth: 80,
    alignItems: 'center',
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  friendsContainer: {
    flex: 1,
    position: 'relative', // Important for absolute positioning to work
  },
  
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  planetImage: {
    height: 50,
    width: 50
  },
  planetDisplayName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  planetName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  }
});