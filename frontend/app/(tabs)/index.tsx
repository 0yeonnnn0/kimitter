import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  Image,
  RefreshControl,
  BackHandler,
  ToastAndroid,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFeedStore } from '../../src/stores/feedStore';
import { useAuthStore } from '../../src/stores/authStore';
import { useCreateModalStore } from '../../src/stores/createModalStore';
import { getFileUrl } from '../../src/config/constants';
import PostCard from '../../src/components/PostCard';
import HomeSidebar from '../../src/components/HomeSidebar';

export default function HomeScreen() {
  const { posts, isLoading, isRefreshing, fetchPosts, loadMore, toggleLike } = useFeedStore();
  const user = useAuthStore((s) => s.user);
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const openCreateModal = useCreateModalStore((s) => s.open);
  const router = useRouter();
  const [sidebarVisible, setSidebarVisible] = useState(false);

  const lastBackPress = useRef(0);

  useEffect(() => {
    if (isLoggedIn) {
      fetchPosts();
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const handler = () => {
      const now = Date.now();
      if (now - lastBackPress.current < 2000) {
        BackHandler.exitApp();
        return true;
      }
      lastBackPress.current = now;
      ToastAndroid.show('한 번 더 누르면 종료됩니다', ToastAndroid.SHORT);
      return true;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', handler);
    return () => subscription.remove();
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
        <Text style={styles.headerTitle}>Kimitter</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => router.push('/(tabs)/search')} style={styles.headerIcon}>
            <Ionicons name="search-outline" size={22} color="#1a1a1a" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setSidebarVisible(true)} style={styles.headerIcon}>
            <Ionicons name="menu-outline" size={24} color="#1a1a1a" />
          </TouchableOpacity>
        </View>
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

      <HomeSidebar
        visible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIcon: {
    padding: 4,
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
