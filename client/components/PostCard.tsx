import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Platform, Keyboard } from 'react-native';
import { Image } from 'expo-image';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { useRouter } from 'expo-router';
import { useLanguage } from '@/hooks/LanguageContext';
import { API_URL } from '@/constants/config';
import CustomAvatar from './CustomAvatar';

interface PostCardProps {
  post: any;
  tokens: any;
  mode: 'light' | 'dark';
  userId: string | null;
  userAvatar: string | null;
  onRefresh: () => void;
  isHighlighted?: boolean;
  onShowLikers?: () => void;
  onFocus?: () => void;
}

export default function PostCard({ post, tokens, mode, userId, userAvatar, onRefresh, isHighlighted, onShowLikers, onFocus }: PostCardProps) {
  const router = useRouter();
  const { t } = useLanguage();
  const styles = getStyles(tokens, mode);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isLiking, setIsLiking] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeletingComment, setIsDeletingComment] = useState<string | null>(null);
  const [isCommenting, setIsCommenting] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (isHighlighted) {
      setShowComments(true);
    }
  }, [isHighlighted]);

  const isLiked = post.likes.includes(userId);

  const handleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);
    try {
      const response = await fetch(`${API_URL}/api/posts/${post._id}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      if (response.ok) onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setIsLiking(false);
    }
  };

  const handleComment = async () => {
    if (!commentText.trim() || isCommenting) return;
    setIsCommenting(true);
    try {
      const response = await fetch(`${API_URL}/api/posts/${post._id}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, text: commentText })
      });
      if (response.ok) {
        setCommentText('');
        onRefresh();
        Keyboard.dismiss();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsCommenting(false);
    }
  };

  const handleDeletePost = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`${API_URL}/api/posts/${post._id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      if (response.ok) onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    setIsDeletingComment(commentId);
    try {
      const response = await fetch(`${API_URL}/api/posts/${post._id}/comments/${commentId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      if (response.ok) onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeletingComment(null);
    }
  };

  return (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <TouchableOpacity onPress={() => router.push(`/profile/${post.user}`)}>
          <CustomAvatar uri={post.avatar} name={post.fullName} size={48} style={styles.postAvatar} />
        </TouchableOpacity>
        <View style={styles.postInfo}>
          <TouchableOpacity onPress={() => router.push(`/profile/${post.user}`)}>
            <Text style={styles.postUser}>{post.fullName}</Text>
          </TouchableOpacity>
          <Text style={styles.postRole}>{post.role}</Text>
        </View>
        {post.user === userId && (
          <TouchableOpacity onPress={handleDeletePost} style={{ marginLeft: 10 }}>
            {isDeleting ? <ActivityIndicator size="small" color="#ff4d4d" /> : <MaterialIcons name="delete-sweep" size={22} color="#ff4d4d" />}
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.postText}>{post.content}</Text>
      
      {post.image && (
        <Image source={{ uri: post.image }} style={styles.postImage} contentFit="cover" />
      )}

      <View style={styles.statsRow}>
        <TouchableOpacity style={styles.statItem} onPress={onShowLikers}>
          <Ionicons name="heart" size={14} color="#ff4d4d" />
          <Text style={styles.statText}>{post.likes.length} likes</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.statItem} onPress={() => setShowComments(!showComments)}>
          <Ionicons name="chatbubble" size={14} color={tokens.primary} />
          <Text style={styles.statText}>{post.comments.length} comments</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
          {isLiked ? (
            <GradientIcon colors={['#FF5252', '#D32F2F']} name="heart" size={22} library={Ionicons} />
          ) : (
            <Ionicons name="heart-outline" size={22} color={tokens.onSurfaceVariant} />
          )}
          <Text style={[styles.actionBtnText, isLiked && { color: '#FF5252' }]}>{isLiked ? t('liked') : t('like')}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={() => setShowComments(!showComments)}
        >
          {showComments ? (
            <GradientIcon colors={['#66BB6A', '#2E7D32']} name="chatbubble" size={20} library={Ionicons} />
          ) : (
            <Ionicons name="chatbubble-outline" size={20} color={tokens.onSurfaceVariant} />
          )}
          <Text style={[styles.actionBtnText, showComments && { color: tokens.primary }]}>
            {showComments ? t('hide') : t('comment')}
          </Text>
        </TouchableOpacity>
      </View>

      {showComments && (
        <View style={styles.commentList}>
          {post.comments.map((comment: any) => (
            <View key={comment._id || comment.id} style={styles.commentWrapper}>
              <TouchableOpacity onPress={() => router.push(`/profile/${comment.user}`)}>
                <CustomAvatar uri={comment.avatar} name={comment.fullName} size={36} style={styles.commentAvatar} />
              </TouchableOpacity>
              <View style={[styles.commentBubble, comment.isExpert && styles.expertBubble]}>
                <View style={styles.commentHeader}>
                  <Text style={styles.commentUser}>{comment.fullName}</Text>
                  {comment.user === userId && (
                    <TouchableOpacity onPress={() => handleDeleteComment(comment._id)} disabled={isDeletingComment === comment._id}>
                      {isDeletingComment === comment._id ? (
                        <ActivityIndicator size="small" color="#ff4d4d" />
                      ) : (
                        <MaterialIcons name="delete-outline" size={14} color="#ff4d4d" />
                      )}
                    </TouchableOpacity>
                  )}
                </View>
                <Text style={styles.commentContent}>{comment.text}</Text>
              </View>
            </View>
          ))}
          
          <View style={styles.quickReply}>
            <TextInput
              style={[
                styles.replyInput,
                isFocused && { borderColor: tokens.primary, borderWidth: 1 }
              ]}
              placeholder={t('writeReply')}
              placeholderTextColor={tokens.onSurfaceVariant}
              value={commentText}
              onChangeText={setCommentText}
              onSubmitEditing={handleComment}
              onFocus={() => {
                setIsFocused(true);
                if (onFocus) onFocus();
              }}
              onBlur={() => setIsFocused(false)}
            />
            <TouchableOpacity onPress={handleComment} disabled={isCommenting}>
              {isCommenting ? (
                <ActivityIndicator size="small" color={tokens.primary} />
              ) : (
                <MaterialIcons name="send" size={20} color={tokens.primary} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

function GradientText({ colors, children, style }: any) {
  if (Platform.OS === 'web') return <Text style={[style, { color: colors[0] }]}>{children}</Text>;
  return (
    <MaskedView maskElement={<Text style={style}>{children}</Text>}>
      <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
        <Text style={[style, { opacity: 0 }]}>{children}</Text>
      </LinearGradient>
    </MaskedView>
  );
}

function GradientIcon({ colors, name, size, library: IconLibrary }: any) {
  if (Platform.OS === 'web') return <IconLibrary name={name} size={size} color={colors[0]} />;
  return (
    <MaskedView maskElement={<IconLibrary name={name} size={size} color="white" />}>
      <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}>
        <IconLibrary name={name} size={size} style={{ opacity: 0 }} />
      </LinearGradient>
    </MaskedView>
  );
}

const getStyles = (tokens: any, mode: 'light' | 'dark') => StyleSheet.create({
  postCard: {
    backgroundColor: mode === 'dark' ? tokens.surfaceContainerLow + '70' : '#ffffff',
    borderRadius: 28,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: tokens.primary + '30', // Faint green border
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  commentUser: {
    fontSize: 14,
    fontWeight: '800',
    color: tokens.onSurface,
  },
  commentContent: {
    fontSize: 14,
    lineHeight: 20,
    color: tokens.onSurface,
  },
  quickReply: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: tokens.outlineVariant + '10',
  },
  replyInput: {
    flex: 1,
    height: 36,
    backgroundColor: mode === 'dark' ? tokens.surfaceContainerLowest + '80' : '#f0f2f1',
    borderRadius: 18,
    paddingHorizontal: 12,
    color: tokens.onSurface,
    borderWidth: 1,
    borderColor: 'transparent',
  },
});
