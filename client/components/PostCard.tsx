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
import { GradientText, GradientIcon } from './GradientUI';

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

  const formatTimeAgo = (date: string | Date) => {
    if (!date) return '';
    const now = new Date();
    const postDate = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - postDate.getTime()) / 1000);

    if (diffInSeconds < 60) return t('justNow') || 'Just now';
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}${t('m') || 'm'}`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}${t('h') || 'h'}`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}${t('d') || 'd'}`;
  };

  return (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <TouchableOpacity onPress={() => router.push(`/profile/${post.user}`)}>
          <CustomAvatar uri={post.avatar} name={post.fullName} size={40} style={styles.postAvatar} />
        </TouchableOpacity>
        <View style={styles.postInfo}>
          <View style={styles.userRow}>
            <TouchableOpacity onPress={() => router.push(`/profile/${post.user}`)}>
              <Text style={styles.postUser}>{post.fullName}</Text>
            </TouchableOpacity>
            <Text style={styles.timeText}>• {formatTimeAgo(post.createdAt || post.time)}</Text>
          </View>
          <Text style={styles.postRole}>{post.role}</Text>
        </View>
        {post.user === userId && (
          <TouchableOpacity onPress={handleDeletePost} style={{ marginLeft: 10 }}>
            {isDeleting ? <ActivityIndicator size="small" color={tokens.gradients.red[0]} /> : <GradientIcon colors={tokens.gradients.red} name="delete-sweep" size={22} library={MaterialIcons} />}
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.postText}>{post.content}</Text>
      
      {post.image && (
        <Image source={{ uri: post.image }} style={styles.postImage} contentFit="cover" />
      )}

      {post.likes.length > 0 && (
        <TouchableOpacity style={styles.likesCountRow} onPress={onShowLikers}>
          <View style={styles.likersAvatars}>
             <GradientIcon colors={tokens.gradients.red} name="heart" size={12} library={Ionicons} />
             <Text style={styles.likesCountText}>
               {post.likes.length} {post.likes.length === 1 ? t('like') : t('likes')}
             </Text>
          </View>
        </TouchableOpacity>
      )}

      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
          {isLiked ? (
            <GradientIcon colors={tokens.gradients.red} name="heart" size={22} library={Ionicons} />
          ) : (
            <GradientIcon colors={tokens.gradients.gray} name="heart-outline" size={22} library={Ionicons} />
          )}
          {isLiked ? (
             <GradientText colors={tokens.gradients.red} style={styles.actionBtnText}>{t('liked')}</GradientText>
          ) : (
             <GradientText colors={tokens.gradients.gray} style={styles.actionBtnText}>{t('like')}</GradientText>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={() => setShowComments(!showComments)}
        >
          {showComments ? (
            <GradientIcon colors={tokens.gradients.green} name="chatbubble" size={20} library={Ionicons} />
          ) : (
            <GradientIcon colors={tokens.gradients.gray} name="chatbubble-outline" size={20} library={Ionicons} />
          )}
          {showComments ? (
             <GradientText colors={tokens.gradients.green} style={styles.actionBtnText}>{post.comments.length > 0 && `${post.comments.length} `}{t('hide')}</GradientText>
          ) : (
             <GradientText colors={tokens.gradients.gray} style={styles.actionBtnText}>{post.comments.length > 0 && `${post.comments.length} `}{t('comment')}</GradientText>
          )}
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
                        <ActivityIndicator size="small" color={tokens.gradients.red[0]} />
                      ) : (
                        <GradientIcon colors={tokens.gradients.red} name="delete-outline" size={14} library={MaterialIcons} />
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
                isFocused && { borderColor: tokens.gradients.green[0], borderWidth: 1 }
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
                <ActivityIndicator size="small" color={tokens.gradients.green[0]} />
              ) : (
                <GradientIcon colors={tokens.gradients.green} name="send" size={20} library={MaterialIcons} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}



const getStyles = (tokens: any, mode: 'light' | 'dark') => StyleSheet.create({
  postCard: {
    backgroundColor: mode === 'dark' ? tokens.surfaceContainerLow + '70' : '#ffffff',
    borderRadius: 20,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: tokens.gradients.green[0] + '30',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  postAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  postInfo: {
    flex: 1,
    marginLeft: 10,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeText: {
    fontSize: 12,
    color: tokens.onSurfaceVariant,
    opacity: 0.6,
  },
  postUser: {
    fontSize: 15,
    fontWeight: 'bold',
    color: tokens.onSurface,
  },
  postRole: {
    fontSize: 11,
    color: tokens.onSurfaceVariant,
    opacity: 0.7,
  },
  tagBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  tagText: {
    fontSize: 8,
    fontWeight: '900',
  },
  postText: {
    fontSize: 15,
    lineHeight: 22,
    color: tokens.onSurface,
    marginBottom: 12,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    marginBottom: 12,
  },
  statsRow: {
    display: 'none', // Removed to save space
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 12,
    color: tokens.onSurfaceVariant,
    fontWeight: '500',
  },
  likesCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  likersAvatars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  likesCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: tokens.onSurfaceVariant,
  },
  actionRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderColor: tokens.outlineVariant + '15',
    paddingTop: 10,
    justifyContent: 'space-around',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: tokens.onSurfaceVariant,
  },
  commentList: {
    gap: 12,
    marginTop: 12,
  },
  commentWrapper: {
    flexDirection: 'row',
    gap: 10,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  commentBubble: {
    flex: 1,
    backgroundColor: mode === 'dark' ? tokens.surfaceContainerLowest + '60' : '#f0f4f2',
    padding: 10,
    borderRadius: 16,
    borderTopLeftRadius: 2,
  },
  expertBubble: {
    backgroundColor: mode === 'dark' ? tokens.gradients.green[0] + '20' : tokens.gradients.green[0] + '08',
    borderColor: tokens.gradients.green[0] + '40',
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
