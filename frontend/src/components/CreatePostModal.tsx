import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
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
import * as notificationService from '../services/notificationService';
import BottomSheet from './BottomSheet';

type Mode = 'post' | 'notify';

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
  const [mode, setMode] = useState<Mode>('post');
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [content, setContent] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [media, setMedia] = useState<PickedMedia[]>([]);
  const [loading, setLoading] = useState(false);
  const { fetchPosts } = useFeedStore();
  const router = useRouter();

  const resetForm = () => {
    setContent('');
    setTagInput('');
    setTags([]);
    setMedia([]);
    setMode('post');
    setDropdownVisible(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const selectMode = (newMode: Mode) => {
    if (newMode !== mode) {
      setContent('');
      setTagInput('');
      setTags([]);
      setMedia([]);
    }
    setMode(newMode);
    setDropdownVisible(false);
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

  const handleSubmitPost = async () => {
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
      await postService.createPost(formData);
      resetForm();
      onClose();
      router.replace('/(tabs)');
      await fetchPosts(true);
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

  const handleSubmitNotification = async () => {
    if (!content.trim()) {
      Alert.alert('오류', '알림 내용을 입력해주세요.');
      return;
    }
    setLoading(true);
    try {
      await notificationService.broadcastNotification(content.trim());
      Alert.alert('완료', '모든 가족에게 알림을 보냈습니다.');
      resetForm();
      onClose();
    } catch (err: unknown) {
      let message = '알림 전송에 실패했습니다.';
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

  const handleSubmit = () => {
    if (mode === 'post') {
      handleSubmitPost();
    } else {
      handleSubmitNotification();
    }
  };

  return (
    <BottomSheet visible={visible} onClose={handleClose} fullScreen>
      <View style={styles.headerWrapper}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose}>
            <Text style={styles.cancelText}>취소</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.titleDropdown}
            onPress={() => setDropdownVisible(!dropdownVisible)}
          >
            <Text style={styles.headerTitle}>
              {mode === 'post' ? '새 글 쓰기' : '알림 보내기'}
            </Text>
            <Ionicons name="chevron-down" size={16} color="#1a1a1a" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.submitButtonText}>
                {mode === 'post' ? '게시' : '보내기'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {dropdownVisible ? (
          <View style={styles.dropdownMenu}>
            <TouchableOpacity
              style={[
                styles.dropdownItem,
                mode === 'post' && styles.dropdownItemActive,
              ]}
              onPress={() => selectMode('post')}
            >
              <Ionicons name="create-outline" size={20} color={mode === 'post' ? '#000' : '#666'} />
              <Text style={[
                styles.dropdownText,
                mode === 'post' && styles.dropdownTextActive,
              ]}>
                새 글 쓰기
              </Text>
              {mode === 'post' ? (
                <Ionicons name="checkmark" size={18} color="#000" />
              ) : null}
            </TouchableOpacity>
            <View style={styles.dropdownDivider} />
            <TouchableOpacity
              style={[
                styles.dropdownItem,
                mode === 'notify' && styles.dropdownItemActive,
              ]}
              onPress={() => selectMode('notify')}
            >
              <Ionicons name="notifications-outline" size={20} color={mode === 'notify' ? '#000' : '#666'} />
              <Text style={[
                styles.dropdownText,
                mode === 'notify' && styles.dropdownTextActive,
              ]}>
                알림 보내기
              </Text>
              {mode === 'notify' ? (
                <Ionicons name="checkmark" size={18} color="#000" />
              ) : null}
            </TouchableOpacity>
          </View>
        ) : null}
      </View>

      <Pressable style={styles.body} onPress={() => setDropdownVisible(false)}>
      <ScrollView style={styles.bodyScroll} keyboardShouldPersistTaps="handled">
        {mode === 'post' ? (
          <>
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
          </>
        ) : (
          <View style={styles.notifyBody}>
            <TextInput
              style={styles.notifyInput}
              placeholder="모두에게 알림을 보낼 수 있습니다"
              value={content}
              onChangeText={setContent}
              multiline
              maxLength={80}
            />
            <Text style={styles.charCount}>{content.length}/80</Text>
          </View>
        )}
      </ScrollView>
      </Pressable>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  headerWrapper: {
    zIndex: 10,
  },
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
    backgroundColor: '#000',
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
  bodyScroll: {
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
    backgroundColor: '#000',
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
  titleDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  notifyBody: {
    padding: 16,
  },
  notifyInput: {
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
    color: '#1a1a1a',
  },
  charCount: {
    textAlign: 'right',
    fontSize: 13,
    color: '#999',
    marginTop: 8,
  },
  dropdownMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    paddingVertical: 4,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  dropdownItemActive: {
    backgroundColor: '#f5f5f5',
  },
  dropdownText: {
    fontSize: 15,
    color: '#666',
    flex: 1,
  },
  dropdownTextActive: {
    color: '#000',
    fontWeight: '600',
  },
  dropdownDivider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginHorizontal: 16,
  },
});
