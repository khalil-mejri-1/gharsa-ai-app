import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, SafeAreaView, TextInput, KeyboardAvoidingView, Platform, Keyboard, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useRouter, Stack } from 'expo-router';
import { useAppTheme } from '@/hooks/ThemeContext';
import { useLanguage } from '@/hooks/LanguageContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NotificationBell from '@/components/NotificationBell';
import CustomAvatar from '@/components/CustomAvatar';
import { SkeletonCircle, SkeletonRect } from '@/components/Skeleton';

export default function AIChat() {
  const { mode, tokens } = useAppTheme();
  const { language, setLanguage, t } = useLanguage();
  const styles = getStyles(tokens, mode);
  const router = useRouter();
  const [userName, setUserName] = useState<string | null>(null);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    { id: '1', text: 'Hello! I am Gharsa AI, your agricultural expert. How can I help you today?', sender: 'ai' }
  ]);
  const [isSending, setIsSending] = useState(false);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const scrollViewRef = useRef<any>(null);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardVisible(true);
        // Add StatusBar height + 20px extra breathing room
        const buffer = Platform.OS === 'android' ? ((StatusBar.currentHeight || 35) + 20) : 10;
        setKeyboardHeight(e.endCoordinates.height + buffer);

        // Scroll to bottom when keyboard opens
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
        setKeyboardHeight(0);
      }
    );

    const loadUser = async () => {
      const name = await AsyncStorage.getItem('userName');
      const avatar = await AsyncStorage.getItem('userAvatar');
      const uid = await AsyncStorage.getItem('userId');
      if (name) setUserName(name);
      if (avatar) setUserAvatar(avatar);
      if (uid) setUserId(uid);
      setUserLoading(false);
    };
    loadUser();

    // Fetch and print available Gemini models to the console
    const loadModels = async () => {
      try {
        const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models?key=AIzaSyBR4k6hFxZ--4TOM-lYGMtYUmADmXme7Lw');
        const data = await response.json();
        if (data.models) {
          console.log('\n🌟 --- AVAILABLE GEMINI AI MODELS --- 🌟');
          data.models.forEach((m: any) => {
            if (m.supportedGenerationMethods.includes('generateContent')) {
              console.log(`✅ ${m.name}`);
            }
          });
          console.log('------------------------------------------\n');
        }
      } catch (error) {
        console.log('Error fetching models:', error);
      }
    };
    loadModels();

    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, []);

  // Auto scroll to bottom when messages change
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const handleSend = async () => {
    if (!message.trim() || isSending) return;
    setIsSending(true);
    const userText = message;
    const newMsg = { id: Date.now().toString(), text: userText, sender: 'user' };
    setMessages(prev => [...prev, newMsg]);
    setMessage('');

    try {
      const API_KEY = 'AIzaSyBR4k6hFxZ--4TOM-lYGMtYUmADmXme7Lw';
      // Falling back to the universally supported gemini-1.5-flash model
      const model = 'gemini-2.5-flash';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`;

      const prompt = `You are Gharsa AI, an expert agricultural assistant. IMPORTANT: You must ONLY answer questions related to agriculture, farming, plants, soil, weather, or gardening. If the user asks about ANY other topic, politely refuse to answer and remind them that you are exclusively an agricultural assistant. Answer the user's question concisely and helpfully in the same language they used.\nUser: ${userText}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message || 'API Error');
      }

      let aiText = "Sorry, I couldn't process that request.";
      if (data.candidates && data.candidates[0].content.parts[0].text) {
        aiText = data.candidates[0].content.parts[0].text;
      }

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        text: aiText,
        sender: 'ai'
      }]);
    } catch (error) {
      console.error('Gemini API Error:', error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        text: "Error connecting to AI. Please check your internet connection or API limits.",
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
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      <SafeAreaView style={{ flex: 1 }}>
        {/* --- TopAppBar: Standard GHARSA App Bar --- */}
        <View style={styles.topAppBarWrapper}>
          <View style={[styles.topAppBarInner, { backgroundColor: tokens.surfaceContainerLowest }]}>
            <View style={styles.topAppBarContent}>
              <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 10 }}>
                <MaterialIcons name="arrow-back" size={24} color={tokens.onSurface} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.userInfo} 
                onPress={() => userId && router.push(`/profile/${userId}`)}
              >
                <View style={styles.avatarContainer}>
                  {userLoading ? (
                    <SkeletonCircle size={40} style={styles.avatar} />
                  ) : (
                    <CustomAvatar 
                      uri={userAvatar} 
                      name={userName} 
                      size={40} 
                      style={styles.avatar} 
                    />
                  )}
                </View>
                {userLoading ? (
                  <SkeletonRect width={80} height={20} style={{ marginLeft: 8 }} />
                ) : (
                  <Text style={styles.appTitle}>{userName}</Text>
                )}
              </TouchableOpacity>
              <View style={styles.topBarRight}>
                <View style={styles.langSelector}>
                  <LangBtn active={language === 'EN'} label="EN" onPress={() => setLanguage('EN')} />
                  <LangBtn active={language === 'AR'} label="AR" onPress={() => setLanguage('AR')} />
                  <LangBtn active={language === 'FR'} label="FR" onPress={() => setLanguage('FR')} />
                </View>
                <NotificationBell />
                <TouchableOpacity style={styles.iconBtn} onPress={async () => {
                  await AsyncStorage.removeItem('userName');
                  router.replace('/');
                }}>
                  <MaterialIcons name="logout" size={24} color={tokens.tertiary} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        <View style={{ flex: 1 }}>
          <ScrollView 
            ref={scrollViewRef}
            contentContainerStyle={styles.chatScroll} 
            showsVerticalScrollIndicator={false}
          >
            {/* AI Header Area */}
            <View style={styles.aiHeaderArea}>
              <View style={styles.aiIconContainer}>
                <MaterialIcons name="smart-toy" size={40} color="white" />
              </View>
              <Text style={styles.aiHeaderTitle}>Agronomist AI</Text>
              <Text style={styles.aiHeaderSub}>Powered by GHARSA Intelligence</Text>
            </View>

            {/* Messages */}
            {messages.map((msg, index) => (
              <View key={msg.id || index.toString()} style={[styles.messageRow, msg.sender === 'user' ? styles.messageRowUser : styles.messageRowAI]}>
                {msg.sender === 'ai' && (
                  <View style={styles.msgAvatarAI}>
                    <MaterialIcons name="smart-toy" size={16} color="white" />
                  </View>
                )}
                <View style={[styles.messageBubble, msg.sender === 'user' ? styles.messageBubbleUser : styles.messageBubbleAI]}>
                  <Text style={[styles.messageText, msg.sender === 'user' ? styles.messageTextUser : styles.messageTextAI]}>
                    {msg.text}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Input Area */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Ask the AI expert..."
              placeholderTextColor={tokens.onSurfaceVariant + '80'}
              value={message}
              onChangeText={setMessage}
              multiline
            />
            <TouchableOpacity style={styles.sendButton} onPress={handleSend} disabled={isSending}>
              <LinearGradient
                colors={[tokens.primary, tokens.primaryContainer]}
                style={styles.sendButtonGradient}
              >
                {isSending ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <MaterialIcons name="send" size={20} color="white" />
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Dynamic Exact Spacer */}
          <View style={{
            height: isKeyboardVisible ? keyboardHeight : 85,
            backgroundColor: mode === 'dark' ? tokens.surfaceContainerLow : '#ffffff'
          }} />
        </View>
      </SafeAreaView>
    </View>
  );
}

function LangBtn({ active, label, onPress }: { active: boolean, label: string, onPress: () => void }) {
  const { mode, tokens } = useAppTheme();
  const styles = getStyles(tokens, mode);

  if (active) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        <LinearGradient
          colors={[tokens.primaryContainer, tokens.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.langBtnActive}
        >
          <Text style={styles.langTextActive}>{label}</Text>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <LinearGradient
        colors={[tokens.surfaceContainerLowest, tokens.surface]}
        style={styles.langBtn}
      >
        <Text style={styles.langText}>{label}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const getStyles = (tokens: any, mode: 'light' | 'dark') => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.surface,
  },
  topAppBarWrapper: {
    marginTop: 30,
    marginHorizontal: 16,
    height: 70,
    zIndex: 100,
    borderRadius: 35,
    shadowColor: tokens.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  topAppBarInner: {
    flex: 1,
    borderRadius: 35,
    overflow: 'hidden',
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: tokens.primary + '30',
  },
  topAppBarContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: '100%',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  avatarContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  appTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: tokens.onSurface,
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  langSelector: {
    flexDirection: 'row',
    backgroundColor: tokens.surfaceContainerLow,
    borderRadius: 20,
    padding: 3,
    borderWidth: 1,
    borderColor: tokens.outlineVariant + '30',
  },
  langBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
  },
  langBtnActive: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
  },
  langText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: tokens.onSurface,
    opacity: 0.6,
  },
  langTextActive: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: mode === 'dark' ? tokens.surfaceContainerLow : '#f0f2f1',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: tokens.outlineVariant + '30',
  },
  chatScroll: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 40,
  },
  aiHeaderArea: {
    alignItems: 'center',
    marginVertical: 30,
  },
  aiIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: tokens.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: tokens.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    marginBottom: 16,
  },
  aiHeaderTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: tokens.onSurface,
    letterSpacing: -0.5,
  },
  aiHeaderSub: {
    fontSize: 12,
    fontWeight: '600',
    color: tokens.onSurfaceVariant,
    opacity: 0.8,
    marginTop: 4,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  messageRowUser: {
    justifyContent: 'flex-end',
  },
  messageRowAI: {
    justifyContent: 'flex-start',
  },
  msgAvatarAI: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: tokens.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  messageBubbleUser: {
    backgroundColor: tokens.primary,
    borderBottomRightRadius: 4,
  },
  messageBubbleAI: {
    backgroundColor: mode === 'dark' ? tokens.surfaceContainerHigh : '#ffffff',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: tokens.outlineVariant + '30',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  messageTextUser: {
    color: 'white',
  },
  messageTextAI: {
    color: tokens.onSurface,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: mode === 'dark' ? tokens.surfaceContainerLow : '#ffffff',
    borderTopWidth: 1,
    borderColor: tokens.outlineVariant + '20',
    alignItems: 'flex-end',
  },
  textInput: {
    flex: 1,
    minHeight: 46,
    maxHeight: 120,
    backgroundColor: mode === 'dark' ? tokens.surfaceContainerLowest : '#f4f6f5',
    borderRadius: 23,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
    color: tokens.onSurface,
    fontSize: 15,
    marginRight: 12,
  },
  sendButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    overflow: 'hidden',
  },
  sendButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
