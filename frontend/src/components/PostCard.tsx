import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { Post } from '../types/models';
import { getFileUrl } from '../config/constants';
import { useAuthStore } from '../stores/authStore';
import { usePostActionStore } from '../stores/postActionStore';
import MediaGallery from './MediaGallery';
import BotBadge from './BotBadge';
import MarkdownText from './MarkdownText';

interface PostCardProps {
  post: Post;
  onLikeToggle?: (postId: number, liked: boolean) => void;
  isLiked?: boolean;
}

const AVATAR_SIZE = 40;
const AVATAR_GAP = 8;
const AVATAR_COL = AVATAR_SIZE + AVATAR_GAP;
const SIDE_PADDING = 12;

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

export default function PostCard({ post, onLikeToggle, isLiked = false }: PostCardProps) {
  const router = useRouter();
  const currentUserId = useAuthStore((s) => s.user?.id);
  const currentUserRole = useAuthStore((s) => s.user?.role);
  const openAction = usePostActionStore((s) => s.open);

  const handleLike = () => {
    onLikeToggle?.(post.id, !isLiked);
  };

  const navigateToDetail = () => {
    router.push(`/${post.id}`);
  };

  const navigateToProfile = () => {
    router.push(`/user/${post.user.id}`);
  };

  const handleMore = () => {
    openAction({
      post,
      isLiked,
      isOwner: currentUserId === post.user.id || currentUserRole === 'ADMIN',
      onLikeToggle: handleLike,
    });
  };

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.avatarCol}>
          <TouchableOpacity activeOpacity={0.7} onPress={navigateToProfile}>
            {post.user.profileImageUrl ? (
              <Image source={{ uri: getFileUrl(post.user.profileImageUrl) }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={20} color="#999" />
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.contentCol}>
          <TouchableOpacity activeOpacity={1} onPress={navigateToDetail} style={styles.headerRow}>
            <TouchableOpacity activeOpacity={0.7} onPress={navigateToProfile}>
              <Text style={styles.nickname}>{post.user.nickname}</Text>
            </TouchableOpacity>
            {post.user.role === 'BOT' ? <BotBadge /> : null}
            <Text style={styles.date}>{formatDate(post.createdAt)}</Text>
            <View style={styles.headerSpacer} />
            <TouchableOpacity
              style={styles.moreButton}
              onPress={handleMore}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="ellipsis-horizontal" size={20} color="#999" />
            </TouchableOpacity>
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.7} onPress={navigateToDetail}>
            {post.content ? <MarkdownText content={post.content} fontSize={15} /> : null}
          </TouchableOpacity>
        </View>
      </View>

      <MediaGallery media={post.media} paddingLeft={SIDE_PADDING + AVATAR_COL} onPressBackground={navigateToDetail} />

      <View style={styles.belowAvatar}>
        {post.tags.length > 0 ? (
          <TouchableOpacity activeOpacity={1} onPress={navigateToDetail} style={styles.tags}>
            {post.tags.map(({ tag }) => (
              <Text key={tag.id} style={styles.tag}>
                #{tag.name}
              </Text>
            ))}
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity activeOpacity={1} onPress={navigateToDetail} style={styles.actions}>
          <TouchableOpacity activeOpacity={0.7} style={styles.actionButton} onPress={handleLike}>
            <Ionicons
              name={isLiked ? 'heart' : 'heart-outline'}
              size={22}
              color={isLiked ? '#ff3b30' : '#333'}
            />
            <Text style={styles.actionCount}>{post._count.likes}</Text>
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.7} style={styles.actionButton} onPress={navigateToDetail}>
            <Ionicons name="chatbubble-outline" size={20} color="#333" />
            <Text style={styles.actionCount}>{post._count.comments}</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  row: {
    flexDirection: 'row',
    paddingHorizontal: SIDE_PADDING,
    paddingTop: 14,
  },
  avatarCol: {
    width: AVATAR_COL,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
  },
  avatarPlaceholder: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: '#e8e8e8',
    alignItems: 'center',
    justifyContent: 'center',
  },

  contentCol: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  headerSpacer: {
    flex: 1,
  },
  nickname: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  date: {
    fontSize: 13,
    color: '#999',
  },
  moreButton: {
    padding: 4,
  },
  content: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
    paddingBottom: 8,
  },
  belowAvatar: {
    paddingLeft: SIDE_PADDING + AVATAR_COL,
    paddingRight: SIDE_PADDING,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingTop: 8,
    gap: 6,
  },
  tag: {
    color: '#007AFF',
    fontSize: 13,
  },
  actions: {
    flexDirection: 'row',
    paddingVertical: 12,
    gap: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionCount: {
    fontSize: 14,
    color: '#666',
  },
});
