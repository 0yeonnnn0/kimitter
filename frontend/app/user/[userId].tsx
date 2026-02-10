import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as userService from '../../src/services/userService';
import * as likeService from '../../src/services/likeService';
import { getFileUrl } from '../../src/config/constants';
import type { User, Post } from '../../src/types/models';
import PostCard from '../../src/components/PostCard';

export default function UserProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!userId) return;
    try {
      const [userRes, postsRes] = await Promise.all([
        userService.getUser(Number(userId)),
        userService.getUserPosts(Number(userId)),
      ]);
      setUser(userRes.data.data);
      setPosts(postsRes.data.data.posts ?? postsRes.data.data ?? []);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>유저를 찾을 수 없습니다.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{user.nickname}</Text>
        <View style={styles.backButton} />
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
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>아직 게시물이 없습니다.</Text>
          </View>
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
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  errorText: {
    fontSize: 16,
    color: '#999',
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
  backButton: {
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
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: '#999',
  },
});
