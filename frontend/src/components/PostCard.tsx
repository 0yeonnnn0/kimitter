import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import type { Post } from '../types/models';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface PostCardProps {
  post: Post;
  onLikeToggle?: (postId: number, liked: boolean) => void;
  isLiked?: boolean;
}

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

  const handleLike = async () => {
    try {
      onLikeToggle?.(post.id, !isLiked);
    } catch {
      onLikeToggle?.(post.id, isLiked);
    }
  };

  const firstMedia = post.media[0];

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.95}
      onPress={() => router.push(`/${post.id}`)}
    >
      <View style={styles.header}>
        {post.user.profileImageUrl ? (
          <Image source={{ uri: post.user.profileImageUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>{post.user.nickname[0]}</Text>
          </View>
        )}
        <View style={styles.headerInfo}>
          <Text style={styles.nickname}>{post.user.nickname}</Text>
          <Text style={styles.date}>{formatDate(post.createdAt)}</Text>
        </View>
      </View>

      {post.content ? <Text style={styles.content}>{post.content}</Text> : null}

      {firstMedia ? (
        <Image
          source={{ uri: firstMedia.fileUrl }}
          style={styles.media}
          resizeMode="cover"
        />
      ) : null}

      {post.tags.length > 0 ? (
        <View style={styles.tags}>
          {post.tags.map(({ tag }) => (
            <Text key={tag.id} style={styles.tag}>
              #{tag.name}
            </Text>
          ))}
        </View>
      ) : null}

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
          <Text style={styles.actionIcon}>{isLiked ? '❤️' : '🤍'}</Text>
          <Text style={styles.actionCount}>{post._count.likes}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push(`/${post.id}`)}
        >
          <Text style={styles.actionIcon}>💬</Text>
          <Text style={styles.actionCount}>{post._count.comments}</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerInfo: {
    flex: 1,
  },
  nickname: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  date: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  content: {
    fontSize: 15,
    color: '#333',
    paddingHorizontal: 16,
    paddingBottom: 10,
    lineHeight: 22,
  },
  media: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
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
    fontSize: 13,
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionIcon: {
    fontSize: 18,
  },
  actionCount: {
    fontSize: 14,
    color: '#666',
  },
});
