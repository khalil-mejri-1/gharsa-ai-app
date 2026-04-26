import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Dimensions, ScrollView, TextInput, SafeAreaView, DeviceEventEmitter, Animated } from 'react-native';
import { Image } from 'expo-image';
import { useRouter, Stack, useNavigation } from 'expo-router';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '@/hooks/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '@/constants/config';

const { width } = Dimensions.get('window');

const SkeletonItem = ({ type }: { type: 'circle' | 'list' }) => {
  const { mode } = useAppTheme();
  const pulseAnim = React.useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.8, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const bg = mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)';

  if (type === 'circle') {
    return (
      <View style={{ alignItems: 'center', width: 75, marginRight: 15 }}>
        <Animated.View style={{ width: 65, height: 65, borderRadius: 32.5, backgroundColor: bg, opacity: pulseAnim }} />
        <Animated.View style={{ width: 40, height: 10, borderRadius: 5, backgroundColor: bg, marginTop: 8, opacity: pulseAnim }} />
      </View>
    );
  }

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
      <Animated.View style={{ width: 55, height: 55, borderRadius: 27.5, backgroundColor: bg, opacity: pulseAnim }} />
      <View style={{ flex: 1, marginLeft: 15 }}>
        <Animated.View style={{ width: '60%', height: 14, borderRadius: 7, backgroundColor: bg, marginBottom: 8, opacity: pulseAnim }} />
        <Animated.View style={{ width: '90%', height: 12, borderRadius: 6, backgroundColor: bg, opacity: pulseAnim }} />
      </View>
    </View>
  );
};

export default function MessagesTab() {
  const { mode, tokens } = useAppTheme();
  const router = useRouter();
  const navigation = useNavigation();
  const [following, setFollowing] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [conversations, setConversations] = useState<any[]>([]);

  useEffect(() => {
    fetchFollowing();
    fetchConversations();

    const messageListener = DeviceEventEmitter.addListener('newMessage', () => {
      fetchConversations();
    });

    const focusUnsubscribe = navigation.addListener('focus', () => {
      fetchConversations();
    });

    return () => {
      messageListener.remove();
      focusUnsubscribe();
    };
  }, [navigation]);

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
      // Simulate slight delay for better skeleton visibility demonstration
      setTimeout(() => setLoading(false), 1000);
    }
  };

  const filteredFollowing = following.filter(u => u.fullName.toLowerCase().includes(search.toLowerCase()));

  return (
    <View style={[styles.container, { backgroundColor: mode === 'dark' ? '#0b1a13' : '#F5F5F5' }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: tokens.onSurface }]}>Messages</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
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
                [1, 2, 3, 4, 5].map((i) => <SkeletonItem key={i} type="circle" />)
              ) : (
                filteredFollowing.map((user) => (
                  <TouchableOpacity 
                    key={user._id} 
                    style={styles.noteItem}
                    onPress={() => {
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
            </View>

            {loading ? (
              [1, 2, 3, 4].map((i) => <SkeletonItem key={i} type="list" />)
            ) : (
              conversations.map((conv) => (
                <TouchableOpacity 
                  key={conv.userId} 
                  style={styles.msgItem} 
                  activeOpacity={0.7}
                  onPress={() => {
                    DeviceEventEmitter.emit('chatOpened');
                    // Locally clear the unread count instantly for better UX
                    setConversations(prev => prev.map(c => c.userId === conv.userId ? { ...c, unreadCount: 0 } : c));
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
              ))
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
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
