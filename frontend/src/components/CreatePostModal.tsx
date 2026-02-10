import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFeedStore } from '../stores/feedStore';
import * as postService from '../services/postService';
import BottomSheet from './BottomSheet';

interface PickedMedia {
  uri: string;
  type: 'image' | 'video';
  fileName: string;
}

interface CreatePostModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function CreatePostModal({ visible, onClose }: CreatePostModalProps) {
  const [content, setContent] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [media, setMedia] = useState<PickedMedia[]>([]);
  const [loading, setLoading] = useState(false);
  const { addPost } = useFeedStore();
  const router = useRouter();

  const resetForm = () => {
    setContent('');
    setTagInput('');
    setTags([]);
    setMedia([]);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const pickMedia = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      const picked: PickedMedia[] = await Promise.all(
        result.assets.map(async (a, index) => {
          if (a.type === 'video') {
            return {
              uri: a.uri,
              type: 'video' as const,
              fileName: `video_${Date.now()}_${index}.mp4`,
            };
          }
          const compressed = await ImageManipulator.manipulateAsync(
            a.uri,
            [{ resize: { width: 1920 } }],
            { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG },
          );
          return {
            uri: compressed.uri,
            type: 'image' as const,
            fileName: `image_${Date.now()}_${index}.jpg`,
          };
        }),
      );
      setMedia((prev) => [...prev, ...picked].slice(0, 10));
    }
  };

  const addTag = () => {
    const trimmed = tagInput.trim().replace(/^#/, '');
    if (trimmed && !tags.includes(trimmed)) {
      setTags((prev) => [...prev, trimmed]);
    }
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  };

  const removeMedia = (uri: string) => {
    setMedia((prev) => prev.filter((m) => m.uri !== uri));
  };

  const handleSubmit = async () => {
    if (!content.trim() && media.length === 0) {
      Alert.alert('오류', '내용이나 미디어를 추가해주세요.');
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('content', content.trim());
      if (tags.length > 0) {
        formData.append('tags', JSON.stringify(tags));
      }
      media.forEach((m, index) => {
        const fileExtension = m.type === 'video' ? 'mp4' : 'jpg';
        const mimeType = m.type === 'video' ? 'video/mp4' : 'image/jpeg';
        formData.append('media', {
          uri: m.uri,
          type: mimeType,
          name: m.fileName || `upload_${Date.now()}_${index}.${fileExtension}`,
        } as unknown as Blob);
      });
      const { data } = await postService.createPost(formData);
      addPost(data.data);
      resetForm();
      onClose();
      router.replace('/(tabs)');
    } catch (err: unknown) {
      let message = '게시물 작성에 실패했습니다.';
      if (err instanceof Error) {
        message = err.message;
      }
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        if (axiosErr.response?.data?.message) {
          message = axiosErr.response.data.message;
        }
      }
      Alert.alert('오류', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <BottomSheet visible={visible} onClose={handleClose} fullScreen>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose}>
          <Text style={styles.cancelText}>취소</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>새 스레드</Text>
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.submitButtonText}>게시</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.body} keyboardShouldPersistTaps="handled">
        <TextInput
          style={styles.contentInput}
          placeholder="무슨 생각을 하고 계세요?"
          value={content}
          onChangeText={setContent}
          multiline
          maxLength={2000}
        />

        {media.length > 0 ? (
          <ScrollView horizontal style={styles.mediaRow} showsHorizontalScrollIndicator={false}>
            {media.map((m) => (
              <View key={m.uri} style={styles.mediaThumb}>
                <Image source={{ uri: m.uri }} style={styles.mediaImage} />
                <TouchableOpacity
                  style={styles.mediaRemove}
                  onPress={() => removeMedia(m.uri)}
                >
                  <Ionicons name="close" size={12} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        ) : null}

        <TouchableOpacity style={styles.mediaButton} onPress={pickMedia}>
          <Ionicons name="camera-outline" size={20} color="#666" />
          <Text style={styles.mediaButtonText}>사진/동영상 추가</Text>
        </TouchableOpacity>

        <View style={styles.tagSection}>
          <View style={styles.tagInputRow}>
            <TextInput
              style={styles.tagInput}
              placeholder="#태그 추가"
              value={tagInput}
              onChangeText={setTagInput}
              onSubmitEditing={addTag}
              returnKeyType="done"
            />
            <TouchableOpacity style={styles.tagAddButton} onPress={addTag}>
              <Text style={styles.tagAddButtonText}>추가</Text>
            </TouchableOpacity>
          </View>
          {tags.length > 0 ? (
            <View style={styles.tagList}>
              {tags.map((tag) => (
                <TouchableOpacity
                  key={tag}
                  style={styles.tagChip}
                  onPress={() => removeTag(tag)}
                >
                  <Text style={styles.tagChipText}>#{tag} ✕</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}
        </View>
      </ScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  cancelText: {
    fontSize: 16,
    color: '#999',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  body: {
    flex: 1,
  },
  contentInput: {
    padding: 16,
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
    color: '#1a1a1a',
  },
  mediaRow: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  mediaThumb: {
    width: 90,
    height: 90,
    marginRight: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  mediaImage: {
    width: '100%',
    height: '100%',
  },
  mediaRemove: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaButton: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 8,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  mediaButtonText: {
    color: '#666',
    fontSize: 15,
  },
  tagSection: {
    padding: 16,
  },
  tagInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tagInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  tagAddButton: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagAddButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  tagList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
    gap: 6,
  },
  tagChip: {
    backgroundColor: '#f0f7ff',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tagChipText: {
    color: '#007AFF',
    fontSize: 13,
  },
});
