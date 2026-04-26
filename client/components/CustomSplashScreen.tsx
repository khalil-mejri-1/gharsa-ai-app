import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '@/hooks/ThemeContext';
import { useLanguage } from '@/hooks/LanguageContext';

const { width } = Dimensions.get('window');

export default function CustomSplashScreen() {
  const { tokens } = useAppTheme();
  const { t } = useLanguage();
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 2500,
        useNativeDriver: false,
      })
    ]).start();
  }, []);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0d631b', '#083d11']}
        style={StyleSheet.absoluteFillObject}
      />
      
      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        <View style={styles.logoWrapper}>
          <Image
            source={require('@/assets/images/logo_gharsa.png')}
            style={styles.logo}
            contentFit="contain"
          />
        </View>
        
        <Text style={styles.title}>GHARSA AI</Text>
        <Text style={styles.tagline}>{t('tagline')}</Text>
        
        <View style={styles.loaderContainer}>
          <View style={[styles.loaderBg, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
            <Animated.View style={[styles.loaderFill, { width: progressWidth }]}>
              <LinearGradient
                colors={['#4CAF50', '#81C784']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFillObject}
              />
            </Animated.View>
          </View>
          <Text style={styles.loadingText}>{t('liveSync')}...</Text>
        </View>
      </Animated.View>
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>POWERED BY ADVANCED AGRO-AI</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    width: '100%',
  },
  logoWrapper: {
    width: 120,
    height: 120,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 60,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 4,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 60,
  },
  loaderContainer: {
    width: width * 0.7,
    alignItems: 'center',
  },
  loaderBg: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 12,
  },
  loaderFill: {
    height: '100%',
    borderRadius: 3,
  },
  loadingText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '800',
    letterSpacing: 2,
  },
  footer: {
    position: 'absolute',
    bottom: 50,
  },
  footerText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.3)',
    fontWeight: '700',
    letterSpacing: 2,
  }
});
