import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, SafeAreaView, TextInput, KeyboardAvoidingView, Platform, Keyboard, ActivityIndicator, Animated } from 'react-native';
import { Image } from 'expo-image';
import { MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useRouter, Stack } from 'expo-router';
import { useAppTheme } from '@/hooks/ThemeContext';
import { useLanguage } from '@/hooks/LanguageContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CustomAvatar from '@/components/CustomAvatar';
import { GradientText, GradientIcon } from '@/components/GradientUI';
import { useToast } from '@/hooks/ToastContext';

export default function ChatbotScreen() {
  const { mode, tokens } = useAppTheme();
  const { t } = useLanguage();
  const styles = getStyles(tokens, mode);
  const router = useRouter();
  const { showToast } = useToast();

  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    { id: '1', text: 'Hello! I am your Gharsa AI assistant. How can I help you with your plants today?', sender: 'ai' }
  ]);
  const [isSending, setIsSending] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const scrollViewRef = useRef<any>(null);
  const keyboardHeight = useRef(new Animated.Value(0)).current;
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const loadUserAndHistory = async () => {
      const uid = await AsyncStorage.getItem('userId');
      setUserId(uid);
      if (uid) {
        fetchHistory(uid);
      }
    };
    loadUserAndHistory();

    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardVisible(true);
        Animated.timing(keyboardHeight, {
          toValue: e.endCoordinates.height,
          duration: 250,
          useNativeDriver: false,
        }).start();
        setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
      }
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
        Animated.timing(keyboardHeight, {
          toValue: 0,
          duration: 250,
          useNativeDriver: false,
        }).start();
      }
    );

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const fetchHistory = async (uid: string) => {
    try {
      const { API_URL } = require('@/constants/config');
      const response = await fetch(`${API_URL}/api/aichat/${uid}`);
      const data = await response.json();
      if (response.ok && data.length > 0) {
        setMessages(data.map((m: any) => ({
          id: m._id,
          text: m.text,
          sender: m.sender
        })));
      }
    } catch (err) {
      console.error('Error fetching history:', err);
    }
  };

  const saveMessage = async (text: string, sender: string) => {
    if (!userId) return;
    try {
      const { API_URL } = require('@/constants/config');
      await fetch(`${API_URL}/api/aichat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, text, sender })
      });
    } catch (err) {
      console.error('Error saving message:', err);
    }
  };

  const clearHistory = async () => {
    if (!userId) return;
    try {
      const { API_URL } = require('@/constants/config');
      const response = await fetch(`${API_URL}/api/aichat/${userId}`, { method: 'DELETE' });
      if (response.ok) {
        setMessages([{ id: '1', text: 'Hello! I am your Gharsa AI assistant. How can I help you with your plants today?', sender: 'ai' }]);
        showToast('Chat history cleared', 'success');
      }
    } catch (err) {
      console.error('Error clearing history:', err);
      showToast('Failed to clear history', 'error');
    }
  };

  const handleSend = async () => {
    if (!message.trim() || isSending) return;
    
    const userText = message;
    const newMsg = { id: Date.now().toString(), text: userText, sender: 'user' };
    setMessages(prev => [...prev, newMsg]);
    setMessage('');
    setIsSending(true);
    
    // Save user message to DB
    saveMessage(userText, 'user');

    try {
      const API_KEY = 'AIzaSyBR4k6hFxZ--4TOM-lYGMtYUmADmXme7Lw';
      const model = 'gemini-1.5-flash';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`;

      const prompt = `You are Gharsa AI, an expert agricultural assistant. ONLY answer questions related to agriculture, farming, plants, soil, weather, or gardening. If the user asks about ANY other topic, politely refuse. Answer concisely in the same language as the user.\nUser: ${userText}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      const data = await response.json();
      let aiText = "Sorry, I couldn't process that.";
      if (data.candidates && data.candidates[0].content.parts[0].text) {
        aiText = data.candidates[0].content.parts[0].text;
      }

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        text: aiText,
        sender: 'ai'
      }]);
      
      // Save AI response to DB
      saveMessage(aiText, 'ai');
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        text: "Error connecting to AI. Please try again.",
        sender: 'ai'
      }]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle={mode === 'dark' ? "light-content" : "dark-content"} />
      
      <LinearGradient
        colors={[tokens.appBgGradientStart, tokens.appBgGradientMid, tokens.appBgGradientEnd]}
        style={StyleSheet.absoluteFillObject}
      />

      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={tokens.onSurface} />
          </TouchableOpacity>

          <View style={styles.aiInfo}>
             <LinearGradient colors={tokens.gradients.green} style={styles.aiAvatar}>
                <MaterialIcons name="smart-toy" size={24} color="white" />
             </LinearGradient>
             <View>
               <Text style={styles.aiName}>Gharsa AI Expert</Text>
               <View style={styles.onlineRow}>
                 <View style={styles.onlineDot} />
                 <Text style={styles.onlineText}>Always Online</Text>
               </View>
             </View>
          </View>

          <TouchableOpacity style={styles.clearBtn} onPress={clearHistory}>
             <GradientIcon colors={tokens.gradients.red} name="delete-outline" size={26} library={MaterialIcons} />
          </TouchableOpacity>
        </View>

        <View style={{ flex: 1 }}>
          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={styles.chatScroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* AI Welcome card */}
            <View style={styles.welcomeCard}>
               <LinearGradient colors={tokens.gradients.green} style={styles.welcomeIcon}>
                  <MaterialIcons name="auto-awesome" size={32} color="white" />
               </LinearGradient>
               <Text style={styles.welcomeTitle}>Agricultural Assistant</Text>
               <Text style={styles.welcomeSub}>I can help you diagnose diseases, suggest fertilizers, and guide your farming journey.</Text>
            </View>

            {messages.map((msg) => (
              <View key={msg.id} style={[styles.msgWrapper, msg.sender === 'user' ? styles.msgWrapperUser : styles.msgWrapperAI]}>
                {msg.sender === 'ai' && (
                   <LinearGradient colors={tokens.gradients.green} style={styles.miniAIAvatar}>
                      <MaterialIcons name="smart-toy" size={14} color="white" />
                   </LinearGradient>
                )}
                <View style={[
                  styles.msgBubble,
                  msg.sender === 'user' ? styles.msgBubbleUser : styles.msgBubbleAI,
                  { backgroundColor: msg.sender === 'user' ? tokens.gradients.green[0] : (mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)') }
                ]}>
                  <Text style={[styles.msgText, { color: msg.sender === 'user' ? 'white' : tokens.onSurface }]}>
                    {msg.text}
                  </Text>
                </View>
              </View>
            ))}
            
            {isSending && (
              <View style={styles.typingContainer}>
                <ActivityIndicator size="small" color={tokens.gradients.green[0]} />
                <Text style={styles.typingText}>AI is thinking...</Text>
              </View>
            )}
          </ScrollView>

          {/* Input Area */}
          <Animated.View style={[styles.inputArea, { 
            paddingBottom: keyboardHeight.interpolate({
              inputRange: [0, 1000],
              outputRange: [Platform.OS === 'ios' ? 60 : 50, 1000 + (Platform.OS === 'ios' ? 70 : 60)]
            })
          }]}>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Ask about your crops..."
                placeholderTextColor={tokens.onSurfaceVariant + '80'}
                value={message}
                onChangeText={setMessage}
                multiline
                maxHeight={100}
              />
              <TouchableOpacity 
                style={styles.sendBtn} 
                onPress={handleSend}
                disabled={!message.trim() || isSending}
              >
                <LinearGradient colors={tokens.gradients.green} style={styles.sendBtnInner}>
                   <Ionicons name="send" size={18} color="white" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const getStyles = (tokens: any, mode: string) => StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: Platform.OS === 'android' ? 40 : 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150,150,150,0.1)',
  },
  backBtn: { padding: 5 },
  aiInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 15,
  },
  aiAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  aiName: {
    fontSize: 18,
    fontWeight: '800',
    color: tokens.onSurface,
  },
  onlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
  },
  onlineText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },
  clearBtn: { padding: 5 },
  chatScroll: {
    padding: 20,
    paddingBottom: 40,
  },
  welcomeCard: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
    borderRadius: 25,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: 'rgba(150,150,150,0.1)',
  },
  welcomeIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: tokens.onSurface,
    marginBottom: 8,
  },
  welcomeSub: {
    textAlign: 'center',
    fontSize: 14,
    color: tokens.onSurfaceVariant,
    lineHeight: 20,
  },
  msgWrapper: {
    flexDirection: 'row',
    marginBottom: 20,
    width: '100%',
  },
  msgWrapperUser: { justifyContent: 'flex-end' },
  msgWrapperAI: { justifyContent: 'flex-start', alignItems: 'flex-end' },
  miniAIAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginBottom: 4,
  },
  msgBubble: {
    maxWidth: '85%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  msgBubbleUser: {
    borderBottomRightRadius: 4,
  },
  msgBubbleAI: {
    borderBottomLeftRadius: 4,
  },
  msgText: {
    fontSize: 15,
    lineHeight: 22,
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 32,
    marginTop: -10,
  },
  typingText: {
    fontSize: 12,
    fontStyle: 'italic',
    color: tokens.onSurfaceVariant,
  },
  inputArea: {
    paddingHorizontal: 20,
    paddingTop: 10,
    backgroundColor: mode === 'dark' ? '#0b1a13' : '#ffffff',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.05)' : '#f0f2f1',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(150,150,150,0.1)',
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 15,
    color: tokens.onSurface,
  },
  sendBtn: {
    marginLeft: 10,
  },
  sendBtnInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  }
});
