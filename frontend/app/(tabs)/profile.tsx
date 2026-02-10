import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/stores/authStore';
import * as userService from '../../src/services/userService';
import * as likeService from '../../src/services/likeService';
import { getFileUrl } from '../../src/config/constants';
import type { Post } from '../../src/types/models';
import PostCard from '../../src/components/PostCard';

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  const loadPosts = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await userService.getUserPosts(user.id);
      setPosts(data.data.posts ?? data.data ?? []);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const handleLikeToggle = async (postId: number, liked: boolean) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              isLiked: liked,
              _count: { ...p._count, likes: p._count.likes + (liked ? 1 : -1) },
            }
          : p,
      ),
    );
    try {
      await likeService.togglePostLike(postId);
    } catch {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                isLiked: !liked,
                _count: { ...p._count, likes: p._count.likes + (liked ? -1 : 1) },
              }
            : p,
        ),
      );
    }
  };

  const handleLogout = () => {
    Alert.alert('로그아웃', '정말 로그아웃하시겠어요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '로그아웃',
        style: 'destructive',
        onPress: async () => {
          setLoggingOut(true);
          try {
            await logout();
          } finally {
            setLoggingOut(false);
          }
        },
      },
    ]);
  };

  if (!user) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerSide} />
        <Text style={styles.headerTitle}>{user.nickname}</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.headerSide} disabled={loggingOut}>
          {loggingOut ? (
            <ActivityIndicator size="small" color="#ff3b30" />
          ) : (
            <Ionicons name="log-out-outline" size={24} color="#ff3b30" />
          )}
        </TouchableOpacity>
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => String(item.id)}
        ListHeaderComponent={
          <View style={styles.profileSection}>
            <View style={styles.profileRow}>
              <View style={styles.profileInfo}>
                <Text style={styles.nickname}>{user.nickname}</Text>
                <Text style={styles.username}>@{user.username}</Text>
                {user.bio ? <Text style={styles.bio}>{user.bio}</Text> : null}
              </View>
              {user.profileImageUrl ? (
                <Image source={{ uri: getFileUrl(user.profileImageUrl) }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>{user.nickname[0]}</Text>
                </View>
              )}
            </View>
            {user.role === 'ADMIN' ? (
              <View style={styles.badgeRow}>
                <View style={styles.adminBadge}>
                  <Text style={styles.adminBadgeText}>관리자</Text>
                </View>
              </View>
            ) : null}
            <Text style={styles.statText}>게시물 {posts.length}개</Text>
            <TouchableOpacity style={styles.editButton}>
              <Text style={styles.editButtonText}>프로필 편집</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => (
          <PostCard
            post={item}
            isLiked={item.isLiked}
            onLikeToggle={handleLikeToggle}
          />
        )}
        ListEmptyComponent={
          loading ? (
            <View style={styles.emptyContainer}>
              <ActivityIndicator size="large" />
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>아직 게시물이 없습니다.</Text>
            </View>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 56,
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  headerSide: {
    width: 32,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  profileSection: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderBottomWidth: 8,
    borderBottomColor: '#f0f0f0',
  },
  profileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  profileInfo: {
    flex: 1,
    marginRight: 16,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  avatarPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  nickname: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  username: {
    fontSize: 15,
    color: '#999',
  },
  bio: {
    fontSize: 15,
    color: '#333',
    marginTop: 10,
    lineHeight: 21,
  },
  badgeRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  adminBadge: {
    backgroundColor: '#ff9500',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  adminBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  statText: {
    fontSize: 14,
    color: '#999',
    marginTop: 14,
  },
  editButton: {
    marginTop: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: '#999',
  },
});
