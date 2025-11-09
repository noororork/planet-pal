import React, { useState, useRef, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert
} from 'react-native';
import { db, auth } from '../firebaseConfig';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';

export default function ChatbotScreen({ onBack, currentUser }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hi ${currentUser?.planetName || 'there'}! 🌟 I'm your wellness companion. I can help you with wellness tips, answer questions about your daily tasks, or just chat about health and wellbeing. How can I help you today?`
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef();

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const getRecentTaskData = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return null;

      const tasksRef = collection(db, 'users', userId, 'dailyTasks');
      const q = query(tasksRef, orderBy('date', 'desc'), limit(7));
      const snapshot = await getDocs(q);

      const taskData = [];
      snapshot.forEach(doc => {
        taskData.push(doc.data());
      });

      return taskData;
    } catch (error) {
      console.error('Error fetching task data:', error);
      return null;
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage = inputText.trim();
    setInputText('');
    
    // Add user message to chat
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      // Get recent task data for context
      const taskData = await getRecentTaskData();
      
      // Build context about user's wellness journey
      let contextMessage = '';
      if (taskData && taskData.length > 0) {
        const totalTasks = taskData.length * 4;
        const completedTasks = taskData.reduce((sum, day) => sum + (day.completedCount || 0), 0);
        const completionRate = Math.round((completedTasks / totalTasks) * 100);
        
        contextMessage = `Context: The user has completed ${completionRate}% of their wellness tasks over the last ${taskData.length} days. `;
      }

      // Call Anthropic API
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: `You are a friendly, supportive wellness companion for a wellness app called "Wellness Planet" where users track daily tasks (drinking water, eating meals, exercise, sleep). ${contextMessage}Be encouraging, provide practical wellness advice, and keep responses concise (2-3 paragraphs max). Use emojis occasionally to be friendly. If users ask about their progress, reference their task completion data.`,
          messages: messages
            .filter(m => m.role !== 'assistant' || messages.indexOf(m) > 0) // Skip initial greeting
            .map(m => ({
              role: m.role,
              content: m.content
            }))
            .concat([
              { role: 'user', content: userMessage }
            ])
        })
      });

      // Check if response is ok
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`API returned status ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      
      // Log the response to debug
      console.log('API Response:', JSON.stringify(data, null, 2));

      // Check if response has error
      if (data.error) {
        throw new Error(data.error.message || 'API Error');
      }

      // Check if content exists and is an array
      if (!data.content) {
        console.error('No content in response:', data);
        throw new Error('No content in API response');
      }

      if (!Array.isArray(data.content)) {
        console.error('Content is not an array:', data.content);
        throw new Error('Unexpected content format');
      }

      // Extract assistant's response
      const assistantMessage = data.content
        .filter(item => item && item.type === 'text')
        .map(item => item.text)
        .join('\n');

      if (!assistantMessage || assistantMessage.trim() === '') {
        throw new Error('No text content in response');
      }

      // Add assistant response to chat
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: assistantMessage 
      }]);

    } catch (error) {
      console.error('Error calling chatbot:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      // Show user-friendly error
      let errorMessage = "I'm having trouble connecting right now. ";
      
      if (error.message.includes('Network request failed')) {
        errorMessage += "Please check your internet connection.";
      } else if (error.message.includes('401') || error.message.includes('403')) {
        errorMessage += "There's an authentication issue with the AI service.";
      } else if (error.message.includes('429')) {
        errorMessage += "Too many requests. Please wait a moment and try again.";
      } else {
        errorMessage += `Error: ${error.message}`;
      }
      
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: errorMessage + " 😊" 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const renderMessage = (message, index) => {
    const isUser = message.role === 'user';
    
    return (
      <View 
        key={index} 
        style={[
          styles.messageBubble,
          isUser ? styles.userBubble : styles.assistantBubble
        ]}
      >
        <Text style={[
          styles.messageText,
          isUser ? styles.userText : styles.assistantText
        ]}>
          {message.content}
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Wellness Chat 💬</Text>
      </View>

      {/* Messages */}
      <ScrollView 
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
      >
        {messages.map((message, index) => renderMessage(message, index))}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#A78BFA" />
            <Text style={styles.loadingText}>Thinking...</Text>
          </View>
        )}
      </ScrollView>

      {/* Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Ask me anything about wellness..."
          placeholderTextColor="#8B7BC3"
          multiline
          maxLength={500}
        />
        <TouchableOpacity 
          style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={!inputText.trim() || loading}
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1B4B',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#2D2463',
    borderBottomWidth: 1,
    borderBottomColor: '#4C3A8F',
  },
  backButton: {
    marginBottom: 10,
  },
  backButtonText: {
    color: '#A78BFA',
    fontSize: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 20,
    paddingBottom: 10,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#7C3AED',
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#2D2463',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  userText: {
    color: '#fff',
  },
  assistantText: {
    color: '#E0D7FF',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#2D2463',
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
  },
  loadingText: {
    color: '#A78BFA',
    marginLeft: 8,
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#2D2463',
    borderTopWidth: 1,
    borderTopColor: '#4C3A8F',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: '#1E1B4B',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingTop: 10,
    color: '#fff',
    fontSize: 15,
    maxHeight: 100,
    marginRight: 12,
  },
  sendButton: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#4C3A8F',
    opacity: 0.5,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});