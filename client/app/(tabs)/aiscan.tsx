import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, SafeAreaView } from 'react-native';
import { Image } from 'expo-image';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { ActivityIndicator, Alert } from 'react-native';
import { ML_URL } from '@/constants/config';

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
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isPredicting, setIsPredicting] = useState(false);
  const [prediction, setPrediction] = useState<{ disease: string, confidence: number } | null>(null);

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
  
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('error'), t('permissionDenied'));
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setSelectedImage(uri);
      setPrediction(null);
      uploadImage(uri);
    }
  };

  const uploadImage = async (imageUri: string) => {
    setIsPredicting(true);
    const formData = new FormData();
    
    // @ts-ignore
    formData.append('image', {
      uri: imageUri,
      name: 'photo.jpg',
      type: 'image/jpeg',
    });

    try {
      const response = await fetch(`${ML_URL}/predict`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const data = await response.json();
      
      if (data.disease) {
        setPrediction({
          disease: data.disease,
          confidence: data.confidence
        });
      } else {
        Alert.alert(t('error'), data.error || 'Prediction failed');
      }
    } catch (error) {
      console.error("Prediction Error:", error);
      Alert.alert(t('error'), t('serverError'));
    } finally {
      setIsPredicting(false);
    }
  };

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
             {selectedImage ? (
               <Image source={{ uri: selectedImage }} style={styles.previewImage} />
             ) : (
               <Ionicons name="scan-outline" size={80} color={tokens.gradients.green[0]} />
             )}
             {isPredicting && (
               <View style={styles.loadingOverlay}>
                 <ActivityIndicator size="large" color="white" />
               </View>
             )}
          </View>

          {prediction ? (
            <View style={styles.resultContainer}>
              <Text style={styles.resultLabel}>{t('detectedDisease')}:</Text>
              <Text style={styles.resultValue}>{prediction.disease}</Text>
              <Text style={styles.confidenceText}>{t('confidence')}: {(prediction.confidence * 100).toFixed(2)}%</Text>
            </View>
          ) : (
            <>
              <Text style={styles.mainTitle}>{t('aiPlantDiagnosis')}</Text>
              <Text style={styles.subtitle}>{t('scanSubtitle')}</Text>
            </>
          )}
          
          <TouchableOpacity 
            style={styles.scanBtn} 
            onPress={pickImage}
            disabled={isPredicting}
          >
            <LinearGradient
              colors={tokens.gradients.green}
              style={styles.scanBtnGradient}
            >
              <MaterialIcons name="camera-alt" size={24} color="white" />
              <Text style={styles.scanBtnText}>
                {prediction ? t('scanAgain') : t('startScanning')}
              </Text>
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
          colors={tokens.gradients.green}
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
    shadowColor: tokens.gradients.green[0],
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
    borderColor: tokens.gradients.green[0] + '40',
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
    borderColor: tokens.gradients.green[0],
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    backgroundColor: tokens.gradients.green[0] + '15',
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
    shadowColor: tokens.gradients.green[0],
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
  },
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 90,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 90,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultContainer: {
    alignItems: 'center',
    marginBottom: 30,
    backgroundColor: tokens.surfaceContainerLow,
    padding: 20,
    borderRadius: 24,
    width: '100%',
    borderWidth: 1,
    borderColor: tokens.gradients.green[0] + '30',
  },
  resultLabel: {
    fontSize: 14,
    color: tokens.onSurfaceVariant,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  resultValue: {
    fontSize: 24,
    fontWeight: '900',
    color: tokens.gradients.green[0],
    textAlign: 'center',
    marginBottom: 8,
  },
  confidenceText: {
    fontSize: 12,
    color: tokens.onSurfaceVariant,
    opacity: 0.8,
    fontWeight: '600',
  }
});
