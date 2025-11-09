import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  Linking // Used to open source links, if needed
} from 'react-native';

// --- MOCK FIREBASE SETUP (REQUIRED FOR SINGLE-FILE DEMO) ---
// IMPORTANT: In your real app, replace this with your actual Firebase/data fetching logic.
const MOCK_TASK_DATA = [
  { date: '2024-11-01', completedCount: 3, totalCount: 4 },
  { date: '2024-11-02', completedCount: 4, totalCount: 4 },
  { date: '2024-11-03', completedCount: 2, totalCount: 4 },
  { date: '2024-11-04', completedCount: 4, totalCount: 4 },
  { date: '2024-11-05', completedCount: 3, totalCount: 4 },
];

const getRecentTaskData = async () => {
  await new Promise(resolve => setTimeout(resolve, 300));
  return MOCK_TASK_DATA;
};

const mockCurrentUser = {
  planetName: 'Aether',
  uid: 'mock-user-123',
};
// --- END MOCK SETUP ---


// Gemini API Setup
const apiKey = ""; // Will be provided by the execution environment
const apiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;


export default function ChatbotScreen({ onBack, currentUser = mockCurrentUser }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hi ${currentUser?.planetName || 'there'}! 🌟 I'm your Wellness Companion. I can help you with wellness tips, answer questions about your daily tasks, or just chat about health and wellbeing. How can I help you today?`,
      sources: []
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef();

  // Auto-scroll to bottom when messages update
  const scrollToBottom = () => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };
  
  // Ensures scroll runs after layout/content updates
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = useCallback(async () => {
    if (!inputText.trim() || loading) return;

    const userMessage = inputText.trim();
    setInputText('');
    
    // Add user message to chat immediately
    setMessages(prev => [...prev, { role: 'user', content: userMessage, sources: [] }]);
    setLoading(true);

    try {
      // 1. Get recent task data for context
      const taskData = await getRecentTaskData();
      
      // 2. Build context about user's wellness journey
      let contextMessage = '';
      let completionRate = 0;
      if (taskData && taskData.length > 0) {
        const totalPossibleTasks = taskData.length * 4; 
        const completedTasks = taskData.reduce((sum, day) => sum + (day.completedCount || 0), 0);
        completionRate = Math.round((completedTasks / totalPossibleTasks) * 100);
        
        contextMessage = `User Context: Over the last ${taskData.length} days, the user has completed ${completionRate}% of their total wellness tasks. Recent task completion overview: ${JSON.stringify(taskData.slice(0, 3))}. `;
      }
      
      // 3. Define the LLM's system prompt
      const systemPrompt = `You are a friendly, supportive wellness companion called "Wellness Companion" for a wellness app called "Wellness Planet" where users track daily tasks (drinking water, eating meals, exercise, sleep). 
      ${contextMessage}
      Be encouraging, provide practical wellness advice, and keep responses concise (2-3 paragraphs max). Use emojis occasionally to be friendly. If users ask about their progress, reference their task completion rate of ${completionRate}% to encourage them.`;

      // 4. Construct the chat history for the API call
      const chatHistory = messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      })).concat([
        { role: 'user', parts: [{ text: userMessage }] }
      ]);
      
      // 5. Construct the payload
      const payload = {
        contents: chatHistory,
        tools: [{ "google_search": {} }],
        config: {
            systemInstruction: systemPrompt
        }
      };

      // 6. Call the Gemini API with exponential backoff
      const MAX_RETRIES = 3;
      let response;
      for (let i = 0; i < MAX_RETRIES; i++) {
        try {
          response = await fetch(apiUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
          });

          if (response.ok) break; 
          
          if (i < MAX_RETRIES - 1) {
              await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
          } else {
              throw new Error('API request failed after multiple retries.');
          }
        } catch (e) {
            if (i === MAX_RETRIES - 1) throw e;
        }
      }

      const result = await response.json();
      const candidate = result.candidates?.[0];
      
      if (!candidate || !candidate.content?.parts?.[0]?.text) {
          console.error('API Response Error:', JSON.stringify(result, null, 2));
          throw new Error('Invalid response structure from API');
      }

      // 7. Extract generated text and grounding sources
      const assistantMessage = candidate.content.parts[0].text;
      let sources = [];
      const groundingMetadata = candidate.groundingMetadata;
      if (groundingMetadata && groundingMetadata.groundingAttributions) {
          sources = groundingMetadata.groundingAttributions
              .map(attribution => ({
                  uri: attribution.web?.uri,
                  title: attribution.web?.title,
              }))
              .filter(source => source.uri && source.title);
      }
      
      // 8. Add assistant response (with sources) to chat
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: assistantMessage,
        sources: sources 
      }]);

    } catch (error) {
      console.error('Error calling chatbot:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "I'm sorry, I'm having trouble connecting to the knowledge base right now. Please try again! 😊",
        sources: []
      }]);
    } finally {
      setLoading(false);
    }
  }, [inputText, loading, messages]);
  
  // Note: We cannot use onKeyDown in RN, but TextInput handles submission via onSubmitEditing.

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

        {/* Render Sources */}
        {!isUser && message.sources && message.sources.length > 0 && (
          <View style={styles.sourceContainer}>
            <Text style={styles.sourceHeader}>🔍 Sourced from:</Text>
            {message.sources.slice(0, 3).map((source, idx) => (
              <TouchableOpacity 
                key={idx} 
                onPress={() => Linking.openURL(source.uri)}
                style={styles.sourceLink}
              >
                <Text style={styles.sourceLinkText} numberOfLines={1}>
                  • {source.title || source.uri}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
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
        onContentSizeChange={scrollToBottom} // Ensure auto-scroll on content update
      >
        {messages.map((message, index) => renderMessage(message, index))}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#A78BFA" />
            <Text style={styles.loadingText}>Companion is thinking...</Text>
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
          returnKeyType="send"
          onSubmitEditing={sendMessage} // Allows 'Enter' or 'Send' key to trigger message
        />
        <TouchableOpacity 
          style={[styles.sendButton, (!inputText.trim() || loading) && styles.sendButtonDisabled]}
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
    backgroundColor: '#1E1B4B', // Dark indigo background
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#2D2463', // Slightly lighter header
    borderBottomWidth: 1,
    borderBottomColor: '#4C3A8F',
  },
  backButton: {
    marginBottom: 10,
  },
  backButtonText: {
    color: '#A78BFA', // Violet accent
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
    maxWidth: '85%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#7C3AED', // Vibrant violet for user
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#2D2463', // Darker violet for assistant
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
    color: '#E0D7FF', // Light violet text
  },
  sourceContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(124, 58, 237, 0.5)', // Transparent violet line
  },
  sourceHeader: {
    fontSize: 11,
    color: '#A78BFA',
    marginBottom: 4,
    fontWeight: '600',
  },
  sourceLink: {
    paddingVertical: 2,
  },
  sourceLinkText: {
    fontSize: 10,
    color: '#93C5FD', // Light blue/violet for links
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
    textAlignVertical: 'top', // For Android multiline text
  },
  sendButton: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    justifyContent: 'center',
    height: 40,
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