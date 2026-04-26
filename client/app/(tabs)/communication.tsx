import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, StatusBar, SafeAreaView, KeyboardAvoidingView, Platform, Animated, ActivityIndicator, Keyboard, DeviceEventEmitter, Dimensions } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { MaterialIcons, FontAwesome5, Ionicons, Entypo } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';

import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAppTheme } from '@/hooks/ThemeContext';
import CustomAvatar from '@/components/CustomAvatar';
import { SkeletonCircle, SkeletonRect } from '@/components/Skeleton';
import { GradientText, GradientIcon } from '@/components/GradientUI';
import { useLanguage } from '@/hooks/LanguageContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import NotificationBell from '@/components/NotificationBell';
import LikersModal from '@/components/LikersModal';
import PostCard from '@/components/PostCard';
import PostSkeleton from '@/components/PostSkeleton';
import { API_URL } from '@/constants/config';


const MOCK_POSTS = [
  {
    id: '1',
    user: 'Ahmed Al-Farsi',
    role: 'Small Farm Owner',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&auto=format&fit=crop',
    time: '2h ago',
    tag: 'HELP NEEDED',
    content: 'Salam brothers! I am facing a problem with my tomato crops. The leaves are curling and there are small white flies. Is this whitefly attack? How can I treat it organically? 🍅🐛',
    image: 'https://images.unsplash.com/photo-1592419044706-39796d40f98c?q=80&w=600&auto=format&fit=crop',
    likes: 18,
    comments: [
      {
        id: 'c1',
        user: 'Mariam Green',
        role: 'Agricultural Expert',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=150&auto=format&fit=crop',
        text: 'Yes Ahmed, definitely whiteflies. You can use a mixture of Neem oil and water. It works wonders and is 100% organic! 🌿✨',
        time: '45m ago',
        isExpert: true
      },
      {
        id: 'c2',
        user: 'Youssef Agron',
        role: 'Farmer',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=150&auto=format&fit=crop',
        text: 'I had the same issue last month. Mariam is right, Neem oil saved my harvest.',
        time: '12m ago',
        isExpert: false
      }
    ]
  },
  {
    id: '2',
    user: 'Karim Zen',
    role: 'Agro-Tech Enthusiast',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=150&auto=format&fit=crop',
    time: '5h ago',
    tag: 'SUCCESS STORY',
    content: 'Just reached 90% water efficiency using Gharsa Smart Sensors! The data analytics really help in precision irrigation. 📈💧',
    image: 'https://images.unsplash.com/photo-1586771107445-d3ca888129ff?q=80&w=600&auto=format&fit=crop',
    likes: 56,
    comments: []
  }
];

export default function CommunicationScreen() {
  const { tokens, mode } = useAppTheme();
  const { language, setLanguage, t } = useLanguage();
  const styles = getStyles(tokens, mode);
  const router = useRouter();
  const navigation = useNavigation();

  const [posts, setPosts] = useState([]);
  const [userName, setUserName] = useState<string | null>(null);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [newPostContent, setNewPostContent] = useState('');
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [mediaType, setMediaType] = useState(null); // 'image' or 'video'
  const [isPosting, setIsPosting] = useState(false);
  const { highlightPostId } = useLocalSearchParams();
  const scrollViewRef = useRef<any>(null);
  const postLayouts = useRef<{ [key: string]: { y: number, height: number } }>({});
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [focusedPostId, setFocusedPostId] = useState<string | null>(null);
  const [likersModalVisible, setLikersModalVisible] = useState(false);
  const [selectedPostIdForLikers, setSelectedPostIdForLikers] = useState<string | null>(null);

  const fetchPosts = async () => {
    try {
      const response = await fetch(`${API_URL}/api/posts`);
      const data = await response.json();
      if (response.ok) setPosts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadUser = async () => {
      const name = await AsyncStorage.getItem('userName');
      const id = await AsyncStorage.getItem('userId');
      const avatar = await AsyncStorage.getItem('userAvatar');
      if (name) setUserName(name);
      if (id) setUserId(id);
      if (avatar) setUserAvatar(avatar);
      setUserLoading(false);
    };
    loadUser();
    fetchPosts();

    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardVisible(true);
        setKeyboardHeight(e.endCoordinates.height);
        
        // Root fix: Scroll to the BOTTOM of the focused post when keyboard appears
        if (focusedPostId && postLayouts.current[focusedPostId] !== undefined) {
          const layout = postLayouts.current[focusedPostId];
          const windowHeight = Dimensions.get('window').height;
          // Calculate visible space. Increased offset to 200 to push input higher above keyboard.
          const visibleHeight = windowHeight - e.endCoordinates.height - 200;
          scrollViewRef.current?.scrollTo({
            y: Math.max(0, layout.y + layout.height - visibleHeight),
            animated: true
          });
        }
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
        setKeyboardHeight(0);
      }
    );

    const unsubscribe = navigation.addListener('focus', () => {
      fetchPosts();
    });

    // Real-time Post Updates
    const postUpdateListener = DeviceEventEmitter.addListener('postUpdate', (data: any) => {
      setPosts((currentPosts: any) => {
        return currentPosts.map((p: any) => {
          if (p._id === data.postId) {
            return {
              ...p,
              likes: data.likes || p.likes,
              comments: data.comments || p.comments
            };
          }
          return p;
        });
      });
    });

    // Real-time Post Deletions
    const postDeleteListener = DeviceEventEmitter.addListener('postDeleted', (data: any) => {
      setPosts((currentPosts: any) => {
        return currentPosts.filter((p: any) => p._id !== data.postId);
      });
    });


    // Real-time New Posts
    const newPostListener = DeviceEventEmitter.addListener('newPost', (post: any) => {
      setPosts((currentPosts: any) => {
        // Prevent duplicate if user is the one who posted
        if (currentPosts.find((p: any) => p._id === post._id)) return currentPosts;
        return [post, ...currentPosts];
      });
    });

    return () => {
      unsubscribe();
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
      postUpdateListener.remove();
      postDeleteListener.remove();
      newPostListener.remove();
    };
  }, [navigation]);

  useEffect(() => {
    const scrollToPost = () => {
      if (highlightPostId && postLayouts.current[highlightPostId as string] !== undefined) {
        const layout = postLayouts.current[highlightPostId as string];
        scrollViewRef.current?.scrollTo({
          y: layout.y - 100, // Offset for TopAppBar
          animated: true
        });
      }
    };

    // Try multiple times as layouts might take time
    scrollToPost();
    const t1 = setTimeout(scrollToPost, 300);
    const t2 = setTimeout(scrollToPost, 800);
    const t3 = setTimeout(() => {
      scrollToPost();
      // Clear the param after finishing so the border doesn't persist
      router.setParams({ highlightPostId: undefined });
    }, 1500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [highlightPostId, posts]);

  const pickMedia = async (type: 'image' | 'video') => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: type === 'image' ? ImagePicker.MediaTypeOptions.Images : ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled) {
      setSelectedMedia(result.assets[0].base64);
      setMediaType(type);
    }
  };

  const handleCreatePost = async (tagOverride?: string) => {
    if (!newPostContent.trim() && !selectedMedia) return;
    setIsPosting(true);
    try {
      const response = await fetch(`${API_URL}/api/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          content: newPostContent,
          image: mediaType === 'image' ? `data:image/jpeg;base64,${selectedMedia}` : null,
          video: mediaType === 'video' ? `data:video/mp4;base64,${selectedMedia}` : null,
          tag: tagOverride || 'GENERAL'
        })
      });
      if (response.ok) {
        setNewPostContent('');
        setSelectedMedia(null);
        setMediaType(null);
        fetchPosts();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle={mode === 'dark' ? 'light-content' : 'dark-content'} />
      <LinearGradient
        colors={[tokens.appBgGradientStart, tokens.appBgGradientMid, tokens.appBgGradientEnd]}
        style={StyleSheet.absoluteFillObject}
      />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        style={{ flex: 1 }}
      >
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
                  <Text style={styles.appTitle} numberOfLines={1} ellipsizeMode="tail">{userName}</Text>
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
                  await AsyncStorage.multiRemove(['userName', 'userAvatar', 'userId', 'userRole', 'token']);
                  router.replace('/login');
                }}>
                  <GradientIcon colors={tokens.gradients.red} name="logout" size={24} library={MaterialIcons} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        <ScrollView 
          ref={scrollViewRef} 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* --- Create Post Section --- */}
          <View style={styles.createPostCard}>
            <View style={styles.createPostTop}>
              {userLoading ? (
                <SkeletonCircle size={40} style={styles.myAvatar} />
              ) : (
                <CustomAvatar 
                  uri={userAvatar} 
                  name={userName} 
                  size={40} 
                  style={styles.myAvatar} 
                />
              )}
              <TextInput
                style={styles.fakeInput}
                placeholder={t('shareUpdate')}
                placeholderTextColor={tokens.onSurfaceVariant + '80'}
                value={newPostContent}
                onChangeText={setNewPostContent}
                multiline
              />
            </View>
            <View style={styles.createPostActions}>
              <TouchableOpacity style={styles.postActionItem} onPress={() => pickMedia('image')}>
                <GradientIcon colors={tokens.gradients.green} name="image" size={20} library={MaterialIcons} />
                <Text style={styles.postActionText}>{t('photo')}</Text>
              </TouchableOpacity>
              <View style={styles.actionDivider} />
              <TouchableOpacity style={styles.postActionItem} onPress={() => pickMedia('video')}>
                <GradientIcon colors={tokens.gradients.red} name="videocam" size={20} library={MaterialIcons} />
                <Text style={styles.postActionText}>{t('video')}</Text>
              </TouchableOpacity>
            </View>

            {selectedMedia && (
              <View style={styles.mediaPreview}>
                {/* Caption Input for Media - Now Above */}
                <View style={styles.captionContainer}>
                  <TextInput
                    style={styles.captionInput}
                    placeholder="Add a caption..."
                    placeholderTextColor={tokens.onSurfaceVariant + '70'}
                    value={newPostContent}
                    onChangeText={setNewPostContent}
                    multiline
                  />
                </View>

                <View style={styles.previewImageContainer}>
                  <Image 
                    source={{ uri: `data:${mediaType === 'image' ? 'image/jpeg' : 'video/mp4'};base64,${selectedMedia}` }} 
                    style={styles.previewImage} 
                  />
                  <TouchableOpacity style={styles.removeMedia} onPress={() => setSelectedMedia(null)}>
                    <MaterialIcons name="close" size={20} color="white" />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {(newPostContent.length > 0 || selectedMedia) && (
              <TouchableOpacity 
                style={[styles.postButtonContainer, isPosting && { opacity: 0.5 }]} 
                onPress={() => handleCreatePost()}
                disabled={isPosting}
              >
                <LinearGradient
                  colors={tokens.gradients.green}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.postButton}
                >
                  <Text style={styles.postButtonText}>{isPosting ? 'Posting...' : 'Post Now'}</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>

          {/* --- Feed --- */}
          {loading ? (
            <>
              <PostSkeleton tokens={tokens} mode={mode} />
              <PostSkeleton tokens={tokens} mode={mode} />
              <PostSkeleton tokens={tokens} mode={mode} />
            </>
          ) : (
            posts.map((post: any) => {
              const postId = post._id || post.id || Math.random().toString();
              return (
              <View 
                key={postId} 
                onLayout={(event) => {
                  postLayouts.current[postId] = {
                    y: event.nativeEvent.layout.y,
                    height: event.nativeEvent.layout.height
                  };
                }}
                style={highlightPostId === postId ? { borderWidth: 2, borderColor: tokens.primary, borderRadius: 20, margin: 2 } : {}}
              >
                <PostCard 
                  post={post} 
                  tokens={tokens} 
                  mode={mode} 
                  userId={userId} 
                  userAvatar={userAvatar} 
                  onRefresh={fetchPosts} 
                  isHighlighted={highlightPostId === postId}
                  onShowLikers={() => {
                    setSelectedPostIdForLikers(postId);
                    setLikersModalVisible(true);
                  }}
                  onFocus={() => {
                    setFocusedPostId(postId);
                    // Initial scroll
                    setTimeout(() => {
                      const layout = postLayouts.current[postId];
                      if (layout) {
                        const windowHeight = Dimensions.get('window').height;
                        // Assuming keyboard is around 300px if we don't have its exact height yet
                        const keyboardH = keyboardHeight || 300; 
                        const visibleHeight = windowHeight - keyboardH - 200; // Increased to lift input higher
                        scrollViewRef.current?.scrollTo({
                          y: Math.max(0, layout.y + layout.height - visibleHeight),
                          animated: true
                        });
                      }
                    }, 100);
                  }}
                />
              </View>
            )})
          )}
          
          {/* Spacer for keyboard or bottom tab */}
          <View style={{ height: isKeyboardVisible ? keyboardHeight : 120 }} />
        </ScrollView>
        <LikersModal 
          visible={likersModalVisible} 
          postId={selectedPostIdForLikers} 
          onClose={() => setLikersModalVisible(false)} 
        />
      </SafeAreaView>
      </KeyboardAvoidingView>
      
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
        colors={['transparent', 'transparent']}
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
    marginTop: 30,
    marginHorizontal: 16,
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
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginRight: 10,
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
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
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
  },
  createPostCard: {
    backgroundColor: mode === 'dark' ? tokens.surfaceContainerLow + '90' : '#ffffff',
    borderRadius: 24,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 4,
    borderWidth: 1,
    borderColor: tokens.outlineVariant + '20',
  },
  createPostTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  myAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  fakeInput: {
    flex: 1,
    minHeight: 44,
    backgroundColor: mode === 'dark' ? tokens.surfaceContainerLowest : '#f4f6f5',
    borderRadius: 22,
    marginLeft: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: tokens.onSurface,
    fontSize: 14,
  },
  postButtonContainer: {
    marginTop: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  postButton: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  postButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  createPostActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: tokens.outlineVariant + '15',
  },
  postActionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
  },
  postActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: tokens.onSurfaceVariant,
  },
  mediaPreview: {
    marginTop: 12,
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  removeMedia: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    padding: 4,
    zIndex: 10,
  },
  captionContainer: {
    backgroundColor: mode === 'dark' ? tokens.surfaceContainerLowest : '#f4f6f5',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  captionInput: {
    color: tokens.onSurface,
    fontSize: 14,
    minHeight: 40,
    maxHeight: 100,
  },
  previewImageContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  actionDivider: {
    width: 1,
    height: 20,
    backgroundColor: tokens.outlineVariant + '20',
  },
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
  },
  postInfo: {
    flex: 1,
    marginLeft: 12,
  },
  postUser: {
    fontSize: 16,
    fontWeight: 'bold',
    color: tokens.onSurface,
  },
  postRole: {
    fontSize: 12,
    color: tokens.onSurfaceVariant,
    opacity: 0.7,
  },
  tagBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 9,
    fontWeight: '900',
  },
  postText: {
    fontSize: 16,
    lineHeight: 24,
    color: tokens.onSurface,
    marginBottom: 16,
  },
  postImage: {
    width: '100%',
    height: 220,
    borderRadius: 20,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 13,
    color: tokens.onSurfaceVariant,
    fontWeight: '500',
  },
  actionRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: tokens.outlineVariant + '15',
    paddingVertical: 12,
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: tokens.onSurfaceVariant,
  },
  commentList: {
    gap: 16,
  },
  commentWrapper: {
    flexDirection: 'row',
    gap: 12,
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  commentBubble: {
    flex: 1,
    backgroundColor: mode === 'dark' ? tokens.surfaceContainerLowest + '60' : '#f0f4f2',
    padding: 12,
    borderRadius: 18,
    borderTopLeftRadius: 2,
  },
  expertBubble: {
    backgroundColor: mode === 'dark' ? tokens.primaryContainer + '30' : tokens.primary + '08',
    borderColor: tokens.primary + '30',
    borderWidth: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  commentUser: {
    fontSize: 14,
    fontWeight: '800',
    color: tokens.onSurface,
  },
  expertBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 3,
  },
  expertText: {
    fontSize: 8,
    fontWeight: '900',
    color: 'white',
  },
  commentRole: {
    fontSize: 11,
    color: tokens.primary,
    fontWeight: '600',
    marginBottom: 6,
  },
  commentContent: {
    fontSize: 14,
    lineHeight: 20,
    color: tokens.onSurface,
  },
  commentTime: {
    fontSize: 10,
    color: tokens.onSurfaceVariant,
    opacity: 0.5,
    marginTop: 6,
    textAlign: 'right',
  },
  quickReply: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: tokens.outlineVariant + '10',
  },
  smallAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  replyInput: {
    flex: 1,
    height: 36,
    backgroundColor: mode === 'dark' ? tokens.surfaceContainerLowest + '80' : '#f0f2f1',
    borderRadius: 18,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  replyPlaceholder: {
    fontSize: 12,
    color: tokens.onSurfaceVariant,
    opacity: 0.6,
  },
  fab: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 65,
    height: 65,
    borderRadius: 33,
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  fabGradient: {
    flex: 1,
    borderRadius: 33,
    justifyContent: 'center',
    alignItems: 'center',
  }
});
