import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, SafeAreaView } from 'react-native';
import { Image } from 'expo-image';
import { MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { useAppTheme } from '@/hooks/ThemeContext';
import { useLanguage } from '@/hooks/LanguageContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import NotificationBell from '@/components/NotificationBell';
import CustomAvatar from '@/components/CustomAvatar';
import { SkeletonCircle, SkeletonRect } from '@/components/Skeleton';
import { GradientText, GradientIcon } from '@/components/GradientUI';

export default function Dashboard() {
  const { mode, tokens } = useAppTheme();
  const { language, setLanguage, t } = useLanguage();
  const styles = getStyles(tokens, mode);
  const router = useRouter();
  const navigation = useNavigation();
  const [userName, setUserName] = useState<string | null>(null);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [weather, setWeather] = useState({ temp: '--', condition: 'Loading...', humidity: '--' });
  const [forecast, setForecast] = useState<any[]>([]);

  const fetchWeather = async () => {
    try {
      const API_KEY = '2a8d991518a3de024fac667895b5a4e6';
      const city = 'Tunis';

      // جلب التوقعات لـ 5 أيام (المجانية تدعم هذا)
      const response = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${API_KEY}`);
      if (response.ok) {
        const data = await response.json();

        // 1. تحديث الطقس الحالي (أول عنصر في القائمة)
        const current = data.list[0];
        setWeather({
          temp: Math.round(current.main.temp).toString(),
          condition: current.weather[0].description.toUpperCase(),
          humidity: current.main.humidity.toString()
        });

        // 2. تصفية القائمة للحصول على 5 أيام قادمة (نأخذ بيانات الساعة 12:00 من كل يوم)
        const dailyForecast = data.list.filter((item: any) => item.dt_txt.includes("12:00:00")).slice(0, 5);
        setForecast(dailyForecast.map((day: any) => ({
          date: new Date(day.dt * 1000).toLocaleDateString('en-US', { weekday: 'short' }),
          temp: Math.round(day.main.temp),
          icon: day.weather[0].icon
        })));
      } else {
        setWeather({ temp: '--', condition: 'KEY PENDING...', humidity: '--' });
        setForecast([]);
      }
    } catch (error) {
      console.error('Weather fetch error:', error);
    }
  };

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
    fetchWeather();

    // Refresh when screen comes into focus
    const unsubscribe = navigation.addListener('focus', () => {
      loadUser();
      fetchWeather();
    });
    return unsubscribe;
  }, [navigation]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle={mode === 'dark' ? "light-content" : "dark-content"} />
      <LinearGradient
        colors={[tokens.appBgGradientStart, tokens.appBgGradientMid, tokens.appBgGradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
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
                <TouchableOpacity style={styles.iconBtn} onPress={async () => {
                  await AsyncStorage.removeItem('userName');
                  router.replace('/');
                }}>
                  <MaterialIcons name="logout" size={24} color={tokens.tertiary} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* --- Hero: Weather & Status --- */}
          <View style={styles.heroSection}>
            <Image
              source={require('@/assets/images/dashboard_hero.jpg')}
              style={styles.heroImage}
              contentFit="cover"
            />
            <LinearGradient
              colors={['transparent', 'rgba(25, 28, 28, 0.6)']}
              style={styles.heroGradient}
            />
            <View style={styles.heroContent}>
              <View>
                <View style={styles.weatherRow}>
                  <MaterialIcons name="wb-sunny" size={24} color="#ffd700" />
                  <Text style={styles.tempText}>{weather.temp}°C</Text>
                </View>
                <Text style={styles.weatherSubtext}>{weather.condition} • {t('humidity')} {weather.humidity}%</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: 'rgba(255,255,255,0.8)' }]}>
                <Text style={styles.statusText}>{t('status')}: {t('optimal')}</Text>
              </View>
            </View>

            {/* --- 5-Day Forecast Row --- */}
            {forecast.length > 0 && (
              <View style={[styles.forecastContainer, { backgroundColor: 'rgba(0,0,0,0.3)' }]}>
                <View style={styles.forecastRow}>
                  {forecast.map((day, idx) => (
                    <View key={idx} style={styles.forecastItem}>
                      <Text style={styles.forecastDay}>{day.date}</Text>
                      <Image
                        source={{ uri: `https://openweathermap.org/img/wn/${day.icon}.png` }}
                        style={styles.forecastIcon}
                      />
                      <Text style={styles.forecastTemp}>{day.temp}°</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>

          {/* --- Advanced Soil Sensor Hub --- */}
          <View style={styles.sensorHubContainer}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>{t('biosphereCore')}</Text>
              <View style={styles.liveIndicator}>
                <View style={styles.pulseDot} />
                <Text style={styles.liveLabel}>{t('liveSync')}</Text>
              </View>
            </View>

            <View style={styles.glassSensorCard}>
              <LinearGradient
                colors={[mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.8)', mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.4)']}
                style={styles.glassCardInner}
              >
                {/* Hero Metric: Moisture Waveform */}
                <View style={styles.heroMetricRow}>
                  <View style={styles.gaugeContainer}>
                    <View style={styles.gaugeOuter}>
                      <LinearGradient
                        colors={[tokens.gradients.green[0] + '20', tokens.gradients.green[1] + '10']}
                        style={StyleSheet.absoluteFill}
                      />
                      <View style={[styles.gaugeFill, { height: '68%' }]}>
                        <LinearGradient
                          colors={tokens.gradients.green}
                          style={StyleSheet.absoluteFill}
                        />
                        <View style={styles.waveEffect} />
                      </View>
                      <MaterialIcons name="water" size={32} color="white" style={styles.gaugeIcon} />
                    </View>
                    <View style={styles.gaugeMetrics}>
                      <Text style={styles.gaugeValue}>68%</Text>
                      <Text style={styles.gaugeLabel}>{t('moisture')}</Text>
                    </View>
                  </View>

                  <View style={styles.quickGrid}>
                    <DetailPill icon="thermostat" label={t('temperature')} value="23°C" colors={tokens.gradients.orange} />
                    <DetailPill icon="science" label={t('phLevel')} value="6.5" colors={tokens.gradients.blue} />
                    <DetailPill icon="wb-sunny" label={t('illuminance')} value="1.2k" colors={tokens.gradients.orange} />
                  </View>
                </View>

                {/* NPK Satellite Grid */}
                <View style={styles.npkSatelliteGrid}>
                  <NPKSatellite label={t('nitrogen')} value="124" trend="up" colors={tokens.gradients.green} />
                  <NPKSatellite label={t('phosphorus')} value="45" trend="down" colors={tokens.gradients.blue} />
                  <NPKSatellite label={t('potassium')} value="210" trend="stable" colors={tokens.gradients.orange} />
                </View>

                <View style={styles.cardFooter}>
                  <MaterialIcons name="shield" size={16} color={tokens.gradients.green[0]} />
                  <Text style={styles.footerNote}>{t('conditionsStable')}</Text>
                </View>
              </LinearGradient>
            </View>
          </View>

          {/* --- AI Recommendations --- */}
          <LinearGradient
            colors={tokens.gradients.green}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.aiBanner}
          >
            <View style={styles.aiHeader}>
              <MaterialIcons name="psychology" size={32} color="white" />
              <Text style={styles.aiTitle}>{t('agronomistAi')}</Text>
            </View>
            <Text style={styles.aiDescription}>{t('aiRecommendation')}</Text>
            <TouchableOpacity style={styles.aiButton}>
              <Text style={styles.aiButtonText}>{t('takeAction')}</Text>
            </TouchableOpacity>
            <MaterialIcons name="eco" size={100} color="white" style={styles.aiBackgroundIcon} />
          </LinearGradient>

          {/* --- Quick Tools --- */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>{t('smartTools')}</Text>
            <TouchableOpacity><Text style={styles.seeAllText}>{t('viewAll')}</Text></TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.toolsScroll}>
            <ToolCard icon="water" label={t('irrigation')} colors={tokens.gradients.green} />
            <ToolCard icon="pest-control" label={t('pestScan')} colors={tokens.gradients.red} />
            <ToolCard icon="wb-sunny" label={t('lighting')} colors={tokens.gradients.orange} />
            <ToolCard icon="opacity" label={t('fertilize')} colors={tokens.gradients.blue} />
          </ScrollView>

          <View style={{ height: 100 }} />
        </ScrollView>

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

function DetailPill({ icon, label, value, colors }: any) {
  const { tokens, mode } = useAppTheme();
  const styles = getStyles(tokens, mode);
  return (
    <View style={styles.detailPill}>
      <View style={[styles.pillIconBox, { backgroundColor: colors[0] + '15' }]}>
        <GradientIcon colors={colors} name={icon} size={20} library={MaterialIcons} />
      </View>
      <View>
        <Text style={styles.pillLabel}>{label}</Text>
        <Text style={styles.pillValue}>{value}</Text>
      </View>
    </View>
  )
}

function NPKSatellite({ label, value, colors, trend }: any) {
  const { tokens, mode } = useAppTheme();
  const styles = getStyles(tokens, mode);
  return (
    <View style={styles.npkCard}>
      <LinearGradient
        colors={[mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)', 'transparent']}
        style={styles.npkCardInner}
      >
        <View style={[styles.satLabelBox, { borderColor: colors[0], backgroundColor: colors[0] + '10' }]}>
          <GradientText colors={colors} style={styles.satLabel}>{label}</GradientText>
        </View>
        <View style={styles.satContentLarge}>
          <Text style={styles.satValueLarge}>{value}</Text>
          <GradientIcon
            colors={trend === 'up' ? tokens.gradients.green : trend === 'down' ? tokens.gradients.red : tokens.gradients.gray}
            name={trend === 'up' ? 'trending-up' : trend === 'down' ? 'trending-down' : 'trending-flat'}
            size={20}
            library={MaterialIcons}
          />
        </View>
      </LinearGradient>
    </View>
  )
}

function ToolCard({ icon, label, colors }: { icon: any, label: string, colors: string[] }) {
  const { tokens, mode } = useAppTheme();
  const styles = getStyles(tokens, mode);
  return (
    <TouchableOpacity style={styles.toolCardContainer}>
      <LinearGradient colors={[tokens.surfaceContainerLowest, tokens.surface]} style={styles.toolCard}>
        <View style={styles.toolIconCircle}>
          <GradientIcon colors={colors} name={icon} size={24} library={MaterialIcons} />
        </View>
        <Text style={styles.toolLabel}>{label}</Text>
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
    marginTop: 30,
    marginHorizontal: 16,
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
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 20,
  },
  heroSection: {
    margin: 16,
    height: 250,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    elevation: 8,
    shadowColor: tokens.onSurface,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 40,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  heroContent: {
    position: 'absolute',
    bottom: 85,
    left: 16,
    right: 16,
  },
  forecastContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  forecastRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  forecastItem: {
    alignItems: 'center',
  },
  forecastDay: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.9)',
    textTransform: 'uppercase',
  },
  forecastIcon: {
    width: 28,
    height: 28,
  },
  forecastTemp: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    overflow: 'hidden',
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0d631b',
  },
  weatherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tempText: {
    fontSize: 28,
    fontWeight: '700',
    color: 'white',
  },
  weatherSubtext: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    letterSpacing: 1,
    marginTop: 4,
  },
  sensorHubContainer: {
    marginBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: tokens.onSurface,
    letterSpacing: -0.5,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: tokens.gradients.green[0] + '15',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  liveLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: tokens.gradients.green[0],
    letterSpacing: 1,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: tokens.gradients.green[0],
  },
  glassSensorCard: {
    borderRadius: 32,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
  },
  glassCardInner: {
    padding: 24,
  },
  heroMetricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  gaugeContainer: {
    alignItems: 'center',
    gap: 12,
  },
  gaugeOuter: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: tokens.outlineVariant + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gaugeFill: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    width: '100%',
  },
  waveEffect: {
    position: 'absolute',
    top: -10,
    width: '200%',
    height: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 100,
    left: '-50%',
  },
  gaugeIcon: {
    zIndex: 10,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  gaugeMetrics: {
    alignItems: 'center',
    gap: -4,
  },
  gaugeValue: {
    fontSize: 34,
    fontWeight: '900',
    color: tokens.onSurface,
  },
  gaugeLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: tokens.onSurfaceVariant,
    opacity: 0.7,
  },
  quickGrid: {
    gap: 12,
  },
  detailPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
    paddingRight: 16,
    paddingLeft: 6,
    paddingVertical: 6,
    borderRadius: 18,
  },
  pillIconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: tokens.onSurfaceVariant,
    opacity: 0.7,
  },
  pillValue: {
    fontSize: 17,
    fontWeight: '900',
    color: tokens.onSurface,
  },
  npkSatelliteGrid: {
    flexDirection: 'column',
    gap: 10,
    marginBottom: 16,
  },
  npkCard: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.01)',
    borderWidth: 1,
    borderColor: tokens.outlineVariant + '20',
  },
  npkCardInner: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  satLabelBox: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  satLabel: {
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  satContentLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  satValueLarge: {
    fontSize: 24,
    fontWeight: '900',
    color: tokens.onSurface,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: tokens.outlineVariant + '15',
  },
  footerNote: {
    fontSize: 12,
    color: tokens.onSurfaceVariant,
    fontWeight: '500',
    opacity: 0.8,
  },
  aiBanner: {
    marginHorizontal: 16,
    padding: 20,
    borderRadius: 24,
    position: 'relative',
    overflow: 'hidden',
    marginBottom: 24,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  aiTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
  },
  aiDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 20,
    marginBottom: 16,
    paddingRight: 40,
  },
  aiButton: {
    alignSelf: 'flex-start',
    backgroundColor: tokens.surfaceContainerLowest,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  aiButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: tokens.primary,
  },
  aiBackgroundIcon: {
    position: 'absolute',
    bottom: -30,
    right: -20,
    opacity: 0.1,
    transform: [{ rotate: '15deg' }],
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: tokens.primary,
  },
  toolsScroll: {
    paddingRight: 32,
    gap: 16,
  },
  toolCardContainer: {
    width: 140,
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: tokens.onSurface,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  toolCard: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    gap: 12,
  },
  toolIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: tokens.surfaceContainerLowest,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toolLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: tokens.onSurface,
  },
  fab: {
    position: 'absolute',
    bottom: 120,
    right: 16,
    width: 64,
    height: 64,
    borderRadius: 32,
    elevation: 10,
    shadowColor: tokens.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  fabGradient: {
    flex: 1,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatAiButton: {
    marginHorizontal: 16,
    marginTop: 24,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: tokens.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  chatAiGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 12,
  },
  chatAiText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});
