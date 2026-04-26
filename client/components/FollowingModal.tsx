import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ActivityIndicator, Dimensions, ScrollView, TextInput, SafeAreaView, Animated } from 'react-native';
import { Image } from 'expo-image';

import { useRouter } from 'expo-router';
import { MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useAppTheme } from '@/hooks/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '@/constants/config';

const { width, height } = Dimensions.get('window');

import { DeviceEventEmitter } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GradientText } from './GradientUI';

// Removed MOCK_MESSAGES

export default function FollowingModal({ visible, onClose }: { visible: boolean, onClose: () => void }) {
  const { mode, tokens } = useAppTheme();
  const router = useRouter();
  const [following, setFollowing] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [conversations, setConversations] = useState<any[]>([]);
  const slideAnim = React.useRef(new Animated.Value(width)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
      fetchFollowing();
      fetchConversations();
    } else {
      slideAnim.setValue(width);
    }

    const messageListener = DeviceEventEmitter.addListener('newMessage', () => {
      if (visible) {
        fetchConversations();
      }
    });

    return () => {
      messageListener.remove();
    };
  }, [visible]);

  const fetchConversations = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) return;
      const response = await fetch(`${API_URL}/api/messages/conversations/${userId}`);
      const data = await response.json();
      if (response.ok) setConversations(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchFollowing = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      const response = await fetch(`${API_URL}/api/users/following/${userId}`);
      const data = await response.json();
      if (response.ok) setFollowing(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredFollowing = following.filter(u => u.fullName.toLowerCase().includes(search.toLowerCase()));

  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: width,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  return (
    <Modal visible={visible} transparent animationType="none">
      <View style={{ flex: 1, backgroundColor: 'transparent' }}>
        <Animated.View style={{ flex: 1, transform: [{ translateX: slideAnim }] }}>
          <LinearGradient 
            colors={[tokens.appBgGradientStart, tokens.appBgGradientMid, tokens.appBgGradientEnd]}
            style={{ flex: 1 }}
          >
          <SafeAreaView style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: tokens.onSurface }]}>Messages</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <MaterialIcons name="close" size={28} color={tokens.onSurface} />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={[styles.searchBar, { backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)' }]}>
            <Ionicons name="search" size={20} color={tokens.onSurfaceVariant} />
            <TextInput 
              placeholder="Search..." 
              placeholderTextColor={tokens.onSurfaceVariant}
              style={[styles.searchInput, { color: tokens.onSurface }]}
              value={search}
              onChangeText={setSearch}
            />
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
            {/* Following Horizontal Scroll (Notes style) */}
            <View style={styles.followingSection}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.followingList}>
                {loading ? (
                  <ActivityIndicator size="small" color={tokens.primary} style={{ marginLeft: 20 }} />
                ) : (
                  filteredFollowing.map((user) => (
                    <TouchableOpacity 
                      key={user._id} 
                      style={styles.noteItem}
                      onPress={() => {
                        handleClose();
                        router.push({ 
                          pathname: `/chat/${user._id}`, 
                          params: { 
                            targetUserName: user.fullName,
                            targetUserAvatar: user.avatar
                          } 
                        });
                      }}
                    >
                      <View style={styles.noteAvatarWrapper}>
                        <Image source={{ uri: user.avatar }} style={styles.noteAvatar} />
                        <LinearGradient colors={tokens.gradients.green} style={styles.onlineBadge} />
                      </View>
                      <Text style={[styles.noteName, { color: tokens.onSurface }]} numberOfLines={1}>
                        {user.fullName.split(' ')[0]}
                      </Text>
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            </View>

            {/* Messages List */}
            <View style={styles.messagesSection}>
              <View style={styles.msgHeaderRow}>
                <Text style={[styles.sectionTitle, { color: tokens.onSurface }]}>Messages</Text>
                <TouchableOpacity>
                  <GradientText colors={tokens.gradients.green} style={{ fontWeight: '600' }}>Requests</GradientText>
                </TouchableOpacity>
              </View>

              {conversations.map((conv) => (
                <TouchableOpacity 
                  key={conv.userId} 
                  style={styles.msgItem} 
                  activeOpacity={0.7}
                  onPress={() => {
                    handleClose();
                    // Emit event to instantly hide unread count for this interaction
                    DeviceEventEmitter.emit('chatOpened');
                    router.push({ 
                      pathname: `/chat/${conv.userId}`, 
                      params: { 
                        targetUserName: conv.name,
                        targetUserAvatar: conv.avatar
                      } 
                    });
                  }}
                >
                  <Image source={{ uri: conv.avatar }} style={styles.msgAvatar} />
                  <View style={styles.msgContent}>
                    <Text style={[styles.msgName, { color: tokens.onSurface }]} numberOfLines={1}>{conv.name}</Text>
                    <Text 
                      style={[
                        styles.msgSnippet, 
                        { color: conv.unreadCount > 0 ? tokens.onSurface : tokens.onSurfaceVariant, fontWeight: conv.unreadCount > 0 ? 'bold' : 'normal' }
                      ]} 
                      numberOfLines={1}
                    >
                      {conv.lastMsg}
                    </Text>
                  </View>
                  {conv.unreadCount > 0 && (
                    <LinearGradient colors={tokens.gradients.green} style={styles.unreadBadge}>
                      <Text style={styles.unreadText}>{conv.unreadCount}</Text>
                    </LinearGradient>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </SafeAreaView>
        </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 5,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    paddingHorizontal: 15,
    height: 45,
    borderRadius: 22.5,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },
  followingSection: {
    marginBottom: 25,
  },
  followingList: {
    paddingHorizontal: 15,
    gap: 15,
  },
  noteItem: {
    alignItems: 'center',
    width: 75,
  },
  noteAvatarWrapper: {
    position: 'relative',
    marginBottom: 8,
  },
  noteAvatar: {
    width: 65,
    height: 65,
    borderRadius: 32.5,
  },
  noteBubble: {
    position: 'absolute',
    top: -10,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  noteText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#333',
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 0,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: 'white',
  },
  noteName: {
    fontSize: 12,
    textAlign: 'center',
  },
  messagesSection: {
    paddingHorizontal: 20,
  },
  msgHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  msgItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  msgAvatar: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
  },
  msgContent: {
    flex: 1,
    marginLeft: 15,
  },
  msgName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  msgSnippet: {
    fontSize: 14,
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  unreadText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  }
});
