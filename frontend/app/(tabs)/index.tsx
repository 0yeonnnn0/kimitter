import { useEffect, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Text,
  RefreshControl,
} from 'react-native';
import { useFeedStore } from '../../src/stores/feedStore';
import PostCard from '../../src/components/PostCard';

export default function HomeScreen() {
  const { posts, isLoading, isRefreshing, fetchPosts, loadMore, toggleLike } = useFeedStore();

  useEffect(() => {
    fetchPosts();
  }, []);

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
        <Text style={styles.headerTitle}>Family Threads</Text>
      </View>
      <FlatList
        data={posts}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            isLiked={item.isLiked}
            onLikeToggle={handleLikeToggle}
          />
        )}
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
});
