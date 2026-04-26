import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, SafeAreaView } from 'react-native';
import { Image } from 'expo-image';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useRouter } from 'expo-router';
import { useAppTheme } from '@/hooks/ThemeContext';
import { useLanguage } from '@/hooks/LanguageContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import NotificationBell from '@/components/NotificationBell';
import CustomAvatar from '@/components/CustomAvatar';
import { SkeletonCircle, SkeletonRect } from '@/components/Skeleton';

export default function AIScanScreen() {
  const { tokens, mode } = useAppTheme();
  const { language, setLanguage, t } = useLanguage();
  const styles = getStyles(tokens, mode);
  const router = useRouter();
  const navigation = useNavigation();
  const [userName, setUserName] = useState<string | null>(null);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userLoading, setUserLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const name = await AsyncStorage.getItem('userName');
      const avatar = await AsyncStorage.getItem('userAvatar');
      const uid = await AsyncStorage.getItem('userId');
      if (name) setUserName(name);
      if (avatar) setUserAvatar(avatar);
      if (uid) setUserId(uid);
      setUserLoading(false);
    };
    loadUser();

    const unsubscribe = navigation.addListener('focus', () => {
      loadUser();
    });
    return unsubscribe;
  }, [navigation]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle={mode === 'dark' ? 'light-content' : 'dark-content'} />
      <LinearGradient
        colors={[tokens.appBgGradientStart, tokens.appBgGradientMid, tokens.appBgGradientEnd]}
        style={StyleSheet.absoluteFillObject}
      />
      
      <SafeAreaView style={{ flex: 1 }}>
        {/* --- TopAppBar: Standard GHARSA App Bar --- */}
        <View style={styles.topAppBarWrapper}>
          <View style={[styles.topAppBarInner, { backgroundColor: tokens.surfaceContainerLowest }]}>
            <View style={styles.topAppBarContent}>
              <TouchableOpacity 
                style={styles.userInfo} 
                onPress={() => userId && router.push(`/profile/${userId}`)}
              >
                <View style={styles.avatarContainer}>
                  {userLoading ? (
                    <SkeletonCircle size={40} style={styles.avatar} />
                  ) : (
                    <CustomAvatar 
                      uri={userAvatar} 
                      name={userName} 
                      size={40} 
                      style={styles.avatar} 
                    />
                  )}
                </View>
                {userLoading ? (
                  <SkeletonRect width={80} height={20} style={{ marginLeft: 8 }} />
                ) : (
                  <Text style={styles.appTitle}>{userName}</Text>
                )}
              </TouchableOpacity>
              <View style={styles.topBarRight}>
                <View style={styles.langSelector}>
                  <LangBtn active={language === 'EN'} label="EN" onPress={() => setLanguage('EN')} />
                  <LangBtn active={language === 'AR'} label="AR" onPress={() => setLanguage('AR')} />
                  <LangBtn active={language === 'FR'} label="FR" onPress={() => setLanguage('FR')} />
                </View>
                <NotificationBell />
                <TouchableOpacity style={styles.iconBtn} onPress={() => router.replace('/')}>
                  <MaterialIcons name="logout" size={24} color={tokens.tertiary} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.scannerCircle}>
             <Ionicons name="scan-outline" size={80} color={tokens.primary} />
          </View>
          <Text style={styles.mainTitle}>{t('aiPlantDiagnosis')}</Text>
          <Text style={styles.subtitle}>{t('scanSubtitle')}</Text>
          
          <TouchableOpacity style={styles.scanBtn}>
            <LinearGradient
              colors={[tokens.primary, tokens.primaryContainer]}
              style={styles.scanBtnGradient}
            >
              <MaterialIcons name="camera-alt" size={24} color="white" />
              <Text style={styles.scanBtnText}>{t('startScanning')}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
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
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    marginTop: 100,
  },
  scannerCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 2,
    borderColor: tokens.primary,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    backgroundColor: tokens.primary + '10',
  },
  mainTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: tokens.onSurface,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: tokens.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 40,
  },
  scanBtn: {
    width: '100%',
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: tokens.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  scanBtnGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  scanBtnText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '800',
  }
});
