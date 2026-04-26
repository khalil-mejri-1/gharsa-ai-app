import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, FlatList, ActivityIndicator, SafeAreaView, Platform } from 'react-native';
import { Image } from 'expo-image';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAppTheme } from '@/hooks/ThemeContext';
import { API_URL } from '@/constants/config';
import { LinearGradient } from 'expo-linear-gradient';
import { GradientText } from './GradientUI';

interface User {
  _id: string;
  fullName: string;
  avatar: string;
  role: string;
}

interface ConnectionsModalProps {
  visible: boolean;
  onClose: () => void;
  userId: string;
  type: 'followers' | 'following';
}

export default function ConnectionsModal({ visible, onClose, userId, type }: ConnectionsModalProps) {
  const { tokens, mode } = useAppTheme();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (visible && userId) {
      fetchUsers();
    }
  }, [visible, userId, type]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/users/${type}/${userId}`);
      const data = await response.json();
      if (response.ok) {
        setUsers(data);
      }
    } catch (err) {
      console.error('Error fetching connections:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderUser = ({ item }: { item: User }) => (
    <TouchableOpacity 
      style={styles.userItem}
      onPress={() => {
        onClose();
        router.push(`/profile/${item._id}`);
      }}
    >
      <Image 
        source={{ uri: item.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=150&auto=format&fit=crop' }} 
        style={styles.avatar} 
      />
      <View style={styles.userInfo}>
        <Text style={[styles.userName, { color: tokens.onSurface }]}>{item.fullName}</Text>
        <GradientText colors={tokens.gradients.green} style={styles.userRole}>
          {item.role === 'user' ? 'Farmer' : (item.role ? item.role.charAt(0).toUpperCase() + item.role.slice(1) : 'Farmer')}
        </GradientText>
      </View>
      <Ionicons name="chevron-forward" size={20} color={tokens.outline} />
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <LinearGradient 
        colors={[tokens.appBgGradientStart, tokens.appBgGradientMid, tokens.appBgGradientEnd]}
        style={StyleSheet.absoluteFill}
      >
        <SafeAreaView style={{ flex: 1 }}>
          <View style={styles.container}>
            <View style={styles.header}>
              <Text style={[styles.title, { color: tokens.onSurface }]}>
                {type === 'followers' ? 'Followers' : 'Following'}
              </Text>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <MaterialIcons name="close" size={24} color={tokens.onSurface} />
              </TouchableOpacity>
            </View>

            {loading ? (
              <View style={styles.center}>
                <ActivityIndicator size="large" color={tokens.gradients.green[0]} />
              </View>
            ) : users.length === 0 ? (
              <View style={styles.center}>
                <MaterialIcons name="people-outline" size={64} color={tokens.outline} />
                <Text style={[styles.emptyText, { color: tokens.onSurfaceVariant }]}>
                  No {type} found.
                </Text>
              </View>
            ) : (
              <FlatList
                data={users}
                keyExtractor={(item) => item._id}
                renderItem={renderUser}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>
        </SafeAreaView>
      </LinearGradient>
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
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
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
    padding: 20,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(150,150,150,0.05)',
    borderRadius: 16,
    marginBottom: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  userRole: {
    fontSize: 12,
    marginTop: 2,
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
