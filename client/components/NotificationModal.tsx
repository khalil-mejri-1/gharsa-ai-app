import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, FlatList, ActivityIndicator, DeviceEventEmitter, Animated } from 'react-native';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppTheme } from '@/hooks/ThemeContext';
import { io } from 'socket.io-client';
import { useRouter } from 'expo-router';
import { API_URL, SOCKET_URL } from '@/constants/config';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { Platform } from 'react-native';


export default function NotificationModal() {
  const [visible, setVisible] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [toast, setToast] = useState<any | null>(null);
  const socketRef = React.useRef<any>(null);
  const { tokens, mode } = useAppTheme();
  const router = useRouter();

  useEffect(() => {
    // Listen for open event from anywhere in the app
    const listener = DeviceEventEmitter.addListener('openNotifications', () => {
      setVisible(true);
      fetchNotifications();
    });

    const setupSocket = async () => {
      const storedId = await AsyncStorage.getItem('userId');
      if (storedId) {
        setUserId(storedId);
        
        if (socketRef.current) socketRef.current.disconnect();
        
        socketRef.current = io(SOCKET_URL, {
          transports: ['websocket'],
          reconnection: true
        });

        socketRef.current.on('connect', () => {
          console.log('Socket Connected');
          socketRef.current.emit('register', storedId);
        });

        // Initial fetch of notifications on load
        fetchNotifications(storedId);

        socketRef.current.on('newNotification', (notification: any) => {
          setNotifications(prev => [notification, ...prev]);
          setToast(notification);
        });

        socketRef.current.on('postUpdate', (data: any) => {
          // Emit postUpdate globally so feed can catch it
          DeviceEventEmitter.emit('postUpdate', data);
        });

        socketRef.current.on('postDeleted', (data: any) => {
          // Emit postDeleted globally
          DeviceEventEmitter.emit('postDeleted', data);
        });

        socketRef.current.on('newPost', (data: any) => {
          // Emit newPost globally for tab badge
          DeviceEventEmitter.emit('newPost', data);
        });

        socketRef.current.on('newMessage', (data: any) => {
          // Emit newMessage globally so chat screens can catch it
          DeviceEventEmitter.emit('newMessage', data);
        });
      }
    };
    setupSocket();

    return () => {
      listener.remove();
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  const fetchNotifications = async (id?: string) => {
    const targetId = id || userId;
    if (!targetId) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/notifications/${targetId}`);
      const data = await response.json();
      setNotifications(data);
    } catch (error) {
      console.log('Error fetching notifications', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = async () => {
    setVisible(false);
    setToast(null); // Clear any active toast when closing the modal
    if (!userId) return;
    
    // Mark all as read locally immediately
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    
    // Mark as read on server
    try {
      await fetch(`${API_URL}/api/notifications/read/${userId}`, { method: 'POST' });
    } catch (error) {
      console.log('Error marking as read', error);
    }
  };

  const handleDeleteAll = async () => {
    if (!userId) return;
    try {
      const response = await fetch(`${API_URL}/api/notifications/${userId}`, { method: 'DELETE' });
      if (response.ok) {
        setNotifications([]);
      }
    } catch (error) {
      console.log('Error deleting notifications', error);
    }
  };

  const handleNotificationPress = (item: any) => {
    handleClose();
    if (item.postId) {
      router.push(`/(tabs)/communication?highlightPostId=${item.postId}`);
    } else if (item.type === 'follow' || item.type === 'unfollow') {
      router.push(`/profile/${item.sender}`);
    } else if (item.type === 'message') {
      router.push({
        pathname: `/chat/${item.sender}`,
        params: {
          targetUserName: item.senderName,
          targetUserAvatar: item.senderAvatar
        }
      });
    }
  };

  const getRelativeTime = (date: string) => {
    const now = new Date();
    const then = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds}s`;
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes} min`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d`;
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

  const unreadCount = notifications.filter(n => !n.isRead).length;

  function NotificationSkeleton({ tokens, mode }: any) {
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

    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(150,150,150,0.1)' }}>
        <Animated.View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: bg, opacity: pulseAnim, marginRight: 16 }} />
        <View style={{ flex: 1 }}>
          <Animated.View style={{ width: '70%', height: 14, borderRadius: 7, backgroundColor: bg, marginBottom: 8, opacity: pulseAnim }} />
          <Animated.View style={{ width: '40%', height: 12, borderRadius: 6, backgroundColor: bg, opacity: pulseAnim }} />
        </View>
      </View>
    );
  }

  useEffect(() => {
    // Emit unread count so bell icons can show a red dot
    DeviceEventEmitter.emit('unreadCountUpdate', unreadCount);
  }, [unreadCount, notifications]);

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      activeOpacity={0.7}
      onPress={() => handleNotificationPress(item)}
      style={[
        styles.notificationItem, 
        { 
          backgroundColor: !item.isRead 
            ? (mode === 'dark' ? 'rgba(76, 175, 80, 0.15)' : 'rgba(76, 175, 80, 0.1)') 
            : (mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)') 
        },
        !item.isRead && { borderColor: '#4caf50', borderWidth: 1 }
      ]}
    >
      <View style={styles.avatarWrapper}>
        <Image 
          source={{ uri: item.senderAvatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=150&auto=format&fit=crop' }} 
          style={styles.senderAvatar} 
        />
        <LinearGradient 
          colors={item.type === 'like' ? ['#FF5252', '#D32F2F'] : (item.type === 'message' ? ['#00E676', '#00C853'] : ((item.type === 'follow' || item.type === 'unfollow') ? ['#2196F3', '#1976D2'] : ['#66BB6A', '#2E7D32']))} 
          style={styles.typeIconBadge}
        >
          <MaterialIcons name={item.type === 'like' ? 'favorite' : (item.type === 'message' ? 'chat' : ((item.type === 'follow' || item.type === 'unfollow') ? 'person-add' : 'comment'))} size={10} color="white" />
        </LinearGradient>
      </View>
      <View style={styles.textContent}>
        <Text style={[styles.message, { color: tokens.onSurface }]}>
          <Text style={{ fontWeight: 'bold' }}>{item.senderName}</Text> {
            item.type === 'like' ? 'liked your post.' : 
            item.type === 'follow' ? 'started following you.' : 
            item.type === 'unfollow' ? 'stopped following you.' :
            item.type === 'message' ? 'sent you a message.' :
            'commented on your post.'
          }
        </Text>
        <Text style={[styles.time, { color: tokens.onSurfaceVariant }]}>
          {getRelativeTime(item.createdAt)} • {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
      {!item.isRead && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  if (!visible) return null;

  return (
    <View style={{ position: 'absolute', width: 0, height: 0 }}>
      <Modal visible={visible} transparent animationType="slide" onRequestClose={() => setVisible(false)}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#0b1a13' }]}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: tokens.surfaceContainerLowest }]}>
              <View style={styles.header}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <GradientIcon colors={[tokens.primaryContainer, tokens.primary]} name="notifications-active" size={24} library={MaterialIcons} />
                  <Text style={[styles.title, { color: tokens.onSurface }]}>Notifications</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  {notifications.length > 0 && (
                   <TouchableOpacity onPress={handleDeleteAll} style={styles.clearBtn}>
                      <GradientText colors={['#FF5252', '#D32F2F']} style={{ fontWeight: 'bold', fontSize: 12 }}>Clear All</GradientText>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
                    <MaterialIcons name="close" size={24} color={tokens.onSurfaceVariant} />
                  </TouchableOpacity>
                </View>
              </View>

              {loading ? (
                <View style={{ padding: 16 }}>
                  <NotificationSkeleton tokens={tokens} mode={mode} />
                  <NotificationSkeleton tokens={tokens} mode={mode} />
                  <NotificationSkeleton tokens={tokens} mode={mode} />
                  <NotificationSkeleton tokens={tokens} mode={mode} />
                </View>
              ) : notifications.length === 0 ? (
                <View style={styles.emptyState}>
                  <MaterialIcons name="notifications-none" size={64} color={tokens.outline} />
                  <Text style={[styles.emptyText, { color: tokens.onSurfaceVariant }]}>No new notifications</Text>
                </View>
              ) : (
                <FlatList
                  data={notifications}
                  keyExtractor={(item, index) => item._id || item.id || index.toString()}
                  renderItem={renderItem}
                  contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
                  showsVerticalScrollIndicator={false}
                />
              )}
            </View>
          </View>
          </View>
      </Modal>

      {/* Real-time Toast Notification */}
      {toast && (
        <TouchableOpacity 
          activeOpacity={0.9}
          style={[styles.toastContainer, { backgroundColor: tokens.surfaceContainerHigh }]} 
          onPress={() => {
            setToast(null);
            setVisible(true);
            fetchNotifications();
          }}
        >
          <View style={[StyleSheet.absoluteFill, { backgroundColor: tokens.surfaceContainerHigh }]} />
          <View style={styles.toastContent}>
            <LinearGradient 
              colors={toast.type === 'like' ? ['#FF5252', '#D32F2F'] : (toast.type === 'message' ? ['#00E676', '#00C853'] : (toast.type === 'follow' ? ['#2196F3', '#1976D2'] : ['#66BB6A', '#2E7D32']))} 
              style={styles.toastIcon}
            >
              <MaterialIcons name={toast.type === 'like' ? 'favorite' : (toast.type === 'message' ? 'chat' : (toast.type === 'follow' ? 'person-add' : 'comment'))} size={20} color="white" />
            </LinearGradient>
            <View style={styles.toastText}>
              <Text style={[styles.toastTitle, { color: tokens.onSurface }]}>New Notification</Text>
              <Text style={[styles.toastMessage, { color: tokens.onSurfaceVariant }]} numberOfLines={1}>
                <Text style={{ fontWeight: 'bold' }}>{toast.senderName}</Text> {
                  toast.type === 'like' ? 'liked your post' : 
                  toast.type === 'message' ? 'sent you a message' : 
                  toast.type === 'follow' ? 'started following you' : 
                  toast.type === 'unfollow' ? 'stopped following you' :
                  'commented on your post'
                }
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    flex: 1,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150,150,150,0.1)',
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(150,150,150,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(150,150,150,0.1)',
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: 16,
  },
  senderAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  typeIconBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  textContent: {
    flex: 1,
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
  },
  time: {
    fontSize: 12,
    marginTop: 4,
    opacity: 0.6,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4caf50',
    marginLeft: 12,
    shadowColor: '#4caf50',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  toastContainer: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    height: 80,
    borderRadius: 20,
    overflow: 'hidden',
    zIndex: 9999,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  toastContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  toastIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  toastText: {
    flex: 1,
  },
  toastTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 2,
  },
  toastMessage: {
    fontSize: 13,
  }
});
