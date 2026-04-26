import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, SafeAreaView, Linking } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useAppTheme } from '@/hooks/ThemeContext';
import { useLanguage } from '@/hooks/LanguageContext';

export default function LandingPage() {
  const router = useRouter();
  const { tokens, mode } = useAppTheme();
  const { language, setLanguage, t } = useLanguage();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Botanical Green Gradient Background */}
      <LinearGradient
        colors={[tokens.bgGradientStart, tokens.bgGradientMid, tokens.bgGradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      <SafeAreaView style={{ flex: 1 }}>
        {/* --- TopAppBar: Standard GHARSA App Bar --- */}
        <View style={styles.topAppBarWrapper}>
          <View 
            style={[styles.topAppBarInner, { backgroundColor: 'rgba(0,0,0,0.7)' }]}
          >
            <View style={styles.topAppBarContent}>
              <View style={styles.userInfo}>
                <View style={styles.avatarContainer}>
                   <Image source={require('@/assets/images/logo_gharsa.png')} style={styles.avatar} />
                </View>
                <Text style={styles.appTitle}>{t('appTitle')}</Text>
              </View>
              <View style={styles.topBarRight}>
                <View style={styles.langSelector}>
                  <TouchableOpacity onPress={() => setLanguage('EN')} style={[styles.langBtn, language === 'EN' && styles.langBtnActive]}>
                    <Text style={[styles.langText, language === 'EN' && styles.langTextActive]}>EN</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setLanguage('AR')} style={[styles.langBtn, language === 'AR' && styles.langBtnActive]}>
                    <Text style={[styles.langText, language === 'AR' && styles.langTextActive]}>AR</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setLanguage('FR')} style={[styles.langBtn, language === 'FR' && styles.langBtnActive]}>
                    <Text style={[styles.langText, language === 'FR' && styles.langTextActive]}>FR</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity style={styles.iconBtn}>
                  <MaterialIcons name="notifications" size={22} color="#ffffff" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/login')}>
                  <MaterialIcons name="login" size={24} color="#ffffff" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.content}>
          {/* Logo Section */}
          <View style={styles.logoContainer}>
            <Image 
              source={require('@/assets/images/logo_gharsa.png')} 
              style={styles.logo}
              contentFit="contain"
            />
            <Text style={styles.brandName}>Gharsa</Text>
            <Text style={styles.tagline}>{t('tagline')}</Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonGroup}>
            <TouchableOpacity 
              style={styles.getStartedButton} 
              activeOpacity={0.8}
              onPress={() => Linking.openURL('https://gharsa-ai.web.app/register')}
            >
              <LinearGradient
                colors={[tokens.primaryFixed, tokens.primaryContainer]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                <Text style={styles.getStartedText}>{t('getStarted')}</Text>
                <MaterialIcons name="arrow-forward" size={20} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.loginButtonContainer} 
              activeOpacity={0.7}
              onPress={() => router.push('/login')}
            >
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.05)']}
                style={styles.loginButton}
              >
                <Text style={styles.loginText}>{t('login')}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      {/* Decorative botanical element at bottom */}
      <View style={styles.footerDecoration}>
        <MaterialIcons name="eco" size={120} color="rgba(255, 255, 255, 0.05)" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topAppBarWrapper: {
    position: 'absolute',
    top: 45,
    left: 16,
    right: 16,
    height: 70,
    zIndex: 100,
    borderRadius: 35,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  topAppBarInner: {
    flex: 1,
    borderRadius: 35,
    overflow: 'hidden',
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  topAppBarContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: '100%',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  appTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  langSelector: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 3,
  },
  langBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
  },
  langBtnActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
  },
  langText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  langTextActive: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    zIndex: 10,
    marginTop: 60,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 16,
  },
  brandName: {
    fontSize: 42,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 8,
    fontWeight: '500',
  },
  buttonGroup: {
    width: '100%',
    alignItems: 'center',
    gap: 16,
  },
  getStartedButton: {
    width: '100%',
    maxWidth: 300,
    height: 58,
    borderRadius: 29,
    overflow: 'hidden',
    shadowColor: '#10c22e',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  buttonGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  getStartedText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginButtonContainer: {
    width: '100%',
    maxWidth: 300,
    height: 58,
    borderRadius: 29,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  loginButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  footerDecoration: {
    position: 'absolute',
    bottom: -30,
    right: -20,
    opacity: 0.5,
  }
});
