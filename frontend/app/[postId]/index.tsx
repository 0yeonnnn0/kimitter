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
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as postService from '../../src/services/postService';
import * as commentService from '../../src/services/commentService';
import * as likeService from '../../src/services/likeService';
import type { Post, Comment } from '../../src/types/models';

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
  const [submitting, setSubmitting] = useState(false);

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
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← 뒤로</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>게시물</Text>
      </View>

      <FlatList
        data={comments}
        keyExtractor={(item) => String(item.id)}
        ListHeaderComponent={
          <View>
            <View style={styles.postHeader}>
              {post.user.profileImageUrl ? (
                <Image source={{ uri: post.user.profileImageUrl }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>{post.user.nickname[0]}</Text>
                </View>
              )}
              <View>
                <Text style={styles.nickname}>{post.user.nickname}</Text>
                <Text style={styles.date}>{formatDate(post.createdAt)}</Text>
              </View>
            </View>
            {post.content ? <Text style={styles.postContent}>{post.content}</Text> : null}
            {post.media.map((m) => (
              <Image
                key={m.id}
                source={{ uri: m.fileUrl }}
                style={styles.postMedia}
                resizeMode="cover"
              />
            ))}
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
                <Text style={styles.likeIcon}>{post.isLiked ? '❤️' : '🤍'}</Text>
                <Text style={styles.likeCount}>{post._count.likes}</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.commentsLabel}>댓글 {comments.length}개</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.commentItem}>
            <View style={styles.commentHeader}>
              <View style={styles.commentAvatar}>
                <Text style={styles.commentAvatarText}>{item.user.nickname[0]}</Text>
              </View>
              <View style={styles.commentBody}>
                <Text style={styles.commentNickname}>{item.user.nickname}</Text>
                <Text style={styles.commentContent}>{item.content}</Text>
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
                <View style={styles.commentAvatar}>
                  <Text style={styles.commentAvatarText}>{reply.user.nickname[0]}</Text>
                </View>
                <View style={styles.commentBody}>
                  <Text style={styles.commentNickname}>{reply.user.nickname}</Text>
                  <Text style={styles.commentContent}>{reply.content}</Text>
                  <Text style={styles.commentDate}>{formatDate(reply.createdAt)}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      />

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
            <Text style={styles.sendButtonText}>전송</Text>
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
    paddingTop: 56,
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    gap: 16,
  },
  backButton: {
    fontSize: 16,
    color: '#007AFF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
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
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
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
  postMedia: {
    width: '100%',
    height: 300,
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
  likeIcon: {
    fontSize: 20,
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
    paddingVertical: 8,
  },
  commentHeader: {
    flexDirection: 'row',
    gap: 10,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentAvatarText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#666',
  },
  commentBody: {
    flex: 1,
  },
  commentNickname: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  commentContent: {
    fontSize: 14,
    color: '#333',
    marginTop: 2,
  },
  commentActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  commentDate: {
    fontSize: 12,
    color: '#999',
  },
  replyButton: {
    fontSize: 12,
    color: '#007AFF',
  },
  replyItem: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
    paddingLeft: 42,
  },
  replyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f0f7ff',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  replyBarText: {
    fontSize: 13,
    color: '#007AFF',
  },
  replyBarCancel: {
    fontSize: 13,
    color: '#ff3b30',
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
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
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
