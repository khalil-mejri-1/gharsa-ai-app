import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ActivityIndicator, Dimensions, ScrollView, SafeAreaView, FlatList, Platform } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/hooks/ThemeContext';
import { API_URL } from '@/constants/config';
import { LinearGradient } from 'expo-linear-gradient';
import { GradientText, GradientIcon } from './GradientUI';

export default function LikersModal({ visible, postId, onClose }: { visible: boolean, postId: string | null, onClose: () => void }) {
  const { tokens, mode } = useAppTheme();
  const router = useRouter();
  const [likers, setLikers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (visible && postId) {
      fetchLikers();
    }
  }, [visible, postId]);

  const fetchLikers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/posts/${postId}/likers`);
      const data = await response.json();
      if (response.ok) setLikers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };


  const renderLiker = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.likerItem}
      onPress={() => {
        onClose();
        router.push(`/profile/${item._id}`);
      }}
    >
      <Image source={{ uri: item.avatar }} style={styles.avatar} />
      <View style={styles.likerInfo}>
        <Text style={[styles.name, { color: tokens.onSurface }]}>{item.fullName}</Text>
        <Text style={[styles.role, { color: tokens.onSurfaceVariant }]}>{item.role}</Text>
      </View>
      <TouchableOpacity style={[styles.followBtn, { borderColor: tokens.gradients.green[0] + '40' }]}>
        <GradientText colors={tokens.gradients.green} style={{ fontWeight: 'bold', fontSize: 12 }}>Profile</GradientText>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <LinearGradient 
        colors={[tokens.appBgGradientStart, tokens.appBgGradientMid, tokens.appBgGradientEnd]}
        style={{ flex: 1 }}
      >
        <SafeAreaView style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <GradientIcon colors={tokens.gradients.red} name="heart" size={24} library={Ionicons} />
              <Text style={[styles.title, { color: tokens.onSurface }]}>Liked by</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialIcons name="close" size={28} color={tokens.onSurface} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={tokens.gradients.green[0]} />
            </View>
          ) : likers.length === 0 ? (
            <View style={styles.center}>
              <Text style={{ color: tokens.onSurfaceVariant }}>No likes yet</Text>
            </View>
          ) : (
            <FlatList
              data={likers}
              keyExtractor={(item) => item._id}
              renderItem={renderLiker}
              contentContainerStyle={{ padding: 20 }}
            />
          )}
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
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeBtn: {
    padding: 5,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  likerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 12,
    borderRadius: 16,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  likerInfo: {
    flex: 1,
    marginLeft: 15,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  role: {
    fontSize: 12,
    marginTop: 2,
  },
  followBtn: {
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  }
});
