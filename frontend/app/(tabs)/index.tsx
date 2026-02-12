import { useEffect, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFeedStore } from '../../src/stores/feedStore';
import { useAuthStore } from '../../src/stores/authStore';
import { useCreateModalStore } from '../../src/stores/createModalStore';
import { getFileUrl } from '../../src/config/constants';
import PostCard from '../../src/components/PostCard';

export default function HomeScreen() {
  const { posts, isLoading, isRefreshing, fetchPosts, loadMore, toggleLike } = useFeedStore();
  const user = useAuthStore((s) => s.user);
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const openCreateModal = useCreateModalStore((s) => s.open);

  useEffect(() => {
    if (isLoggedIn) {
      fetchPosts();
    }
  }, [isLoggedIn]);

  const handleLikeToggle = useCallback(
    (postId: number, liked: boolean) => {
      toggleLike(postId, liked);
    },
    [toggleLike],
  );

  const handleRefresh = useCallback(() => {
    fetchPosts(true);
  }, [fetchPosts]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Kimitter</Text>
      </View>
      <FlatList
        data={posts}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ flexGrow: 1 }}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            isLiked={item.isLiked}
            onLikeToggle={handleLikeToggle}
          />
        )}
        ListHeaderComponent={
          user ? (
            <TouchableOpacity
              style={styles.composeCard}
              onPress={openCreateModal}
              activeOpacity={0.7}
            >
              <View style={styles.composeAvatarCol}>
                {user.profileImageUrl ? (
                  <Image
                    source={{ uri: getFileUrl(user.profileImageUrl) }}
                    style={styles.composeAvatar}
                  />
                ) : (
                  <View style={styles.composeAvatarFallback}>
                    <Ionicons name="person" size={18} color="#999" />
                  </View>
                )}
              </View>
              <View style={styles.composeContentCol}>
                <Text style={styles.composeNickname}>{user.nickname}</Text>
                <Text style={styles.composePlaceholder}>새로운 소식이 있나요?</Text>
              </View>
            </TouchableOpacity>
          ) : null
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          isLoading ? null : (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>아직 게시물이 없어요.</Text>
              <Text style={styles.emptySubtext}>첫 번째 글을 작성해보세요!</Text>
            </View>
          )
        }
        ListFooterComponent={
          isLoading && posts.length > 0 ? (
            <ActivityIndicator style={styles.loader} />
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    paddingTop: 72,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  empty: {
    paddingTop: 80,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
  },
  loader: {
    paddingVertical: 20,
  },
  composeCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  composeAvatarCol: {
    width: 48,
  },
  composeAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e0e0e0',
  },
  composeAvatarFallback: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e8e8e8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  composeContentCol: {
    flex: 1,
    justifyContent: 'center',
  },
  composeNickname: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  composePlaceholder: {
    fontSize: 15,
    color: '#999',
  },
});
