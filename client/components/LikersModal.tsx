import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ActivityIndicator, Dimensions, ScrollView, SafeAreaView, FlatList, Platform } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/hooks/ThemeContext';
import { API_URL } from '@/constants/config';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';

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

  function GradientIcon({ colors, name, size, library: IconLibrary }: any) {
    if (Platform.OS === 'web') {
      return <IconLibrary name={name} size={size} color={colors[0]} />;
    }
    return (
      <MaskedView
        maskElement={<IconLibrary name={name} size={size} color="white" />}
      >
        <LinearGradient
          colors={colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        >
          <IconLibrary name={name} size={size} style={{ opacity: 0 }} />
        </LinearGradient>
      </MaskedView>
    );
  }

  function GradientText({ colors, children, style }: any) {
    if (Platform.OS === 'web') {
      return <Text style={[style, { color: colors[0] }]}>{children}</Text>;
    }
    return (
      <MaskedView
        maskElement={<Text style={style}>{children}</Text>}
      >
        <LinearGradient
          colors={colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Text style={[style, { opacity: 0 }]}>{children}</Text>
        </LinearGradient>
      </MaskedView>
    );
  }

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
      <TouchableOpacity style={[styles.followBtn, { borderColor: tokens.primary + '40' }]}>
        <GradientText colors={[tokens.primary, tokens.primaryFixed]} style={{ fontWeight: 'bold', fontSize: 12 }}>Profile</GradientText>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: '#0b1a13' }}>
        <SafeAreaView style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <GradientIcon colors={['#FF5252', '#D32F2F']} name="heart" size={24} library={Ionicons} />
              <Text style={[styles.title, { color: tokens.onSurface }]}>Liked by</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialIcons name="close" size={28} color={tokens.onSurface} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={tokens.primary} />
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
