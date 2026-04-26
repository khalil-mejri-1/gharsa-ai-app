import React, { useState, useEffect } from 'react';
import { TouchableOpacity, View, Text, StyleSheet, DeviceEventEmitter } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAppTheme } from '@/hooks/ThemeContext';

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
      <MaterialIcons name="notifications" size={22} color={tokens.primary} />
      {unreadCount > 0 && (
        <View style={styles(tokens, mode).badge}>
          <Text style={styles(tokens, mode).badgeText}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </Text>
        </View>
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
    backgroundColor: '#ff4d4d',
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
