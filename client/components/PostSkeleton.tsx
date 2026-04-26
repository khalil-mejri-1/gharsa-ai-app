import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

export default function PostSkeleton({ tokens, mode }: { tokens: any, mode: 'light' | 'dark' }) {
  const pulseAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.8,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.4,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const styles = StyleSheet.create({
    postCard: {
      backgroundColor: mode === 'dark' ? tokens.surfaceContainerLow + '70' : '#ffffff',
      borderRadius: 28,
      padding: 16,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: tokens.outlineVariant + '20',
    },
    postHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    postAvatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: tokens.outline + '40',
    },
    postInfo: {
      flex: 1,
      marginLeft: 12,
    },
    actionRow: {
      flexDirection: 'row',
      marginTop: 16,
      justifyContent: 'space-around',
    },
  });

  return (
    <View style={styles.postCard}>
      <Animated.View style={{ opacity: pulseAnim }}>
        <View style={styles.postHeader}>
          <View style={styles.postAvatar} />
          <View style={styles.postInfo}>
            <View style={{ width: 120, height: 16, backgroundColor: tokens.outline + '40', borderRadius: 4, marginBottom: 8 }} />
            <View style={{ width: 80, height: 12, backgroundColor: tokens.outline + '20', borderRadius: 4 }} />
          </View>
        </View>
        <View style={{ width: '100%', height: 16, backgroundColor: tokens.outline + '30', borderRadius: 4, marginTop: 16, marginBottom: 8 }} />
        <View style={{ width: '80%', height: 16, backgroundColor: tokens.outline + '30', borderRadius: 4, marginBottom: 16 }} />
        <View style={{ width: '100%', height: 180, backgroundColor: tokens.outline + '20', borderRadius: 16 }} />
        <View style={styles.actionRow}>
           <View style={{ width: 60, height: 24, backgroundColor: tokens.outline + '20', borderRadius: 12 }} />
           <View style={{ width: 60, height: 24, backgroundColor: tokens.outline + '20', borderRadius: 12 }} />
        </View>
      </Animated.View>
    </View>
  );
}
