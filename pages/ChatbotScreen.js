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
  Linking, // Used to open source links, if needed
  ImageBackground // <-- Added ImageBackground
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
// NOTE: I've updated the model name to the modern preview version for clarity.
const apiKey = ""; 
const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`; 


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
    <ImageBackground
      source={require('../resources/9.png')} // Set the background image
      style={styles.background}
      resizeMode="cover"
    >
      <KeyboardAvoidingView 
        style={styles.contentWrapper} // New wrapper style to apply overlay and flex
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Wellness Chat!! </Text>
        </View>

        {/* Messages */}
        <ScrollView 
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={scrollToBottom}
        >
          {messages.map((message, index) => renderMessage(message, index))}
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={styles.loadingText.color} />
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
            placeholderTextColor={styles.placeholder.color}
            multiline
            maxLength={500}
            returnKeyType="send"
            onSubmitEditing={sendMessage}
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
    </ImageBackground>
  );
}

// --- COLOR PALETTE (Pastel Blue/Green/Yellow) ---
// Deep Teal Blue: #1C3B5E (Base/Dark)
// Soft Blue/Grey: #396C8E (Card BG)
// Teal Blue Accent: #60B3B0 (Primary Button)
// Mint Green: #8EE4AF (Accents/Loading)
// Pale Cyan: #E0F7FA (Light Text)
// Pastel Orange: #FFB347 (User Bubble/Focus)

const styles = StyleSheet.create({
  // Base background style for ImageBackground
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  // Wrapper for KeyboardAvoidingView to apply the dark overlay
  contentWrapper: {
    flex: 1,
    backgroundColor: 'rgba(28, 59, 94, 0.9)', // Deep Teal Blue overlay
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#1C3B5E', // Deep Teal Blue header
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(96, 179, 176, 0.5)', // Transparent Teal border
  },
  backButton: {
    marginBottom: 10,
  },
  backButtonText: {
    color: '#8EE4AF', // Mint Green
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#E0F7FA', // Pale Cyan text
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
    padding: 14, // Slightly larger padding
    borderRadius: 18, // More rounded corners
    marginBottom: 12,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#FFB347', // Pastel Orange for user
    borderBottomRightRadius: 6,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#396C8E', // Soft Blue/Grey for assistant
    borderBottomLeftRadius: 6,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  userText: {
    color: '#1C3B5E', // Dark text on light bubble
    fontWeight: '500',
  },
  assistantText: {
    color: '#E0F7FA', // Pale Cyan text on dark bubble
  },
  sourceContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(142, 228, 175, 0.5)', // Mint Green transparent line
  },
  sourceHeader: {
    fontSize: 11,
    color: '#8EE4AF', // Mint Green
    marginBottom: 4,
    fontWeight: '600',
  },
  sourceLink: {
    paddingVertical: 2,
  },
  sourceLinkText: {
    fontSize: 10,
    color: '#A9D6E5', // Light Blue links
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#396C8E', // Soft Blue/Grey
    padding: 12,
    borderRadius: 18,
    marginBottom: 12,
  },
  loadingText: {
    color: '#8EE4AF', // Mint Green
    marginLeft: 8,
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#1C3B5E', // Deep Teal Blue
    borderTopWidth: 1,
    borderTopColor: 'rgba(96, 179, 176, 0.5)',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: '#1C3B5E', // Match container for seamless look
    borderRadius: 25,
    paddingHorizontal: 18,
    paddingVertical: 12,
    paddingTop: 12,
    color: '#E0F7FA',
    fontSize: 15,
    maxHeight: 100,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#396C8E',
    textAlignVertical: 'top',
  },
  placeholder: {
    color: '#A9D6E5', // Light Blue placeholder text
  },
  sendButton: {
    backgroundColor: '#60B3B0', // Teal Blue Accent
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    justifyContent: 'center',
    height: 48, // Taller button
    width: 65, // Fixed width
  },
  sendButtonDisabled: {
    backgroundColor: 'rgba(57, 108, 142, 0.5)', // Muted Soft Blue/Grey
    opacity: 1,
  },
  sendButtonText: {
    color: '#E0F7FA',
    fontSize: 15,
    fontWeight: '700',
  },
});