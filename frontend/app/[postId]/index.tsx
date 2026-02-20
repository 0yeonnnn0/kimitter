import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Image,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as postService from '../../src/services/postService';
import * as commentService from '../../src/services/commentService';
import * as likeService from '../../src/services/likeService';
import { Ionicons } from '@expo/vector-icons';
import type { Post, Comment } from '../../src/types/models';
import { getFileUrl } from '../../src/config/constants';
import MediaGallery from '../../src/components/MediaGallery';
import BotBadge from '../../src/components/BotBadge';
import MarkdownText from '../../src/components/MarkdownText';
import BottomSheet from '../../src/components/BottomSheet';
import { useAuthStore } from '../../src/stores/authStore';

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return '방금 전';
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}시간 전`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay}일 전`;
  return date.toLocaleDateString('ko-KR');
}

export default function PostDetailScreen() {
  const { postId } = useLocalSearchParams<{ postId: string }>();
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [replyTo, setReplyTo] = useState<{ id: number; nickname: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingComment, setEditingComment] = useState<{ id: number; parentId?: number } | null>(null);
  const [editText, setEditText] = useState('');
  const [menuComment, setMenuComment] = useState<{ comment: Comment; parentId?: number } | null>(null);
  const currentUser = useAuthStore((s) => s.user);

  const handleDeleteComment = (commentId: number, parentId?: number) => {
    Alert.alert('댓글 삭제', '이 댓글을 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            await commentService.deleteComment(commentId);
            if (parentId) {
              setComments((prev) =>
                prev.map((c) =>
                  c.id === parentId
                    ? { ...c, replies: c.replies?.filter((r) => r.id !== commentId) }
                    : c,
                ),
              );
            } else {
              setComments((prev) => prev.filter((c) => c.id !== commentId));
            }
          } catch {
            Alert.alert('오류', '댓글 삭제에 실패했습니다.');
          }
        },
      },
    ]);
  };

  const canManage = (commentUserId: number): boolean => {
    if (!currentUser) return false;
    return currentUser.id === commentUserId || currentUser.role === 'ADMIN';
  };

  const handleEditComment = async () => {
    if (!editingComment || !editText.trim()) return;
    try {
      await commentService.updateComment(editingComment.id, editText.trim());
      if (editingComment.parentId) {
        setComments((prev) =>
          prev.map((c) =>
            c.id === editingComment.parentId
              ? { ...c, replies: c.replies?.map((r) => r.id === editingComment.id ? { ...r, content: editText.trim() } : r) }
              : c,
          ),
        );
      } else {
        setComments((prev) =>
          prev.map((c) => c.id === editingComment.id ? { ...c, content: editText.trim() } : c),
        );
      }
      setEditingComment(null);
      setEditText('');
    } catch {
      Alert.alert('오류', '댓글 수정에 실패했습니다.');
    }
  };

  const showCommentMenu = (comment: Comment, parentId?: number) => {
    setMenuComment({ comment, parentId });
  };

  const handleMenuEdit = () => {
    if (!menuComment) return;
    setEditingComment({ id: menuComment.comment.id, parentId: menuComment.parentId });
    setEditText(menuComment.comment.content);
    setMenuComment(null);
  };

  const handleMenuDelete = () => {
    if (!menuComment) return;
    const { comment, parentId } = menuComment;
    setMenuComment(null);
    handleDeleteComment(comment.id, parentId);
  };

  const loadPost = useCallback(async () => {
    if (!postId) return;
    try {
      const { data } = await postService.getPostById(Number(postId));
      setPost(data.data);
    } catch {
      Alert.alert('오류', '게시물을 불러오지 못했습니다.');
      router.back();
    }
  }, [postId, router]);

  const handleLikeToggle = async () => {
    if (!post) return;
    const newLikedState = !post.isLiked;
    setPost({
      ...post,
      isLiked: newLikedState,
      _count: {
        ...post._count,
        likes: post._count.likes + (newLikedState ? 1 : -1),
      },
    });
    try {
      await likeService.togglePostLike(post.id);
    } catch {
      setPost({
        ...post,
        isLiked: !newLikedState,
        _count: {
          ...post._count,
          likes: post._count.likes + (newLikedState ? -1 : 1),
        },
      });
    }
  };

  const loadComments = useCallback(async () => {
    if (!postId) return;
    try {
      const { data } = await commentService.getComments(Number(postId));
      setComments(data.data);
    } catch (_) {
      setComments([]);
    }
  }, [postId]);

  useEffect(() => {
    Promise.all([loadPost(), loadComments()]).finally(() => setLoading(false));
  }, [loadPost, loadComments]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([loadPost(), loadComments()]);
    } finally {
      setRefreshing(false);
    }
  }, [loadPost, loadComments]);

  const handleSubmitComment = async () => {
    if (!commentText.trim() || !postId) return;
    setSubmitting(true);
    try {
      if (replyTo) {
        const { data } = await commentService.createReply(replyTo.id, commentText.trim());
        setComments((prev) =>
          prev.map((c) =>
            c.id === replyTo.id
              ? { ...c, replies: [...(c.replies ?? []), data.data] }
              : c,
          ),
        );
      } else {
        const { data } = await commentService.createComment(Number(postId), commentText.trim());
        setComments((prev) => [...prev, data.data]);
      }
      setCommentText('');
      setReplyTo(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '댓글 작성에 실패했습니다.';
      Alert.alert('오류', message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!post) return null;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>게시물</Text>
        <View style={styles.headerSpacer} />
      </View>

      <FlatList
        data={comments}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ flexGrow: 1 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListHeaderComponent={
          <View>
            <View style={styles.postHeader}>
              {post.user.profileImageUrl ? (
                <Image source={{ uri: getFileUrl(post.user.profileImageUrl) }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={22} color="#999" />
                </View>
              )}
              <View>
                <View style={styles.nicknameRow}>
                  <Text style={styles.nickname}>{post.user.nickname}</Text>
                  {post.user.role === 'BOT' ? <BotBadge /> : null}
                </View>
                <Text style={styles.date}>{formatDate(post.createdAt)}</Text>
              </View>
            </View>
            {post.content ? (
              <View style={styles.postContentWrap}>
                <MarkdownText content={post.content} fontSize={16} />
              </View>
            ) : null}
            <MediaGallery media={post.media} />
            {post.tags.length > 0 ? (
              <View style={styles.tags}>
                {post.tags.map(({ tag }) => (
                  <Text key={tag.id} style={styles.tag}>
                    #{tag.name}
                  </Text>
                ))}
              </View>
            ) : null}
            <View style={styles.postActions}>
              <TouchableOpacity style={styles.likeButton} onPress={handleLikeToggle}>
                <Ionicons
                  name={post.isLiked ? 'heart' : 'heart-outline'}
                  size={22}
                  color={post.isLiked ? '#ff3b30' : '#666'}
                />
                <Text style={styles.likeCount}>{post._count.likes}</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.commentsLabel}>댓글 {comments.length}개</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.commentItem}>
            <View style={styles.commentHeader}>
              {item.user.profileImageUrl ? (
                <Image source={{ uri: getFileUrl(item.user.profileImageUrl) }} style={styles.commentAvatarImage} />
              ) : (
                <View style={styles.commentAvatar}>
                  <Ionicons name="person" size={16} color="#999" />
                </View>
              )}
              <View style={styles.commentBody}>
                <View style={styles.commentTopRow}>
                  <View style={styles.nicknameRow}>
                    <Text style={styles.commentNickname}>{item.user.nickname}</Text>
                    {item.user.role === 'BOT' ? <BotBadge /> : null}
                  </View>
                  {canManage(item.user.id) ? (
                    <TouchableOpacity
                      onPress={() => showCommentMenu(item)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="ellipsis-vertical" size={16} color="#999" />
                    </TouchableOpacity>
                  ) : null}
                </View>
                {editingComment?.id === item.id && !editingComment.parentId ? (
                  <View style={styles.editRow}>
                    <TextInput
                      style={styles.editInput}
                      value={editText}
                      onChangeText={setEditText}
                      multiline
                      autoFocus
                    />
                    <TouchableOpacity onPress={handleEditComment}>
                      <Text style={styles.editSave}>저장</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setEditingComment(null)}>
                      <Text style={styles.editCancel}>취소</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <MarkdownText content={item.content} fontSize={15} />
                )}
                <View style={styles.commentActions}>
                  <Text style={styles.commentDate}>{formatDate(item.createdAt)}</Text>
                  <TouchableOpacity
                    onPress={() => setReplyTo({ id: item.id, nickname: item.user.nickname })}
                  >
                    <Text style={styles.replyButton}>답글</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            {item.replies?.map((reply) => (
              <View key={reply.id} style={styles.replyItem}>
                {reply.user.profileImageUrl ? (
                  <Image source={{ uri: getFileUrl(reply.user.profileImageUrl) }} style={styles.commentAvatarImage} />
                ) : (
                  <View style={styles.commentAvatar}>
                    <Ionicons name="person" size={16} color="#999" />
                  </View>
                )}
                <View style={styles.commentBody}>
                  <View style={styles.commentTopRow}>
                    <View style={styles.nicknameRow}>
                      <Text style={styles.commentNickname}>{reply.user.nickname}</Text>
                      {reply.user.role === 'BOT' ? <BotBadge /> : null}
                    </View>
                    {canManage(reply.user.id) ? (
                      <TouchableOpacity
                        onPress={() => showCommentMenu(reply, item.id)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons name="ellipsis-vertical" size={16} color="#999" />
                      </TouchableOpacity>
                    ) : null}
                  </View>
                  {editingComment?.id === reply.id ? (
                    <View style={styles.editRow}>
                      <TextInput
                        style={styles.editInput}
                        value={editText}
                        onChangeText={setEditText}
                        multiline
                        autoFocus
                      />
                      <TouchableOpacity onPress={handleEditComment}>
                        <Text style={styles.editSave}>저장</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => setEditingComment(null)}>
                        <Text style={styles.editCancel}>취소</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <MarkdownText content={reply.content} fontSize={15} />
                  )}
                  <Text style={styles.commentDate}>{formatDate(reply.createdAt)}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      />

      <BottomSheet visible={menuComment !== null} onClose={() => setMenuComment(null)}>
        <View style={styles.menuContainer}>
          {menuComment && currentUser?.id === menuComment.comment.user.id ? (
            <TouchableOpacity style={styles.menuItem} onPress={handleMenuEdit}>
              <Ionicons name="pencil-outline" size={22} color="#1a1a1a" />
              <Text style={styles.menuItemText}>수정</Text>
            </TouchableOpacity>
          ) : null}
          {menuComment && currentUser?.id === menuComment.comment.user.id ? (
            <View style={styles.menuDivider} />
          ) : null}
          <TouchableOpacity style={styles.menuItem} onPress={handleMenuDelete}>
            <Ionicons name="trash-outline" size={22} color="#ff3b30" />
            <Text style={[styles.menuItemText, { color: '#ff3b30' }]}>삭제</Text>
          </TouchableOpacity>
        </View>
      </BottomSheet>

      {replyTo ? (
        <View style={styles.replyBar}>
          <Text style={styles.replyBarText}>@{replyTo.nickname} 에게 답글</Text>
          <TouchableOpacity onPress={() => setReplyTo(null)}>
            <Text style={styles.replyBarCancel}>취소</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <View style={styles.commentInputRow}>
        <TextInput
          style={styles.commentInput}
          placeholder={replyTo ? `@${replyTo.nickname}에게 답글...` : '댓글을 입력하세요...'}
          value={commentText}
          onChangeText={setCommentText}
          multiline
        />
        <TouchableOpacity
          style={[styles.sendButton, submitting && styles.sendButtonDisabled]}
          onPress={handleSubmitComment}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Ionicons name="send" size={18} color="#fff" style={{ transform: [{ rotate: '-45deg' }] }} />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 72,
    paddingBottom: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    width: 32,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  headerSpacer: {
    width: 32,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 10,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#e8e8e8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nicknameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  nickname: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  date: {
    fontSize: 12,
    color: '#999',
  },
  postContent: {
    fontSize: 16,
    color: '#333',
    paddingHorizontal: 16,
    paddingBottom: 12,
    lineHeight: 24,
  },
  postContentWrap: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 6,
  },
  tag: {
    color: '#007AFF',
    fontSize: 14,
  },
  postActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  likeCount: {
    fontSize: 15,
    color: '#666',
    fontWeight: '600',
  },
  commentsLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    marginTop: 8,
  },
  commentItem: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  commentHeader: {
    flexDirection: 'row',
    gap: 10,
  },
  commentAvatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e8e8e8',
    alignItems: 'center',
    justifyContent: 'center',
  },

  commentBody: {
    flex: 1,
  },
  commentNickname: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  commentContent: {
    fontSize: 15,
    color: '#333',
    marginTop: 4,
    lineHeight: 22,
  },
  commentActions: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 8,
  },
  commentDate: {
    fontSize: 13,
    color: '#999',
  },
  replyButton: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  commentTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  editInput: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  editSave: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0a7cff',
  },
  editCancel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
  },
  replyItem: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
    paddingLeft: 42,
  },
  replyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  replyBarText: {
    fontSize: 13,
    color: '#333',
  },
  replyBarCancel: {
    fontSize: 13,
    color: '#ff3b30',
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 36,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 8,
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    minHeight: 48,
    maxHeight: 120,
  },
  sendButton: {
    backgroundColor: '#000',
    borderRadius: 20,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  menuContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 32,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 12,
  },
  menuItemText: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#f0f0f0',
  },
});
