import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import BottomSheet from './BottomSheet';
import * as postService from '../services/postService';
import { useFeedStore } from '../stores/feedStore';
import { usePostActionStore } from '../stores/postActionStore';

export default function PostActionSheet() {
  const router = useRouter();
  const { removePost, fetchPosts } = useFeedStore();
  const { visible, post, isLiked, isOwner, onLikeToggle, close } = usePostActionStore();

  if (!post) return null;

  const handleLike = () => {
    onLikeToggle?.();
    close();
  };

  const handleComment = () => {
    close();
    router.push(`/${post.id}`);
  };

  const handleDelete = () => {
    const postId = post.id;
    close();
    Alert.alert('게시물 삭제', '정말 이 게시물을 삭제하시겠어요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            await postService.deletePost(postId);
            removePost(postId);
            await fetchPosts(true);
          } catch {
            Alert.alert('오류', '게시물 삭제에 실패했습니다.');
          }
        },
      },
    ]);
  };

  return (
    <BottomSheet visible={visible} onClose={close}>
      <View style={styles.container}>
        <TouchableOpacity style={styles.item} onPress={handleLike}>
          <Ionicons
            name={isLiked ? 'heart' : 'heart-outline'}
            size={22}
            color={isLiked ? '#ff3b30' : '#1a1a1a'}
          />
          <Text style={styles.itemText}>
            {isLiked ? '좋아요 취소' : '좋아요'}
          </Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity style={styles.item} onPress={handleComment}>
          <Ionicons name="chatbubble-outline" size={22} color="#1a1a1a" />
          <Text style={styles.itemText}>댓글 달기</Text>
        </TouchableOpacity>

        {isOwner ? (
          <>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.item} onPress={handleDelete}>
              <Ionicons name="trash-outline" size={22} color="#ff3b30" />
              <Text style={[styles.itemText, styles.deleteText]}>삭제</Text>
            </TouchableOpacity>
          </>
        ) : null}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 32,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 12,
  },
  itemText: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  deleteText: {
    color: '#ff3b30',
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
  },
});
