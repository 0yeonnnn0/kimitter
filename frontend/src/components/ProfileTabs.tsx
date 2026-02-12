import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import type { Post } from '../types/models';
import * as userService from '../services/userService';
import * as likeService from '../services/likeService';
import { useFeedStore } from '../stores/feedStore';
import PostCard from './PostCard';

type TabKey = 'threads' | 'replies' | 'media';

interface ProfileTabsProps {
  userId: number;
  headerComponent: React.ReactElement;
  refreshTrigger?: number;
}

export default function ProfileTabs({ userId, headerComponent, refreshTrigger }: ProfileTabsProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('threads');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const lastDeletedPostId = useFeedStore((s) => s.lastDeletedPostId);

  useEffect(() => {
    if (lastDeletedPostId !== null) {
      setPosts((prev) => prev.filter((p) => p.id !== lastDeletedPostId));
    }
  }, [lastDeletedPostId]);

  const fetchTabData = useCallback(async (tab: TabKey) => {
    setLoading(true);
    setPosts([]);
    try {
      let res;
      if (tab === 'threads') {
        res = await userService.getUserPosts(userId);
      } else if (tab === 'replies') {
        res = await userService.getUserRepliedPosts(userId);
      } else {
        res = await userService.getUserMediaPosts(userId);
      }
      setPosts(res.data.data.posts ?? res.data.data ?? []);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchTabData(activeTab);
  }, [activeTab, fetchTabData]);

  useEffect(() => {
    if (refreshTrigger !== undefined && refreshTrigger > 0) {
      fetchTabData(activeTab);
    }
  }, [refreshTrigger, fetchTabData, activeTab]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      let res;
      if (activeTab === 'threads') {
        res = await userService.getUserPosts(userId);
      } else if (activeTab === 'replies') {
        res = await userService.getUserRepliedPosts(userId);
      } else {
        res = await userService.getUserMediaPosts(userId);
      }
      setPosts(res.data.data.posts ?? res.data.data ?? []);
    } catch {
      // keep current data on refresh failure
    } finally {
      setRefreshing(false);
    }
  }, [activeTab, userId]);

  const handleTabPress = (tab: TabKey) => {
    if (tab !== activeTab) {
      setActiveTab(tab);
    }
  };

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

  const tabs: Array<{ key: TabKey; label: string }> = [
    { key: 'threads', label: '스레드' },
    { key: 'replies', label: '답글' },
    { key: 'media', label: '미디어' },
  ];

  const emptyMessage = {
    threads: '아직 게시물이 없습니다.',
    replies: '아직 답글이 없습니다.',
    media: '미디어가 포함된 게시물이 없습니다.',
  };

  const tabBar = (
    <View style={styles.tabBar}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={styles.tab}
          onPress={() => handleTabPress(tab.key)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.tabLabel,
              activeTab === tab.key && styles.tabLabelActive,
            ]}
          >
            {tab.label}
          </Text>
          {activeTab === tab.key ? <View style={styles.tabIndicator} /> : null}
        </TouchableOpacity>
      ))}
    </View>
  );

  const listHeader = (
    <>
      {headerComponent}
      {tabBar}
    </>
  );

  return (
    <FlatList
      data={posts}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={{ flexGrow: 1 }}
      ListHeaderComponent={listHeader}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
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
            <Text style={styles.emptyText}>{emptyMessage[activeTab]}</Text>
          </View>
        )
      }
    />
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    position: 'relative',
  },
  tabLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#999',
  },
  tabLabelActive: {
    color: '#1a1a1a',
    fontWeight: '600',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: '20%',
    right: '20%',
    height: 2,
    backgroundColor: '#1a1a1a',
    borderRadius: 1,
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
