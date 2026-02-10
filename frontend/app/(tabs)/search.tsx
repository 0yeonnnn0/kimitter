import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as postService from '../../src/services/postService';
import * as tagService from '../../src/services/tagService';
import * as userService from '../../src/services/userService';
import * as likeService from '../../src/services/likeService';
import PostCard from '../../src/components/PostCard';
import { getFileUrl } from '../../src/config/constants';
import type { Post, Tag, User } from '../../src/types/models';

type SearchMode = 'all' | 'tag' | 'user';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_GAP = 2;
const NUM_COLUMNS = 3;
const TILE_SIZE = Math.floor((SCREEN_WIDTH - GRID_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS);

type GalleryRow =
  | { type: 'header'; key: string; label: string }
  | { type: 'row'; key: string; posts: Post[] };

function formatMonthLabel(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월`;
}

function buildGalleryRows(allPosts: Post[]): GalleryRow[] {
  const grouped = new Map<string, Post[]>();
  for (const post of allPosts) {
    const key = formatMonthLabel(post.createdAt);
    const arr = grouped.get(key);
    if (arr) {
      arr.push(post);
    } else {
      grouped.set(key, [post]);
    }
  }

  const rows: GalleryRow[] = [];
  for (const [label, monthPosts] of grouped) {
    rows.push({ type: 'header', key: `h-${label}`, label });
    for (let i = 0; i < monthPosts.length; i += NUM_COLUMNS) {
      const chunk = monthPosts.slice(i, i + NUM_COLUMNS);
      rows.push({ type: 'row', key: `r-${label}-${i}`, posts: chunk });
    }
  }
  return rows;
}

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<SearchMode>('all');
  const [posts, setPosts] = useState<Post[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [galleryLoading, setGalleryLoading] = useState(true);
  const [searched, setSearched] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadAllPosts = useCallback(async () => {
    try {
      const { data } = await postService.getPosts(1, 100);
      setAllPosts(data.data);
    } catch {
      setAllPosts([]);
    } finally {
      setGalleryLoading(false);
    }
  }, []);

  const galleryRows = useMemo(() => buildGalleryRows(allPosts), [allPosts]);

  useEffect(() => {
    loadAllPosts();
  }, [loadAllPosts]);

  const toggleMode = (next: SearchMode) => {
    if (mode === next) {
      setMode('all');
    } else {
      setMode(next);
    }
    setQuery('');
    setPosts([]);
    setTags([]);
    setUsers([]);
    setSelectedTag(null);
    setSearched(false);
  };

  const clearSearch = () => {
    setQuery('');
    setPosts([]);
    setTags([]);
    setUsers([]);
    setSelectedTag(null);
    setSearched(false);
    setMode('all');
  };

  const handleSearch = useCallback(async () => {
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    setSearched(true);
    setSelectedTag(null);

    try {
      if (mode === 'tag') {
        const { data } = await tagService.searchTags(q);
        setTags(data.data);
        setPosts([]);
        setUsers([]);
      } else if (mode === 'user') {
        const { data } = await userService.searchUsers(q);
        setUsers(data.data);
        setPosts([]);
        setTags([]);
      } else {
        const { data } = await postService.searchPosts({ q });
        setPosts(data.data);
        setTags([]);
        setUsers([]);
      }
    } catch {
      setPosts([]);
      setTags([]);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [query, mode]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (!searched) {
        await loadAllPosts();
      } else if (selectedTag) {
        const { data } = await tagService.getPostsByTag(selectedTag);
        setPosts(data.data);
      } else if (mode === 'tag') {
        const q = query.trim();
        if (q) {
          const { data } = await tagService.searchTags(q);
          setTags(data.data);
        }
      } else if (mode === 'user') {
        const q = query.trim();
        if (q) {
          const { data } = await userService.searchUsers(q);
          setUsers(data.data);
        }
      } else {
        const q = query.trim();
        if (q) {
          const { data } = await postService.searchPosts({ q });
          setPosts(data.data);
        }
      }
    } catch {
      // keep current data on refresh failure
    } finally {
      setRefreshing(false);
    }
  }, [searched, selectedTag, mode, query, loadAllPosts]);

  const handleTagSelect = useCallback(async (tagName: string) => {
    setSelectedTag(tagName);
    setLoading(true);
    try {
      const { data } = await tagService.getPostsByTag(tagName);
      setPosts(data.data);
      setTags([]);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleLikeToggle = useCallback(async (postId: number, liked: boolean) => {
    const updateFn = (prev: Post[]) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, isLiked: liked, _count: { ...p._count, likes: p._count.likes + (liked ? 1 : -1) } }
          : p,
      );
    setPosts(updateFn);
    try {
      await likeService.togglePostLike(postId);
    } catch {
      const revertFn = (prev: Post[]) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, isLiked: !liked, _count: { ...p._count, likes: p._count.likes + (liked ? -1 : 1) } }
            : p,
        );
      setPosts(revertFn);
    }
  }, []);

  const placeholder: Record<SearchMode, string> = {
    all: '게시물 검색...',
    tag: '태그 검색...',
    user: '이름 또는 아이디 검색...',
  };

  const emptyMessage = selectedTag
    ? `#${selectedTag} 태그의 게시물이 없습니다.`
    : mode === 'tag'
      ? '일치하는 태그가 없습니다.'
      : mode === 'user'
        ? '일치하는 유저가 없습니다.'
        : '검색 결과가 없습니다.';

  const renderTagItem = ({ item }: { item: Tag }) => (
    <TouchableOpacity style={styles.tagItem} onPress={() => handleTagSelect(item.name)}>
      <View style={styles.tagIcon}>
        <Ionicons name="pricetag-outline" size={18} color="#007AFF" />
      </View>
      <Text style={styles.tagItemText}>#{item.name}</Text>
      <Ionicons name="chevron-forward" size={16} color="#ccc" />
    </TouchableOpacity>
  );

  const renderUserItem = ({ item }: { item: User }) => (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => router.push(`/user/${item.id}`)}
    >
      {item.profileImageUrl ? (
        <Image source={{ uri: getFileUrl(item.profileImageUrl) }} style={styles.userAvatar} />
      ) : (
        <View style={styles.userAvatarPlaceholder}>
          <Text style={styles.userAvatarText}>{item.nickname[0]}</Text>
        </View>
      )}
      <View style={styles.userInfo}>
        <Text style={styles.userNickname}>{item.nickname}</Text>
        <Text style={styles.userUsername}>@{item.username}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderTile = (post: Post, index: number, rowLength: number) => {
    const isRightEdge = index === rowLength - 1;
    const firstMedia = post.media[0];
    const hasMedia = !!firstMedia;

    return (
      <TouchableOpacity
        key={post.id}
        activeOpacity={0.8}
        onPress={() => router.push(`/${post.id}`)}
        style={[styles.gridTile, !isRightEdge && { marginRight: GRID_GAP }]}
      >
        {hasMedia ? (
          <>
            <Image
              source={{ uri: getFileUrl(firstMedia.fileUrl) }}
              style={styles.gridImage}
              resizeMode="cover"
            />
            {post.media.length > 1 ? (
              <View style={styles.multiMediaBadge}>
                <Ionicons name="copy-outline" size={14} color="#fff" />
              </View>
            ) : null}
            {firstMedia.mediaType === 'VIDEO' ? (
              <View style={styles.videoBadge}>
                <Ionicons name="play" size={14} color="#fff" />
              </View>
            ) : null}
          </>
        ) : (
          <View style={styles.textTile}>
            <Text style={styles.textTileContent} numberOfLines={5}>
              {post.content}
            </Text>
            <Text style={styles.textTileAuthor}>{post.user.nickname}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderGalleryItem = ({ item }: { item: GalleryRow }) => {
    if (item.type === 'header') {
      return (
        <View style={styles.monthHeader}>
          <Text style={styles.monthHeaderText}>{item.label}</Text>
        </View>
      );
    }
    return (
      <View style={styles.gridRow}>
        {item.posts.map((post, i) => renderTile(post, i, item.posts.length))}
      </View>
    );
  };

  const showTagList = searched && mode === 'tag' && tags.length > 0 && !selectedTag;
  const showUserList = searched && mode === 'user' && users.length > 0;
  const showSearchResults = searched && !showTagList && !showUserList;

  const searchBar = (
    <View style={styles.searchSection}>
      <View style={styles.searchInputRow}>
        {mode !== 'all' ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {mode === 'tag' ? '태그' : '유저'}
            </Text>
            <TouchableOpacity onPress={() => toggleMode(mode)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={16} color="#666" />
            </TouchableOpacity>
          </View>
        ) : null}
        <TextInput
          style={styles.searchInput}
          placeholder={placeholder[mode]}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
          autoCapitalize="none"
        />
        {searched ? (
          <TouchableOpacity onPress={clearSearch} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterButton, mode === 'tag' && styles.filterButtonActive]}
          onPress={() => toggleMode('tag')}
        >
          <Ionicons name="pricetag-outline" size={14} color={mode === 'tag' ? '#fff' : '#666'} />
          <Text style={[styles.filterText, mode === 'tag' && styles.filterTextActive]}>태그</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, mode === 'user' && styles.filterButtonActive]}
          onPress={() => toggleMode('user')}
        >
          <Ionicons name="person-outline" size={14} color={mode === 'user' ? '#fff' : '#666'} />
          <Text style={[styles.filterText, mode === 'user' && styles.filterTextActive]}>유저</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const tagBreadcrumb = selectedTag ? (
    <TouchableOpacity style={styles.tagBreadcrumb} onPress={() => { setSelectedTag(null); setPosts([]); setSearched(true); handleSearch(); }}>
      <Ionicons name="chevron-back" size={16} color="#007AFF" />
      <Text style={styles.tagBreadcrumbText}>#{selectedTag} 게시물</Text>
    </TouchableOpacity>
  ) : null;

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" />
        </View>
      );
    }

    if (showTagList) {
      return (
        <FlatList
          data={tags}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderTagItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        />
      );
    }

    if (showUserList) {
      return (
        <FlatList
          data={users}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderUserItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        />
      );
    }

    if (showSearchResults) {
      return (
        <FlatList
          data={posts}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <PostCard post={item} isLiked={item.isLiked} onLikeToggle={handleLikeToggle} />
          )}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.centered}>
              <Text style={styles.emptyText}>{emptyMessage}</Text>
            </View>
          }
        />
      );
    }

    return (
      <FlatList
        data={galleryRows}
        keyExtractor={(item) => item.key}
        renderItem={renderGalleryItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          galleryLoading ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" />
            </View>
          ) : (
            <View style={styles.centered}>
              <Text style={styles.emptyText}>게시물이 없습니다.</Text>
            </View>
          )
        }
      />
    );
  };

  return (
    <View style={styles.container}>
      {searchBar}
      {tagBreadcrumb}
      {renderContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  searchSection: {
    backgroundColor: '#fff',
    paddingTop: 72,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    paddingHorizontal: 10,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
    gap: 4,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1a1a1a',
  },
  filterRow: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  filterButtonActive: {
    backgroundColor: '#1a1a1a',
    borderColor: '#1a1a1a',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666',
  },
  filterTextActive: {
    color: '#fff',
  },
  tagBreadcrumb: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#f8f8f8',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    gap: 4,
  },
  tagBreadcrumbText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#007AFF',
  },
  tagItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tagIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f7ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  tagItemText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  userAvatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userAvatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  userNickname: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  userUsername: {
    fontSize: 14,
    color: '#999',
    marginTop: 1,
  },
  monthHeader: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 10,
  },
  monthHeaderText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  gridRow: {
    flexDirection: 'row',
    marginBottom: GRID_GAP,
  },
  gridTile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    position: 'relative',
    overflow: 'hidden',
  },
  gridImage: {
    width: TILE_SIZE,
    height: TILE_SIZE,
  },
  textTile: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    padding: 10,
    justifyContent: 'space-between',
  },
  textTileContent: {
    fontSize: 12,
    lineHeight: 17,
    color: '#333',
  },
  textTileAuthor: {
    fontSize: 10,
    color: '#999',
    marginTop: 4,
  },
  multiMediaBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
  videoBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});
