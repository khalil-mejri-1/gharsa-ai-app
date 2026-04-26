import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, useWindowDimensions, ScrollView, StatusBar, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, Linking } from 'react-native';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Link, useRouter } from 'expo-router';
import MaskedView from '@react-native-masked-view/masked-view';
import { useAppTheme } from '@/hooks/ThemeContext';
import { useLanguage } from '@/hooks/LanguageContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { API_URL } from '@/constants/config';

// GoogleSignin.configure({
//   webClientId: '1009149258614-7pmjbda89uuh3n7ii4m2r19tit3i3kng.apps.googleusercontent.com',
// });

export default function LoginPage() {
  const { width, height } = useWindowDimensions();
  const { language, setLanguage, t } = useLanguage();
  const router = useRouter();
  const { tokens, mode } = useAppTheme();
  const styles = getStyles(tokens, mode);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter your email and password');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      console.log('Login Response Data:', data);

      if (response.ok) {
        // Success
        if (data.user) {
          await AsyncStorage.setItem('userName', data.user.fullName || 'User');
          await AsyncStorage.setItem('userId', String(data.user.id || ''));
          await AsyncStorage.setItem('userAvatar', data.user.avatar || '');
          router.replace('/(tabs)/dashboard');
        } else {
          setError('Error: User data missing from server response');
        }
      } else {
        setError(data.message || 'Invalid credentials');
      }
    } catch (error: any) {
      console.error('Login Error:', error);
      // If it's a fetch error (network)
      if (error instanceof TypeError && error.message.includes('Network request failed')) {
        setError('Network Error: Could not connect to the server at ' + API_URL);
      } else {
        setError('Login Failed: ' + (error.message || 'Unknown error occurred'));
      }
    } finally {
      setLoading(false);
    }
  };

  /*
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.data?.idToken;

      if (!idToken) throw new Error('Google ID Token missing');

      const response = await fetch(`${API_URL}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      const data = await response.json();

      if (response.ok) {
        await AsyncStorage.setItem('userName', data.user.fullName);
        await AsyncStorage.setItem('userId', data.user.id);
        await AsyncStorage.setItem('userAvatar', data.user.avatar || '');
        router.replace('/(tabs)/dashboard');
      } else {
        setError(data.message || 'Google Sign-In failed');
      }
    } catch (error: any) {
      console.error(error);
      if (error.code !== 'STATUS_CODES.SIGN_IN_CANCELLED') {
        setError('Google Error: ' + (error.message || 'Authentication failed'));
      }
    } finally {
      setLoading(false);
    }
  };
  */

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Background Section */}
      <View style={StyleSheet.absoluteFill}>
        <Image
          source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD3oywW1U6M1eG5HVXphP1tASMKAi25b4HnAOyVpm1H2icVs0d-fBSak14PJteovZXp8ITlsAB6DLavk50bpQNhknycxaquvb80iiXEbYJW4idgiHi7Qfk_MkGkkAgQa_gJt7ixgYm31vK-9c5_fUR0KywtsoLjvhDnj3ZULyNV2JJPe_jOruapU5wXOIDIiGu8KU-_tYX1sLchR3uVxeVhgYc0F2P0gM-i4L9LgjY0crBOPLD-Zw3BV_VklVUrOz80nzfkK9m9Nxc' }}
          style={styles.bgImage}
        />
        <LinearGradient
          colors={[tokens.surface + '33', tokens.surface + 'cc', tokens.surface]}
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFill}
        />
      </View>

      {/* --- TopAppBar: Standard GHARSA App Bar --- */}
      <View style={styles.topAppBarWrapper}>
        <View 
          style={[styles.topAppBarInner, { backgroundColor: tokens.surfaceContainerLowest }]}
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
                <LangBtn active={language === 'EN'} label="EN" onPress={() => setLanguage('EN')} />
                <LangBtn active={language === 'AR'} label="AR" onPress={() => setLanguage('AR')} />
                <LangBtn active={language === 'FR'} label="FR" onPress={() => setLanguage('FR')} />
              </View>
              <TouchableOpacity style={styles.iconBtn}>
                <MaterialIcons name="notifications" size={22} color={tokens.primary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/')}>
                <MaterialIcons name="home" size={24} color={tokens.primary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: 130 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.welcomeHeading}>
            <MaskedView
              style={{ height: 54, width: '100%' }}
              maskElement={<Text style={[styles.welcomeHeading, { marginBottom: 0 }]}>GHARSA.</Text>}
            >
              <LinearGradient
                colors={[tokens.primaryContainer, tokens.primary, tokens.primaryFixed]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ flex: 1 }}
              />
            </MaskedView>
          </Text>
          <Text style={styles.subheading}>
            {t('tagline')}
          </Text>

          {/* Error Message */}
          {error && (
            <View style={styles.errorBox}>
              <MaterialIcons name="error-outline" size={20} color="#ff4d4d" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
        </View>

        {/* Form Section */}
        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('email')}</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                placeholder="agronomist@farm.ai"
                placeholderTextColor={tokens.onSurface + '60'}
                style={styles.input}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
              <MaterialIcons name="alternate-email" size={20} color={tokens.onSurface + '40'} style={styles.inputIcon} />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('password')}</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                placeholder="••••••••"
                placeholderTextColor={tokens.onSurface + '60'}
                secureTextEntry
                style={styles.input}
                value={password}
                onChangeText={setPassword}
              />
              <MaterialIcons name="lock" size={20} color={tokens.onSurface + '40'} style={styles.inputIcon} />
            </View>
          </View>

          <TouchableOpacity style={styles.forgotBtn}>
            <Text style={styles.forgotText}>{t('forgotPassword')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.loginBtnContainer}
            activeOpacity={0.8}
            onPress={handleLogin}
            disabled={loading}
          >
            <LinearGradient
              colors={[tokens.primary, tokens.primaryContainer]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.loginBtn}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <Text style={styles.loginBtnText}>{t('login')}</Text>
                  <MaterialIcons name="arrow-forward" size={20} color={tokens.onPrimaryFixed} />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

{/* 
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>CONNECT WITH GOOGLE</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={styles.socialBtn}
            onPress={handleGoogleSignIn}
            disabled={loading}
          >
            <Image
              source={{ uri: 'https://imagepng.org/wp-content/uploads/2019/08/google-icon-1.png' }}
              style={styles.googleIcon}
            />
            <Text style={styles.socialBtnText}>Google</Text>
          </TouchableOpacity> 
          */}
        </View>

        {/* Footer Section */}
        <View style={styles.footer}>
          <TouchableOpacity onPress={() => Linking.openURL('https://gharsa-ai.web.app/register')} activeOpacity={0.7}>
            <Text style={styles.footerText}>
              {t('noAccount')}
              <Text style={styles.footerLink}> {t('signUp')}</Text>
            </Text>
          </TouchableOpacity>

          <View style={styles.statusRow}>
            <View style={styles.statusItem}>
              <MaterialIcons name="sensors" size={12} color={tokens.onSurface + '60'} />
              <Text style={styles.statusText}>IOT ENABLED</Text>
            </View>
            <View style={styles.statusItem}>
              <MaterialIcons name="psychology" size={12} color={tokens.onSurface + '60'} />
              <Text style={styles.statusText}>AI CORE V4.2</Text>
            </View>
          </View>
          <View style={{ height: 140 }} />
        </View>
      </ScrollView>
    </View>
  );
}

function LangBtn({ active, label, onPress }: { active: boolean, label: string, onPress: () => void }) {
  const { mode, tokens } = useAppTheme();
  const styles = getStyles(tokens, mode);

  if (active) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        <LinearGradient
          colors={[tokens.primaryContainer, tokens.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.langBtnActive}
        >
          <Text style={styles.langTextActive}>{label}</Text>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <LinearGradient
        colors={[tokens.surfaceContainerLowest, tokens.surface]}
        style={styles.langBtn}
      >
        <Text style={styles.langText}>{label}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const getStyles = (tokens: any, mode: 'light' | 'dark') => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.surface,
  },
  bgImage: {
    width: '100%',
    height: '100%',
    opacity: 0.5,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  topAppBarWrapper: {
    position: 'absolute',
    top: 45,
    left: 16,
    right: 16,
    height: 70,
    zIndex: 100,
    borderRadius: 35,
    shadowColor: tokens.primary,
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
    borderWidth: 1.5,
    borderColor: tokens.primary + '30',
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
    color: tokens.onSurface,
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  langSelector: {
    flexDirection: 'row',
    backgroundColor: tokens.surfaceContainerLow,
    borderRadius: 20,
    padding: 3,
    borderWidth: 1,
    borderColor: tokens.outlineVariant + '30',
  },
  langBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
  },
  langBtnActive: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
  },
  langText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: tokens.onSurface,
    opacity: 0.6,
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
    backgroundColor: mode === 'dark' ? tokens.surfaceContainerLow : '#f0f2f1',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: tokens.outlineVariant + '30',
  },
  header: {
    marginBottom: 48,
  },
  welcomeHeading: {
    fontSize: 36,
    lineHeight: 42,
    fontWeight: '700',
    color: tokens.onSurfaceVariant,
    marginBottom: 16,
  },
  subheading: {
    fontSize: 18,
    color: tokens.onSurfaceVariant,
    lineHeight: 28,
  },
  errorBox: {
    backgroundColor: '#fff0f0',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#ff4d4d30',
    gap: 8,
  },
  errorText: {
    color: '#ff4d4d',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  formContainer: {
    gap: 24,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: tokens.primary,
    letterSpacing: 1.5,
    marginLeft: 4,
  },
  inputWrapper: {
    position: 'relative',
    height: 56,
    backgroundColor: tokens.surfaceContainerLow,
    borderRadius: 12,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(13, 99, 27, 0.15)',
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    fontSize: 16,
    color: tokens.onSurface,
  },
  inputIcon: {
    position: 'absolute',
    right: 16,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
  },
  forgotText: {
    fontSize: 14,
    fontWeight: '600',
    color: tokens.primary,
  },
  loginBtnContainer: {
    marginTop: 8,
    shadowColor: '#0d631b',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 8,
  },
  loginBtn: {
    height: 64,
    borderRadius: 32,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  loginBtnText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: tokens.onSurface + '20',
  },
  dividerText: {
    fontSize: 10,
    fontWeight: '600',
    color: tokens.onSurfaceVariant,
    letterSpacing: 1,
  },
  socialBtn: {
    height: 56,
    borderRadius: 32,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  googleIcon: {
    width: 20,
    height: 20,
  },
  socialBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
  footer: {
    marginTop: 'auto',
    alignItems: 'center',
    paddingTop: 40,
  },
  footerText: {
    fontSize: 14,
    color: tokens.onSurfaceVariant,
  },
  footerLink: {
    color: tokens.primary,
    fontWeight: '800',
  },
  statusRow: {
    flexDirection: 'row',
    gap: 24,
    marginTop: 32,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: tokens.onSurfaceVariant,
    letterSpacing: 1,
  }
});
