import React, { useState, useEffect } from 'react';
import { TouchableOpacity, View, Text, StyleSheet, DeviceEventEmitter } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '@/hooks/ThemeContext';
import { GradientIcon } from './GradientUI';

export default function NotificationBell() {
  const { tokens, mode } = useAppTheme();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const listener = DeviceEventEmitter.addListener('unreadCountUpdate', (count: number) => {
      setUnreadCount(count);
    });
    return () => listener.remove();
  }, []);

  const handlePress = () => {
    DeviceEventEmitter.emit('openNotifications');
  };

  return (
    <TouchableOpacity style={styles(tokens, mode).iconBtn} onPress={handlePress}>
      <GradientIcon colors={tokens.gradients.green} name="notifications" size={22} library={MaterialIcons} />
      {unreadCount > 0 && (
        <LinearGradient 
          colors={tokens.gradients.red} 
          start={{ x: 0, y: 0 }} 
          end={{ x: 1, y: 1 }} 
          style={styles(tokens, mode).badge}
        >
          <Text style={styles(tokens, mode).badgeText}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </Text>
        </LinearGradient>
      )}
    </TouchableOpacity>
  );
}

const styles = (tokens: any, mode: string) => StyleSheet.create({
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: mode === 'dark' ? tokens.surfaceContainerLow : '#f0f2f1',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: tokens.outlineVariant + '30',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: tokens.surface,
  },
  badgeText: {
    color: 'white',
    fontSize: 9,
    fontWeight: 'bold',
  },
});
