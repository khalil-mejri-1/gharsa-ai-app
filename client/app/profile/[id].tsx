import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, SafeAreaView, ActivityIndicator, TextInput, Modal, Platform, Keyboard } from 'react-native';
import { Image } from 'expo-image';
import { MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { useAppTheme } from '@/hooks/ThemeContext';
import { useLanguage } from '@/hooks/LanguageContext';
import { useToast } from '@/hooks/ToastContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FollowingModal from '@/components/FollowingModal';
import { API_URL } from '@/constants/config';
import * as ImagePicker from 'expo-image-picker';
import { uploadToImgBB } from '@/utils/imageUpload';
import ConnectionsModal from '@/components/ConnectionsModal';
import UserPostsModal from '@/components/UserPostsModal';
import CustomAvatar from '@/components/CustomAvatar';
import { GradientText, GradientIcon } from '@/components/GradientUI';


export default function ProfileScreen() {
  const { id } = useLocalSearchParams();
  const { mode, tokens } = useAppTheme();
  const { language, t } = useLanguage();
  const { showToast } = useToast();
  const router = useRouter();
  const styles = getStyles(tokens, mode);

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Edit states
  const [editName, setEditName] = useState('');
  const [editPlants, setEditPlants] = useState<string[]>([]);
  const [plantInput, setPlantInput] = useState('');
  const [followingModalVisible, setFollowingModalVisible] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [postCount, setPostCount] = useState(0);

  const [connModalVisible, setConnModalVisible] = useState(false);
  const [connType, setConnType] = useState<'followers' | 'following'>('followers');
  const [postsModalVisible, setPostsModalVisible] = useState(false);

  useEffect(() => {
    fetchProfile();
    loadCurrentUser();
    fetchUserPosts();
  }, [id]);

  const fetchUserPosts = async () => {
    try {
      const response = await fetch(`${API_URL}/api/posts`);
      const data = await response.json();
      if (response.ok) {
        const count = data.filter((p: any) => p.user === id || p.user?._id === id).length;
        setPostCount(count);
      }
    } catch (err) {
      console.error('Error fetching user posts:', err);
    }
  };

  const loadCurrentUser = async () => {
    const uid = await AsyncStorage.getItem('userId');
    setCurrentUserId(uid);
  };

  const fetchProfile = async () => {
    try {
      const response = await fetch(`${API_URL}/api/users/${id}`);
      const data = await response.json();
      if (response.ok) {
        setUser(data);
        setEditName(data.fullName);
        setEditPlants(data.plants || []);

        // Check if current user is following
        const myId = await AsyncStorage.getItem('userId');
        if (data.followers?.includes(myId)) {
          setIsFollowing(true);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!currentUserId || isFollowLoading) return;
    setIsFollowLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/users/follow/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentUserId })
      });
      const data = await response.json();
      if (response.ok) {
        setIsFollowing(data.following);
        fetchProfile(); // Refresh stats
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsFollowLoading(false);
    }
  };

  const pickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      setSelectedAvatar(result.assets[0].uri);
    }
  };

  const handleUpdateProfile = async () => {
    setIsUploading(true);
    try {
      let avatarUrl = user?.avatar;

      // If a new avatar was picked, upload it first
      if (selectedAvatar) {
        const uploadedUrl = await uploadToImgBB(selectedAvatar);
        if (uploadedUrl) {
          avatarUrl = uploadedUrl;
        } else {
          showToast("Failed to upload image. Try again.", "error");
          setIsUploading(false);
          return;
        }
      }

      const response = await fetch(`${API_URL}/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: editName,
          plants: editPlants,
          avatar: avatarUrl
        })
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUser(updatedUser);

        // Also update local storage if it's my profile
        if (isOwnProfile) {
          await AsyncStorage.setItem('userName', updatedUser.fullName);
          await AsyncStorage.setItem('userAvatar', updatedUser.avatar);
        }

        setIsEditing(false);
        setSelectedAvatar(null);
        Keyboard.dismiss();
        showToast("Profile updated successfully", "success");
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to update profile", "error");
    } finally {
      setIsUploading(false);
    }
  };

  const addPlant = () => {
    if (plantInput.trim() && !editPlants.includes(plantInput.trim())) {
      setEditPlants([...editPlants, plantInput.trim()]);
      setPlantInput('');
    }
  };

  const isOwnProfile = currentUserId === id;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" transparent />

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={tokens.gradients.green[0]} />
          <Text style={{ marginTop: 20, color: tokens.onSurfaceVariant, fontSize: 16 }}>Loading Profile...</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header Background */}
          <View style={styles.headerCover}>
            <Image
              source={require('../../assets/images/farm_cover_photo.jpg')}
              style={styles.coverImage}
              contentFit="cover"
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.8)']}
              style={StyleSheet.absoluteFillObject}
            />

            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <View style={[styles.topAppBarInner, { backgroundColor: 'rgba(0,0,0,0.7)' }]}>
                <Ionicons name="arrow-back" size={24} color="white" />
              </View>
            </TouchableOpacity>
          </View>

          {/* Profile Content */}
          <View style={styles.profileCard}>
            <View style={styles.avatarWrapper}>
              <CustomAvatar
                uri={user?.avatar}
                name={user?.fullName}
                size={120}
                style={[styles.avatar, { borderColor: tokens.background }]}
              />
              <View style={styles.roleBadge}>
                <MaterialIcons name={user?.role === 'agronomist' ? 'verified' : 'nature'} size={14} color="white" />
                <Text style={styles.roleText}>{user?.role?.toUpperCase()}</Text>
              </View>
            </View>

            <View style={styles.mainInfo}>
              <Text style={styles.name}>{user?.fullName}</Text>
              <Text style={styles.email}>{user?.email}</Text>
            </View>

            {/* Stats */}
            <View style={styles.statsRow}>
              <TouchableOpacity
                style={styles.statItem}
                onPress={() => {
                  setConnType('followers');
                  setConnModalVisible(true);
                }}
              >
                <Text style={styles.statVal}>{user?.followers?.length || 0}</Text>
                <Text style={styles.statLab}>Followers</Text>
              </TouchableOpacity>
              <View style={styles.statDivider} />
              <TouchableOpacity
                style={styles.statItem}
                onPress={() => {
                  setConnType('following');
                  setConnModalVisible(true);
                }}
              >
                <Text style={styles.statVal}>{user?.following?.length || 0}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text style={styles.statLab}>Following</Text>
                  {isOwnProfile && <GradientIcon colors={tokens.gradients.green} name="people-circle" size={14} library={Ionicons} />}
                </View>
              </TouchableOpacity>
              <View style={styles.statDivider} />
              <TouchableOpacity style={styles.statItem} onPress={() => setPostsModalVisible(true)}>
                <Text style={styles.statVal}>{postCount}</Text>
                <Text style={styles.statLab}>Posts</Text>
              </TouchableOpacity>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionsRow}>
              {isOwnProfile ? (
                <TouchableOpacity style={styles.editBtn} onPress={() => setIsEditing(true)}>
                  <LinearGradient colors={tokens.gradients.green} style={styles.btnGradient}>
                    <MaterialIcons name="edit" size={20} color="white" />
                    <Text style={styles.btnText}>Edit Profile</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ) : (
                <>
                  <TouchableOpacity
                    style={styles.followBtn}
                    onPress={handleFollow}
                    disabled={isFollowLoading}
                  >
                    <LinearGradient
                      colors={isFollowing ? tokens.gradients.gray : tokens.gradients.green}
                      style={styles.btnGradient}
                    >
                      {isFollowLoading ? (
                        <ActivityIndicator size="small" color="white" />
                      ) : (
                        <>
                          <Ionicons name={isFollowing ? "person-remove" : "person-add"} size={20} color="white" />
                          <Text style={styles.btnText}>
                            {isFollowing ? 'Unfollow' : (user?.following?.includes(currentUserId) ? 'Follow Back' : 'Follow')}
                          </Text>
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.contactBtn, { borderColor: tokens.gradients.green[0] }]}
                    onPress={() => router.push({
                      pathname: `/chat/${id}`,
                      params: { targetUserName: user?.fullName, targetUserAvatar: user?.avatar }
                    })}
                  >
                    <View style={styles.contactBtnInner}>
                      <GradientIcon colors={tokens.gradients.green} name="chatbubble-ellipses" size={20} library={Ionicons} />
                      <GradientText colors={tokens.gradients.green} style={styles.btnText}>Contact</GradientText>
                    </View>
                  </TouchableOpacity>
                </>
              )}
            </View>

            {/* Plants Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <GradientIcon colors={tokens.gradients.green} name="local-florist" size={22} library={MaterialIcons} />
                <Text style={styles.sectionTitle}>Plantations</Text>
              </View>
              <View style={styles.plantsGrid}>
                {user?.plants?.length > 0 ? user.plants.map((plant: string, idx: number) => (
                  <View key={idx} style={styles.plantCard}>
                    <LinearGradient
                      colors={['rgba(76, 175, 80, 0.1)', 'rgba(76, 175, 80, 0.05)']}
                      style={styles.plantCardInner}
                    >
                      <GradientIcon colors={tokens.gradients.green} name="seedling" size={16} library={FontAwesome5} />
                      <Text style={styles.plantName}>{plant}</Text>
                    </LinearGradient>
                  </View>
                )) : (
                  <Text style={styles.emptyText}>No plants listed yet.</Text>
                )}
              </View>
            </View>
          </View>
        </ScrollView>
      )}

      {/* Edit Profile Modal */}
      <Modal visible={isEditing} animationType="slide" transparent onRequestClose={() => setIsEditing(false)}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#0b1a13' }]}>
          <SafeAreaView style={{ flex: 1 }}>
            <View style={[styles.fullModalContent, { backgroundColor: tokens.surfaceContainerLowest }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: tokens.onSurface }]}>Edit Profile</Text>
                <TouchableOpacity onPress={() => setIsEditing(false)}>
                  <MaterialIcons name="close" size={24} color={tokens.onSurface} />
                </TouchableOpacity>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ padding: 20, paddingBottom: 50 }}
                keyboardShouldPersistTaps="handled"
              >
                {/* Avatar Edit Section */}
                <View style={{ alignSelf: 'center', marginVertical: 30 }}>
                  <TouchableOpacity onPress={pickAvatar} activeOpacity={0.8}>
                    <View style={styles.modalAvatarWrapper}>
                      <CustomAvatar
                        uri={selectedAvatar || user?.avatar}
                        name={user?.fullName}
                        size={120}
                        style={[styles.avatar, { borderColor: tokens.primary }]}
                      />
                      <View style={[styles.roleBadge, { backgroundColor: tokens.gradients.green[0], padding: 8 }]}>
                        <MaterialIcons name="camera-alt" size={16} color="white" />
                      </View>
                    </View>
                  </TouchableOpacity>
                  <Text style={{ textAlign: 'center', color: tokens.onSurfaceVariant, fontSize: 12, marginTop: 8 }}>
                    Tap to change photo
                  </Text>
                </View>

                <Text style={styles.label}>Full Name</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Your Name"
                  placeholderTextColor={tokens.onSurfaceVariant}
                />

                <Text style={styles.label}>Your Plants</Text>
                <View style={styles.modalInputRow}>
                  <TextInput
                    style={[styles.modalInput, { flex: 1, marginBottom: 0 }]}
                    value={plantInput}
                    onChangeText={setPlantInput}
                    placeholder="Add a plant..."
                    placeholderTextColor={tokens.onSurfaceVariant}
                    onSubmitEditing={addPlant}
                  />
                  <TouchableOpacity onPress={addPlant} style={{ borderRadius: 12, overflow: 'hidden' }}>
                    <LinearGradient colors={tokens.gradients.green} style={styles.addBtn}>
                      <MaterialIcons name="add" size={24} color="white" />
                    </LinearGradient>
                  </TouchableOpacity>
                </View>

                <View style={styles.editPlantsList}>
                  {editPlants.map((p, idx) => (
                    <LinearGradient key={idx} colors={tokens.gradients.green} style={styles.editPlantTag}>
                      <Text style={styles.editPlantText}>{p}</Text>
                      <TouchableOpacity onPress={() => setEditPlants(editPlants.filter(item => item !== p))}>
                        <MaterialIcons name="cancel" size={18} color="white" />
                      </TouchableOpacity>
                    </LinearGradient>
                  ))}
                </View>

                <TouchableOpacity
                  style={[styles.saveBtn, isUploading && { opacity: 0.7 }]}
                  onPress={handleUpdateProfile}
                  disabled={isUploading}
                >
                  <LinearGradient colors={tokens.gradients.green} style={styles.saveBtnGradient}>
                    {isUploading ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Text style={styles.saveBtnText}>Save Changes</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </SafeAreaView>
        </View>
      </Modal>
      <FollowingModal
        visible={followingModalVisible}
        onClose={() => setFollowingModalVisible(false)}
      />
      <ConnectionsModal
        visible={connModalVisible}
        onClose={() => setConnModalVisible(false)}
        userId={id as string}
        type={connType}
      />
      <UserPostsModal
        visible={postsModalVisible}
        onClose={() => setPostsModalVisible(false)}
        userId={id as string}
        userName={user?.fullName || ''}
      />
    </View>
  );
}

function getStyles(tokens: any, mode: string) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: tokens.background,
    },
    headerCover: {
      height: 280,
      width: '100%',
    },
    coverImage: {
      flex: 1,
    },
    backBtn: {
      position: 'absolute',
      top: 50,
      left: 20,
      borderRadius: 12,
      overflow: 'hidden',
    },
    topAppBarInner: {
      padding: 10,
      justifyContent: 'center',
      alignItems: 'center',
    },
    profileCard: {
      marginTop: -60,
      backgroundColor: tokens.background,
      borderTopLeftRadius: 40,
      borderTopRightRadius: 40,
      paddingTop: 20,
      paddingHorizontal: 20,
      minHeight: 600,
    },
    fullModalContent: {
      flex: 1,
    },
    modalAvatarWrapper: {
      alignSelf: 'center',
      position: 'relative',
    },
    avatarWrapper: {
      alignSelf: 'center',
      marginTop: -80,
      position: 'relative',
    },
    avatar: {
      width: 120,
      height: 120,
      borderRadius: 60,
      borderWidth: 4,
      borderColor: tokens.background,
    },
    roleBadge: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      backgroundColor: tokens.primary,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      gap: 4,
      borderWidth: 2,
      borderColor: tokens.background,
    },
    roleText: {
      color: 'white',
      fontSize: 10,
      fontWeight: 'bold',
    },
    mainInfo: {
      alignItems: 'center',
      marginTop: 15,
    },
    name: {
      fontSize: 26,
      fontWeight: '800',
      color: tokens.onSurface,
    },
    email: {
      fontSize: 14,
      color: tokens.onSurfaceVariant,
      marginTop: 4,
    },
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 25,
      backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
      borderRadius: 25,
      paddingVertical: 15,
    },
    statItem: {
      alignItems: 'center',
      paddingHorizontal: 20,
    },
    statVal: {
      fontSize: 18,
      fontWeight: 'bold',
      color: tokens.onSurface,
    },
    statLab: {
      fontSize: 12,
      color: tokens.onSurfaceVariant,
      marginTop: 2,
    },
    statDivider: {
      width: 1,
      height: 30,
      backgroundColor: 'rgba(150,150,150,0.2)',
    },
    actionsRow: {
      flexDirection: 'row',
      marginTop: 25,
      gap: 12,
    },
    editBtn: {
      flex: 1,
      height: 50,
      borderRadius: 15,
      overflow: 'hidden',
    },
    followBtn: {
      flex: 1,
      height: 50,
      borderRadius: 15,
      overflow: 'hidden',
    },
    contactBtn: {
      flex: 1,
      height: 50,
      borderRadius: 15,
      borderWidth: 1.5,
      borderColor: tokens.primary,
      overflow: 'hidden',
    },
    btnGradient: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 8,
    },
    contactBtnInner: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 8,
    },
    btnText: {
      color: 'white',
      fontWeight: 'bold',
      fontSize: 15,
    },
    section: {
      marginTop: 35,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 15,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: tokens.onSurface,
    },
    plantsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    plantCard: {
      width: '48%',
      borderRadius: 15,
      overflow: 'hidden',
    },
    plantCardInner: {
      padding: 15,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    plantName: {
      fontSize: 14,
      fontWeight: '600',
      color: tokens.onSurface,
    },
    emptyText: {
      color: tokens.onSurfaceVariant,
      fontStyle: 'italic',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: mode === 'dark' ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.3)',
    },
    modalContainer: {
      flex: 1,
      justifyContent: 'center',
      padding: 20,
    },
    modalContent: {
      backgroundColor: tokens.background,
      borderRadius: 30,
      padding: 25,
      maxHeight: '80%',
      borderWidth: 1,
      borderColor: 'rgba(150,150,150,0.1)',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingVertical: 20,
      paddingTop: Platform.OS === 'ios' ? 20 : 40,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(150,150,150,0.1)',
      marginBottom: 10,
    },
    modalTitle: {
      fontSize: 22,
      fontWeight: 'bold',
      color: tokens.onSurface,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: tokens.onSurfaceVariant,
      marginBottom: 8,
      marginTop: 15,
    },
    modalInput: {
      backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
      borderRadius: 12,
      padding: 15,
      color: tokens.onSurface,
      fontSize: 16,
      marginBottom: 15,
    },
    modalInputRow: {
      flexDirection: 'row',
      gap: 10,
      alignItems: 'center',
      marginBottom: 15,
    },
    addBtn: {
      padding: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    editPlantsList: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 25,
    },
    editPlantTag: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 10,
    },
    editPlantText: {
      color: 'white',
      fontSize: 13,
      fontWeight: '600',
    },
    saveBtn: {
      height: 55,
      borderRadius: 15,
      overflow: 'hidden',
      marginTop: 20,
    },
    saveBtnGradient: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    saveBtnText: {
      color: 'white',
      fontSize: 16,
      fontWeight: 'bold',
    }
  });
}
