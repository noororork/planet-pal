import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';

import { db, auth } from '../firebaseConfig'; 

const FriendRequestPage = ({ onBack }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('search');

  const currentUser = auth.currentUser;

  // Listen to received friend requests in real-time
  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = onSnapshot(
      collection(db, 'friendRequests', currentUser.uid, 'received'),
      (snapshot) => {
        const requests = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setReceivedRequests(requests);
      },
      (error) => {
        console.error('Error listening to received requests:', error);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Listen to sent friend requests in real-time
  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = onSnapshot(
      collection(db, 'friendRequests', currentUser.uid, 'sent'),
      (snapshot) => {
        const requests = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setSentRequests(requests);
      },
      (error) => {
        console.error('Error listening to sent requests:', error);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Listen to friends list in real-time
  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = onSnapshot(
      collection(db, 'friends', currentUser.uid),
      (snapshot) => {
        const friendsList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setFriends(friendsList);
      },
      (error) => {
        console.error('Error listening to friends:', error);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Search users by username
  const searchUsers = async () => {
    if (!searchQuery.trim()) {
      Alert.alert('Error', 'Please enter a username to search');
      return;
    }

    setLoading(true);
    try {
      const usersRef = collection(db, 'users');
      const q = query(
        usersRef,
        where('username', '>=', searchQuery.toLowerCase()),
        where('username', '<=', searchQuery.toLowerCase() + '\uf8ff')
      );
      
      const querySnapshot = await getDocs(q);
      const users = querySnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
        }))
        .filter(user => user.id !== currentUser.uid); // Exclude yourself

      setSearchResults(users);

      if (users.length === 0) {
        Alert.alert('No Results', 'No users found with that username');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to search users');
      console.error(error);
    }
    setLoading(false);
  };

  // Check relationship status with a user
  const getRelationshipStatus = (userId) => {
    // Check if already friends
    if (friends.some(friend => friend.id === userId)) {
      return 'friends';
    }
    
    // Check if request already sent
    if (sentRequests.some(req => req.toUserId === userId)) {
      return 'pending';
    }
    
    // Check if received request from this user
    if (receivedRequests.some(req => req.fromUserId === userId)) {
      return 'received';
    }
    
    return 'none';
  };

  // Send friend request
  const sendFriendRequest = async (toUser) => {
    try {
      const status = getRelationshipStatus(toUser.id);
      
      if (status === 'friends') {
        Alert.alert('Already Friends', 'You are already friends with this user');
        return;
      }
      
      if (status === 'pending') {
        Alert.alert('Request Pending', 'You already sent a friend request to this user');
        return;
      }
      
      if (status === 'received') {
        Alert.alert('Request Received', 'This user already sent you a friend request. Check your Requests tab.');
        return;
      }

      const requestId = `${currentUser.uid}_${toUser.id}`;
      
      // Get current user data
      const currentUserDoc = await getDoc(doc(db, 'users', currentUser.uid));
      const currentUserData = currentUserDoc.data();

      // Add to sender's sent requests
      await setDoc(
        doc(db, 'friendRequests', currentUser.uid, 'sent', requestId),
        {
          toUserId: toUser.id,
          toUsername: toUser.username,
          toEmail: toUser.email,
          status: 'pending',
          timestamp: serverTimestamp(),
        }
      );

      // Add to recipient's received requests
      await setDoc(
        doc(db, 'friendRequests', toUser.id, 'received', requestId),
        {
          fromUserId: currentUser.uid,
          fromUsername: currentUserData.username,
          fromEmail: currentUserData.email,
          status: 'pending',
          timestamp: serverTimestamp(),
        }
      );

      Alert.alert('Success', `Friend request sent to ${toUser.username}!`);
      
      // Clear search to show updated status
      setSearchResults([]);
      setSearchQuery('');
    } catch (error) {
      Alert.alert('Error', 'Failed to send friend request');
      console.error(error);
    }
  };

  // Accept friend request
  const acceptFriendRequest = async (request) => {
    try {
      const requestId = `${request.fromUserId}_${currentUser.uid}`;

      // Get current user data
      const currentUserDoc = await getDoc(doc(db, 'users', currentUser.uid));
      const currentUserData = currentUserDoc.data();

      // Add to both users' friends list
      await setDoc(doc(db, 'friends', currentUser.uid, request.fromUserId), {
        username: request.fromUsername,
        email: request.fromEmail,
        since: serverTimestamp(),
      });

      await setDoc(doc(db, 'friends', request.fromUserId, currentUser.uid), {
        username: currentUserData.username,
        email: currentUserData.email,
        since: serverTimestamp(),
      });

      // Delete friend requests from both users
      await deleteDoc(doc(db, 'friendRequests', currentUser.uid, 'received', requestId));
      await deleteDoc(doc(db, 'friendRequests', request.fromUserId, 'sent', requestId));

      Alert.alert('Success', `You are now friends with ${request.fromUsername}!`);
    } catch (error) {
      Alert.alert('Error', 'Failed to accept friend request');
      console.error(error);
    }
  };

  // Reject friend request
  const rejectFriendRequest = async (request) => {
    try {
      const requestId = `${request.fromUserId}_${currentUser.uid}`;

      // Delete from both users
      await deleteDoc(doc(db, 'friendRequests', currentUser.uid, 'received', requestId));
      await deleteDoc(doc(db, 'friendRequests', request.fromUserId, 'sent', requestId));

      Alert.alert('Rejected', 'Friend request rejected');
    } catch (error) {
      Alert.alert('Error', 'Failed to reject friend request');
      console.error(error);
    }
  };

  // Cancel sent friend request
  const cancelFriendRequest = async (request) => {
    Alert.alert(
      'Cancel Request',
      `Cancel friend request to ${request.toUsername}?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          onPress: async () => {
            try {
              const requestId = `${currentUser.uid}_${request.toUserId}`;

              await deleteDoc(doc(db, 'friendRequests', currentUser.uid, 'sent', requestId));
              await deleteDoc(doc(db, 'friendRequests', request.toUserId, 'received', requestId));

              Alert.alert('Cancelled', 'Friend request cancelled');
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel friend request');
              console.error(error);
            }
          },
        },
      ]
    );
  };

  // Render search result item
  const renderSearchItem = ({ item }) => {
    const status = getRelationshipStatus(item.id);
    
    return (
      <View style={styles.card}>
        <View style={styles.userInfo}>
          <Text style={styles.username}>{item.username}</Text>
          <Text style={styles.email}>{item.email}</Text>
        </View>
        {status === 'friends' ? (
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>✓ Friends</Text>
          </View>
        ) : status === 'pending' ? (
          <View style={[styles.statusBadge, styles.pendingBadge]}>
            <Text style={styles.statusText}>Pending</Text>
          </View>
        ) : status === 'received' ? (
          <TouchableOpacity
            style={styles.respondButton}
            onPress={() => setActiveTab('requests')}
          >
            <Text style={styles.buttonText}>Respond</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => sendFriendRequest(item)}
          >
            <Text style={styles.buttonText}>Add Friend</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // Render received request item
  const renderReceivedRequest = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.userInfo}>
        <Text style={styles.username}>{item.fromUsername}</Text>
        <Text style={styles.email}>{item.fromEmail}</Text>
        <Text style={styles.timestamp}>
          {item.timestamp?.toDate ? item.timestamp.toDate().toLocaleDateString() : 'Just now'}
        </Text>
      </View>
      <View style={styles.buttonGroup}>
        <TouchableOpacity
          style={[styles.actionButton, styles.acceptButton]}
          onPress={() => acceptFriendRequest(item)}
        >
          <Text style={styles.buttonText}>Accept</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.rejectButton]}
          onPress={() => rejectFriendRequest(item)}
        >
          <Text style={styles.buttonText}>Reject</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Render sent request item
  const renderSentRequest = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.userInfo}>
        <Text style={styles.username}>{item.toUsername}</Text>
        <Text style={styles.email}>{item.toEmail}</Text>
        <Text style={styles.timestamp}>
          Sent {item.timestamp?.toDate ? item.timestamp.toDate().toLocaleDateString() : 'just now'}
        </Text>
      </View>
      <TouchableOpacity
        style={[styles.actionButton, styles.cancelButton]}
        onPress={() => cancelFriendRequest(item)}
      >
        <Text style={styles.buttonText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Friends</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'search' && styles.activeTab]}
          onPress={() => setActiveTab('search')}
        >
          <Text style={[styles.tabText, activeTab === 'search' && styles.activeTabText]}>
            Search
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'requests' && styles.activeTab]}
          onPress={() => setActiveTab('requests')}
        >
          <Text style={[styles.tabText, activeTab === 'requests' && styles.activeTabText]}>
            Requests {receivedRequests.length > 0 && `(${receivedRequests.length})`}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'sent' && styles.activeTab]}
          onPress={() => setActiveTab('sent')}
        >
          <Text style={[styles.tabText, activeTab === 'sent' && styles.activeTabText]}>
            Sent {sentRequests.length > 0 && `(${sentRequests.length})`}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Search Tab */}
        {activeTab === 'search' && (
          <>
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search by username..."
                placeholderTextColor="#999"
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={searchUsers}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity 
                style={styles.searchButton} 
                onPress={searchUsers}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.buttonText}>Search</Text>
                )}
              </TouchableOpacity>
            </View>

            <FlatList
              data={searchResults}
              renderItem={renderSearchItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContainer}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>
                    {searchQuery 
                      ? 'No users found. Try a different username.' 
                      : 'Search for friends by their username'}
                  </Text>
                </View>
              }
            />
          </>
        )}

        {/* Received Requests Tab */}
        {activeTab === 'requests' && (
          <FlatList
            data={receivedRequests}
            renderItem={renderReceivedRequest}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyTitle}>No Friend Requests</Text>
                <Text style={styles.emptyText}>
                  When someone sends you a friend request, it will appear here
                </Text>
              </View>
            }
          />
        )}

        {/* Sent Requests Tab */}
        {activeTab === 'sent' && (
          <FlatList
            data={sentRequests}
            renderItem={renderSentRequest}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyTitle}>No Sent Requests</Text>
                <Text style={styles.emptyText}>
                  Friend requests you send will appear here
                </Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e4e8',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e4e8',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: '#007AFF',
  },
  content: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e4e8',
  },
  searchInput: {
    flex: 1,
    height: 44,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 16,
    marginRight: 12,
  },
  searchButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    borderRadius: 10,
    justifyContent: 'center',
    minWidth: 80,
    alignItems: 'center',
  },
  listContainer: {
    padding: 16,
    flexGrow: 1,
  },
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  userInfo: {
    flex: 1,
    marginRight: 12,
  },
  username: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  addButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  respondButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  statusBadge: {
    backgroundColor: '#34C759',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  pendingBadge: {
    backgroundColor: '#FF9500',
  },
  statusText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 70,
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: '#34C759',
  },
  rejectButton: {
    backgroundColor: '#FF3B30',
  },
  cancelButton: {
    backgroundColor: '#FF9500',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#999',
    lineHeight: 24,
  },
});

export default FriendRequestPage;