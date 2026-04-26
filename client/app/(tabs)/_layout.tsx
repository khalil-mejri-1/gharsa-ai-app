import { Tabs, useRouter, usePathname } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { View, TouchableOpacity, StyleSheet, DeviceEventEmitter, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { AppThemeProvider, useAppTheme } from '@/hooks/ThemeContext';
import NotificationModal from '@/components/NotificationModal';
import FollowingModal from '@/components/FollowingModal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '@/constants/config';
import { GradientText, GradientIcon } from '@/components/GradientUI';



export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { mode, tokens, toggleTheme } = useAppTheme();
  const router = useRouter();
  const pathname = usePathname();
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [newPostsCount, setNewPostsCount] = useState(0);

  useEffect(() => {
    fetchUnreadCount();
    // Poll for new messages every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);

    const postListener = DeviceEventEmitter.addListener('newPost', () => {
      // Increment new posts count if not on communication page
      // Using includes for more robust matching in Expo Router
      if (!pathname.includes('communication')) {
        setNewPostsCount(prev => prev + 1);
      }
    });

    const msgListener = DeviceEventEmitter.addListener('newMessage', () => {
      // Fetch fresh count to ensure it groups by sender correctly
      fetchUnreadCount();
    });

    const chatOpenedListener = DeviceEventEmitter.addListener('chatOpened', () => {
      // Instantly decrement outer badge when entering a chat
      setUnreadMessages(prev => Math.max(0, prev - 1));
    });



    return () => {
      clearInterval(interval);
      postListener.remove();
      msgListener.remove();
      chatOpenedListener.remove();
    };
  }, [pathname]);

  const fetchUnreadCount = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (userId) {
        const response = await fetch(`${API_URL}/api/messages/unread-count/${userId}`);
        const data = await response.json();
        if (response.ok) setUnreadMessages(data.count);
      }
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  };

  // Hide FAB if we are already on the chatbot page
  const showFab = pathname !== '/chatbot';

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: tokens.gradients.green[0],
          tabBarInactiveTintColor: tokens.outline,
          headerShown: false,
          tabBarHideOnKeyboard: true, // Hide tab bar when keyboard is open
          tabBarButton: HapticTab,
          // Showing the tab bar now that we have a dashboard and real app structure
          tabBarStyle: {
            backgroundColor: tokens.surfaceContainerLowest,
            height: 105,
            borderTopWidth: 0,
            elevation: 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -10 },
            shadowOpacity: mode === 'dark' ? 0.3 : 0.05,
            shadowRadius: 20,
            paddingBottom: 40,
          }
        }}>
        <Tabs.Screen
          name="dashboard"
          options={{
            title: 'HOME',
            tabBarIcon: ({ color, focused }) => 
              focused ? (
                <GradientIcon colors={tokens.gradients.green} name="home" size={28} library={MaterialIcons} />
              ) : (
                <MaterialIcons name="home" size={28} color={color} />
              ),
            tabBarLabel: ({ color, focused }) => 
              focused ? (
                <GradientText colors={tokens.gradients.green} style={{ fontSize: 10, fontWeight: '600' }}>HOME</GradientText>
              ) : (
                <Text style={{ fontSize: 10, color, fontWeight: '600' }}>HOME</Text>
              ),
          }}
        />
        <Tabs.Screen
          name="communication"
          listeners={{
            tabPress: () => {
              setNewPostsCount(0);
            },
          }}
          options={{
            title: 'COMMUNITY',
            tabBarIcon: ({ color, focused }) => 
              focused ? (
                <GradientIcon colors={tokens.gradients.green} name="forum" size={28} library={MaterialIcons} />
              ) : (
                <MaterialIcons name="forum" size={28} color={color} />
              ),
            tabBarLabel: ({ color, focused }) => 
              focused ? (
                <GradientText colors={tokens.gradients.green} style={{ fontSize: 10, fontWeight: '600' }}>COMMUNITY</GradientText>
              ) : (
                <Text style={{ fontSize: 10, color, fontWeight: '600' }}>COMMUNITY</Text>
              ),
            tabBarBadge: newPostsCount > 0 ? newPostsCount : undefined,
            tabBarBadgeStyle: { backgroundColor: tokens.gradients.green[0] },
          }}
        />
        <Tabs.Screen
          name="messages"
          options={{
            title: 'MESSAGES',
            tabBarIcon: ({ color, focused }) => 
              focused ? (
                <GradientIcon colors={tokens.gradients.green} name="chatbubbles" size={24} library={Ionicons} />
              ) : (
                <Ionicons name="chatbubbles" size={24} color={color} />
              ),
            tabBarLabel: ({ color, focused }) => 
              focused ? (
                <GradientText colors={tokens.gradients.green} style={{ fontSize: 10, fontWeight: '600' }}>MESSAGES</GradientText>
              ) : (
                <Text style={{ fontSize: 10, color, fontWeight: '600' }}>MESSAGES</Text>
              ),
            tabBarBadge: unreadMessages > 0 ? unreadMessages : undefined,
            tabBarBadgeStyle: { backgroundColor: tokens.gradients.red[0] },
          }}
        />
        <Tabs.Screen
          name="aiscan"
          options={{
            title: 'AI SCAN',
            tabBarIcon: ({ color, focused }) => 
              focused ? (
                <GradientIcon colors={tokens.gradients.green} name="psychology" size={28} library={MaterialIcons} />
              ) : (
                <MaterialIcons name="psychology" size={28} color={color} />
              ),
            tabBarLabel: ({ color, focused }) => 
              focused ? (
                <GradientText colors={tokens.gradients.green} style={{ fontSize: 10, fontWeight: '600' }}>AI SCAN</GradientText>
              ) : (
                <Text style={{ fontSize: 10, color, fontWeight: '600' }}>AI SCAN</Text>
              ),
          }}
        />
        <Tabs.Screen
          name="explore"
          listeners={{
            tabPress: (e) => {
              e.preventDefault();
              toggleTheme();
            },
          }}
          options={{
            title: 'THEME',
            tabBarIcon: ({ color, focused }) => 
              focused ? (
                <GradientIcon colors={tokens.gradients.green} name={mode === 'dark' ? "wb-sunny" : "brightness-4"} size={28} library={MaterialIcons} />
              ) : (
                <MaterialIcons name={mode === 'dark' ? "wb-sunny" : "brightness-4"} size={28} color={color} />
              ),
            tabBarLabel: ({ color, focused }) => 
              focused ? (
                <GradientText colors={tokens.gradients.green} style={{ fontSize: 10, fontWeight: '600' }}>THEME</GradientText>
              ) : (
                <Text style={{ fontSize: 10, color, fontWeight: '600' }}>THEME</Text>
              ),
          }}
        />
        <Tabs.Screen
          name="index"
          options={{
            href: null, // Hide from the tab bar list
            tabBarStyle: { display: 'none' }, // Hide the bar itself when on this screen
          }}
        />
        <Tabs.Screen
          name="chat"
          options={{
            href: null, // Hide from the tab bar list, but KEEP the tab bar visible
          }}
        />
      </Tabs>

      {showFab && (
        <TouchableOpacity
          style={styles(tokens).fab}
          onPress={() => router.push('/chatbot')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={tokens.gradients.green}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles(tokens).fabGradient}
          >
            <MaterialIcons name="auto-awesome" size={28} color="white" />
          </LinearGradient>
        </TouchableOpacity>
      )}

      <NotificationModal />
    </View>
  );
}

const styles = (tokens: any) => StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 135, // Sit above the taller tab bar with a comfortable gap
    right: 16,
    width: 64,
    height: 64,
    borderRadius: 32,
    elevation: 10,
    shadowColor: tokens.gradients.green[0],
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    zIndex: 1000,
  },
  fabGradient: {
    flex: 1,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
