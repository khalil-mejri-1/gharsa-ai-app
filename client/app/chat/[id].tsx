import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, SafeAreaView, TextInput, Platform, Keyboard, ActivityIndicator, Modal, Animated, DeviceEventEmitter, BackHandler, Pressable, TouchableWithoutFeedback } from 'react-native';
import { Image } from 'expo-image';
import { MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import { useAppTheme } from '@/hooks/ThemeContext';
import { useLanguage } from '@/hooks/LanguageContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import { API_URL } from '@/constants/config';
import { uploadToImgBB } from '@/utils/imageUpload';
import VoiceMessage from '@/components/VoiceMessage';
import { useToast } from '@/hooks/ToastContext';
import CustomAvatar from '@/components/CustomAvatar';
import { GradientText, GradientIcon } from '@/components/GradientUI';


export default function DirectMessageScreen() {
  const { id, targetUserName, targetUserAvatar } = useLocalSearchParams();
  const { mode, tokens } = useAppTheme();
  const { language, t } = useLanguage();
  const { showToast, showConfirm } = useToast();
  const styles = getStyles(tokens, mode, isKeyboardVisible, keyboardHeight);
  const router = useRouter();

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  const scrollViewRef = useRef<any>(null);
  const menuAnim = useRef(new Animated.Value(0)).current;
  const keyboardHeight = useRef(new Animated.Value(0)).current;
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
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
    const keyboardDidHideListener = Keyboard.addListener(
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

    loadUserAndMessages();

    // Request permissions
    Audio.requestPermissionsAsync();
    ImagePicker.requestMediaLibraryPermissionsAsync();

    const messageListener = DeviceEventEmitter.addListener('newMessage', (msg: any) => {
      // Check if the message is from/to the current conversation
      if ((msg.senderId === id && msg.receiverId === currentUserId) ||
        (msg.senderId === currentUserId && msg.receiverId === id)) {
        setMessages(prev => {
          // Prevent duplicates
          if (prev.find(m => m._id === msg._id)) return prev;
          return [...prev, msg];
        });

        // If we are active in this chat, mark as read
        if (msg.senderId === id) {
          markAsRead(currentUserId!);
        }
      }
    });

    const backAction = () => {
      DeviceEventEmitter.emit('openMessagesModal');
      router.back();
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => {
      messageListener.remove();
      backHandler.remove();
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, [id, currentUserId]);

  const loadUserAndMessages = async () => {
    try {
      const uid = await AsyncStorage.getItem('userId');
      setCurrentUserId(uid);
      if (uid) {
        fetchMessages(uid);
        markAsRead(uid);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const markAsRead = async (uid: string) => {
    try {
      await fetch(`${API_URL}/api/messages/read/${uid}/${id}`, { method: 'POST' });
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const fetchMessages = async (uid: string) => {
    try {
      const response = await fetch(`${API_URL}/api/messages/${uid}/${id}`);
      const data = await response.json();
      if (response.ok) setMessages(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (type = 'text', mediaUrl?: string, duration?: number) => {
    if ((type === 'text' && !message.trim()) || isSending || !currentUserId) return;

    setIsSending(true);
    const body = {
      senderId: currentUserId,
      receiverId: id,
      text: type === 'text' ? message : `Sent a ${type}`,
      type,
      mediaUrl,
      duration
    };

    try {
      const response = await fetch(`${API_URL}/api/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const newMessage = await response.json();
      if (response.ok) {
        setMessages(prev => [...prev, newMessage]);
        setMessage('');
        Keyboard.dismiss();
        if (showPlusMenu) togglePlusMenu();
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to send message', 'error');
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteAll = () => {
    showConfirm(
      'Clear Chat',
      'Are you sure you want to delete all messages in this conversation?',
      async () => {
        try {
          const response = await fetch(`${API_URL}/api/messages/${currentUserId}/${id}`, {
            method: 'DELETE'
          });
          if (response.ok) setMessages([]);
        } catch (err) {
          console.error(err);
          showToast('Failed to delete messages', 'error');
        }
      }
    );
  };

  const togglePlusMenu = () => {
    const toValue = showPlusMenu ? 0 : 1;
    setShowPlusMenu(!showPlusMenu);
    Animated.spring(menuAnim, {
      toValue,
      useNativeDriver: true,
      tension: 50,
      friction: 7
    }).start();
  };

  const startRecording = async () => {
    if (isRecording) return;
    try {
      if (recording) {
        try { await recording.stopAndUnloadAsync(); } catch (e) { }
        setRecording(null);
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(newRecording);
      setIsRecording(true);
      if (showPlusMenu) togglePlusMenu();
    } catch (err) {
      console.error('Failed to start recording', err);
      setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    if (!recording || !isRecording) return;
    setIsRecording(false);
    const currentRecording = recording;
    setRecording(null); // Clear early to prevent double calls

    try {
      const status = await currentRecording.getStatusAsync();
      if (status.canRecord) {
        await currentRecording.stopAndUnloadAsync();
        const uri = currentRecording.getURI();
        const finalDuration = (status as any).durationMillis || 0;

        if (uri) {
          setIsSending(true);
          const response = await fetch(uri);
          const blob = await response.blob();
          const reader = new FileReader();
          reader.readAsDataURL(blob);
          reader.onloadend = async () => {
            const base64Audio = reader.result as string;
            try {
              const uploadRes = await fetch(`${API_URL}/api/upload-audio`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ audio: base64Audio, userId: currentUserId })
              });
              const uploadData = await uploadRes.json();
              if (uploadRes.ok) {
                setIsSending(false);
                handleSend('audio', uploadData.audioUrl, finalDuration);
              }
            } catch (err) {
              console.error('Upload fetch error', err);
            } finally {
              setIsSending(false);
            }
          };
        }
      }
    } catch (err) {
      console.error('Stop recording error', err);
      setIsSending(false);
    }
  };

  const cancelRecording = async () => {
    if (!recording || !isRecording) return;
    setIsRecording(false);
    const currentRecording = recording;
    setRecording(null);

    try {
      const status = await currentRecording.getStatusAsync();
      if (status.canRecord) {
        await currentRecording.stopAndUnloadAsync();
      }
    } catch (err) {
      console.error('Cancel recording error', err);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setIsSending(true);
      try {
        const imageUrl = await uploadToImgBB(result.assets[0].uri);
        if (imageUrl) {
          // Temporarily set to false so handleSend isn't blocked by its own check
          setIsSending(false);
          handleSend('image', imageUrl);
        } else {
          setIsSending(false);
          showToast('Failed to upload image', 'error');
        }
      } catch (err) {
        setIsSending(false);
        console.error(err);
        showToast('An error occurred during upload', 'error');
      }
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
          <TouchableOpacity
            onPress={() => {
              DeviceEventEmitter.emit('openMessagesModal');
              router.back();
            }}
            style={styles.backBtn}
          >
            <Ionicons name="arrow-back" size={24} color={tokens.onSurface} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.userInfo} onPress={() => router.push(`/profile/${id}`)}>
            <CustomAvatar
              uri={targetUserAvatar as string}
              name={targetUserName as string}
              size={44}
              style={styles.avatar}
            />
            <View>
              <Text style={styles.userName} numberOfLines={1} ellipsizeMode="tail">{targetUserName}</Text>
              <GradientText colors={tokens.gradients.green} style={styles.status}>Online</GradientText>
            </View>
          </TouchableOpacity>

          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.actionIcon} onPress={handleDeleteAll}>
              <GradientIcon colors={tokens.gradients.red} name="delete-sweep" size={26} library={MaterialIcons} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ flex: 1 }}>
          {loading ? (
            <View style={{ flex: 1, justifyContent: 'center' }}>
              <ActivityIndicator size="large" color={tokens.gradients.green[0]} />
            </View>
          ) : (
            <ScrollView
              ref={scrollViewRef}
              contentContainerStyle={styles.messagesList}
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
              keyboardShouldPersistTaps="handled"
            >
              <TouchableWithoutFeedback
                onPress={() => {
                  if (showPlusMenu) togglePlusMenu();
                  Keyboard.dismiss();
                }}
              >
                <View style={{ flex: 1 }}>
                  {messages.map((msg) => {
                    const isMe = msg.senderId === currentUserId;
                    return (
                      <View key={msg._id} style={[styles.msgWrapper, isMe ? { alignItems: 'flex-end' } : { alignItems: 'flex-start' }]}>
                        {isMe ? (
                          <LinearGradient
                            colors={tokens.gradients.green}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={[
                              styles.messageBubble,
                              styles.myMessage,
                              msg.type === 'image' && { paddingHorizontal: 4, paddingVertical: 4 }
                            ]}
                          >
                            {msg.type === 'image' && <Image source={{ uri: msg.mediaUrl }} style={[styles.msgMedia, { marginVertical: 0 }]} />}
                            {msg.type === 'audio' && (
                              <VoiceMessage uri={msg.mediaUrl} isMe={isMe} tokens={tokens} passedDuration={(msg as any).duration} />
                            )}
                            {msg.type === 'text' && (
                              <Text style={[styles.messageText, { color: 'white' }]}>
                                {msg.text}
                              </Text>
                            )}
                          </LinearGradient>
                        ) : (
                          <View style={[
                            styles.messageBubble,
                            styles.otherMessage,
                            msg.type === 'image' && { paddingHorizontal: 4, paddingVertical: 4 }
                          ]}>
                            {msg.type === 'image' && <Image source={{ uri: msg.mediaUrl }} style={[styles.msgMedia, { marginVertical: 0 }]} />}
                            {msg.type === 'audio' && (
                              <VoiceMessage uri={msg.mediaUrl} isMe={isMe} tokens={tokens} passedDuration={(msg as any).duration} />
                            )}
                            {msg.type === 'text' && (
                              <Text style={[styles.messageText, { color: tokens.onSurface }]}>
                                {msg.text}
                              </Text>
                            )}
                          </View>
                        )}
                        <Text style={styles.msgTime}>{formatTime(msg.createdAt)}</Text>
                      </View>
                    );
                  })}
                </View>
              </TouchableWithoutFeedback>
            </ScrollView>
          )}

          {/* Plus Menu Overlay & Content */}
          {showPlusMenu && (
            <>
              <Pressable
                style={[StyleSheet.absoluteFill, { zIndex: 999 }]}
                onPress={togglePlusMenu}
              />
              <Animated.View style={[styles.plusMenu, {
                opacity: menuAnim,
                zIndex: 1000,
                transform: [{ translateY: menuAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }]
              }]}>
                <View style={[styles.plusMenuInner, { backgroundColor: mode === 'dark' ? '#0A2013' : '#E8F5E9', borderColor: mode === 'dark' ? '#113A22' : '#C8E6C9' }]}>
                  <TouchableOpacity style={styles.menuItem} onPress={pickImage}>
                    <LinearGradient colors={['#FF5252', '#FF1744']} style={styles.menuIcon}>
                      <Ionicons name="image" size={20} color="white" />
                    </LinearGradient>
                    <Text style={[styles.menuText, { color: tokens.onSurface }]}>Image</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.menuItem}>
                    <LinearGradient colors={['#7C4DFF', '#651FFF']} style={styles.menuIcon}>
                      <Ionicons name="videocam" size={20} color="white" />
                    </LinearGradient>
                    <Text style={[styles.menuText, { color: tokens.onSurface }]}>Video</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.menuItem} onPress={startRecording}>
                    <LinearGradient colors={['#00E676', '#00C853']} style={styles.menuIcon}>
                      <Ionicons name="mic" size={20} color="white" />
                    </LinearGradient>
                    <Text style={[styles.menuText, { color: tokens.onSurface }]}>Voice</Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            </>
          )}

          {/* Input Area */}
          <Animated.View style={[styles.inputContainer, {
            paddingBottom: keyboardHeight.interpolate({
              inputRange: [0, 1000],
              outputRange: [Platform.OS === 'ios' ? 70 : 60, 1000 + (Platform.OS === 'ios' ? 40 : 30)]
            })
          }]}>
            <View style={[styles.inputBlur, { backgroundColor: mode === 'dark' ? '#0A2013' : '#E8F5E9', borderColor: mode === 'dark' ? '#113A22' : '#C8E6C9' }]}>
              {isRecording ? (
                <TouchableOpacity style={styles.cancelBtn} onPress={cancelRecording}>
                  <GradientIcon colors={tokens.gradients.red} name="close-circle" size={32} library={Ionicons} />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.attachBtn, { borderColor: tokens.gradients.green[0] + '60' }]}
                  onPress={togglePlusMenu}
                >
                  <GradientIcon colors={tokens.gradients.green} name="add" size={22} library={Ionicons} />
                </TouchableOpacity>
              )}

              {isRecording ? (
                <View style={[styles.input, { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }]}>
                  <GradientIcon colors={tokens.gradients.red} name="mic" size={24} library={MaterialIcons} />
                  <GradientText colors={tokens.gradients.red} style={{ fontWeight: 'bold', fontSize: 16, marginLeft: 8 }}>Recording...</GradientText>
                </View>
              ) : (
                <TextInput
                  style={[styles.input, { color: tokens.onSurface }]}
                  placeholder="Type a message..."
                  placeholderTextColor={tokens.onSurfaceVariant}
                  value={message}
                  onChangeText={setMessage}
                  multiline
                  onFocus={() => { if (showPlusMenu) togglePlusMenu(); }}
                />
              )}

              <TouchableOpacity
                style={[styles.sendBtn, { opacity: (message.trim() || isRecording || isSending) ? 1 : 0.5, overflow: 'hidden' }]}
                onPress={() => isRecording ? stopRecording() : handleSend('text')}
                disabled={(!message.trim() && !isRecording) || isSending}
              >
                <LinearGradient
                  colors={tokens.gradients.green}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center' }]}
                >
                  {isSending ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Ionicons name="send" size={20} color="white" />
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const getStyles = (tokens: any, mode: string, isKeyboardVisible: boolean, keyboardHeight: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingTop: Platform.OS === 'android' ? 40 : 15, // Moved down to clear status bar
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150,150,150,0.1)',
  },
  backBtn: {
    padding: 5,
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  userName: {
    fontSize: 17,
    fontWeight: '700',
    color: tokens.onSurface,
  },
  status: {
    fontSize: 12,
    color: '#4caf50',
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionIcon: {
    padding: 8,
  },
  messagesList: {
    padding: 15,
    paddingBottom: 20, // Reduced since input is no longer absolute
  },
  msgWrapper: {
    marginBottom: 15,
    width: '100%',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
  },
  myMessage: {
    borderBottomRightRadius: 4,
  },
  otherMessage: {
    backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.06)',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  msgTime: {
    fontSize: 10,
    color: tokens.onSurfaceVariant,
    marginTop: 4,
    marginHorizontal: 10,
  },
  msgMedia: {
    width: 200,
    height: 200,
    borderRadius: 15,
    marginVertical: 5,
  },
  audioRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputContainer: {
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 70 : 60,
    backgroundColor: mode === 'dark' ? '#0b1a13' : '#ffffff', // Solid background
  },
  inputBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 30,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(150,150,150,0.2)',
  },
  attachBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  cancelBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  input: {
    flex: 1,
    maxHeight: 120,
    paddingHorizontal: 12,
    fontSize: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 5,
  },
  plusMenu: {
    position: 'absolute',
    bottom: 110,
    left: 20,
    zIndex: 1000,
    width: 140,
  },
  plusMenuInner: {
    borderRadius: 20,
    overflow: 'hidden',
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(150,150,150,0.2)',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 5,
  },
  menuIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuText: {
    fontSize: 14,
    fontWeight: '600',
  }
});
