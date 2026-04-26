import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, FlatList, ActivityIndicator, SafeAreaView, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAppTheme } from '@/hooks/ThemeContext';
import { API_URL } from '@/constants/config';
import PostCard from './PostCard';
import PostSkeleton from './PostSkeleton';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UserPostsModalProps {
  visible: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
}

export default function UserPostsModal({ visible, onClose, userId, userName }: UserPostsModalProps) {
  const { tokens, mode } = useAppTheme();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);

  useEffect(() => {
    if (visible && userId) {
      loadUserData();
      fetchUserPosts();
    }
  }, [visible, userId]);

  const loadUserData = async () => {
    const uid = await AsyncStorage.getItem('userId');
    const avatar = await AsyncStorage.getItem('userAvatar');
    setCurrentUserId(uid);
    setUserAvatar(avatar);
  };

  const fetchUserPosts = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/posts`);
      const data = await response.json();
      if (response.ok) {
        // Filter posts by user ID
        const userPosts = data.filter((p: any) => p.user === userId || p.user?._id === userId);
        setPosts(userPosts);
      }
    } catch (err) {
      console.error('Error fetching user posts:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: '#0b1a13' }]}>
        <SafeAreaView style={{ flex: 1 }}>
          <View style={styles.container}>
            <View style={styles.header}>
              <View>
                <Text style={[styles.title, { color: tokens.onSurface }]}>Posts</Text>
                <Text style={[styles.subtitle, { color: tokens.onSurfaceVariant }]}>by {userName}</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <MaterialIcons name="close" size={24} color={tokens.onSurface} />
              </TouchableOpacity>
            </View>

            {loading ? (
              <View style={styles.list}>
                <PostSkeleton tokens={tokens} mode={mode} />
                <PostSkeleton tokens={tokens} mode={mode} />
              </View>
            ) : posts.length === 0 ? (
              <View style={styles.center}>
                <MaterialIcons name="post-add" size={64} color={tokens.outline} />
                <Text style={[styles.emptyText, { color: tokens.onSurfaceVariant }]}>
                  No posts yet.
                </Text>
              </View>
            ) : (
              <FlatList
                data={posts}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => (
                  <PostCard 
                    post={item} 
                    tokens={tokens} 
                    mode={mode} 
                    userId={currentUserId} 
                    userAvatar={userAvatar} 
                    onRefresh={fetchUserPosts}
                  />
                )}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              />
            )}
          </View>
        </SafeAreaView>
      </View>
    </Modal>
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
    paddingHorizontal: 24,
    paddingVertical: 20,
    paddingTop: Platform.OS === 'ios' ? 20 : 40,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150,150,150,0.1)',
    marginBottom: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(150,150,150,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: 16,
    paddingBottom: 100,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    marginTop: 15,
    fontSize: 16,
    textAlign: 'center',
  },
});
