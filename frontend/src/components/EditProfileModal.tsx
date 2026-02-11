import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import type { User } from '../types/models';
import { getFileUrl } from '../config/constants';
import * as userService from '../services/userService';
import { useAuthStore } from '../stores/authStore';
import BottomSheet from './BottomSheet';

interface EditProfileModalProps {
  visible: boolean;
  user: User;
  onClose: () => void;
  onSaved: () => void;
}

export default function EditProfileModal({ visible, user, onClose, onSaved }: EditProfileModalProps) {
  const { setUser } = useAuthStore();

  const [nickname, setNickname] = useState(user.nickname);
  const [username, setUsername] = useState(user.username);
  const [bio, setBio] = useState(user.bio ?? '');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setNickname(user.nickname);
      setUsername(user.username);
      setBio(user.bio ?? '');
      setImageUri(null);
    }
  }, [visible, user]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!nickname.trim()) {
      Alert.alert('오류', '이름을 입력해주세요.');
      return;
    }
    if (!username.trim()) {
      Alert.alert('오류', '아이디를 입력해주세요.');
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('nickname', nickname.trim());
      formData.append('username', username.trim());
      formData.append('bio', bio.trim());

      if (imageUri) {
        const filename = imageUri.split('/').pop() ?? 'profile.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const ext = match ? match[1] : 'jpg';
        formData.append('profileImage', {
          uri: imageUri,
          name: `profile_${Date.now()}.${ext}`,
          type: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
        } as unknown as Blob);
      }

      const { data } = await userService.updateMe(formData);
      await setUser(data.data);
      onSaved();
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '프로필 수정에 실패했습니다.';
      Alert.alert('오류', message);
    } finally {
      setSaving(false);
    }
  };

  const currentImageUrl = imageUri ?? (user.profileImageUrl ? getFileUrl(user.profileImageUrl) : null);

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.cancelText}>취소</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>프로필 편집</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color="#000" />
          ) : (
            <Text style={styles.saveText}>완료</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <TouchableOpacity style={styles.avatarSection} onPress={pickImage}>
          {currentImageUrl ? (
            <Image source={{ uri: currentImageUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={44} color="#999" />
            </View>
          )}
          <View style={styles.cameraIcon}>
            <Ionicons name="camera" size={14} color="#fff" />
          </View>
        </TouchableOpacity>

        <View style={styles.field}>
          <Text style={styles.label}>이름</Text>
          <TextInput
            style={styles.input}
            value={nickname}
            onChangeText={setNickname}
            placeholder="이름을 입력하세요"
            maxLength={20}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>아이디</Text>
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            placeholder="아이디를 입력하세요"
            autoCapitalize="none"
            maxLength={30}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>소개</Text>
          <TextInput
            style={[styles.input, styles.bioInput]}
            value={bio}
            onChangeText={setBio}
            placeholder="한줄 소개를 입력하세요"
            multiline
            maxLength={200}
          />
        </View>
      </View>
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
  saveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 40,
  },
  avatarSection: {
    alignSelf: 'center',
    marginBottom: 28,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
  },
  avatarPlaceholder: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#e8e8e8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraIcon: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#999',
    marginBottom: 6,
  },
  input: {
    fontSize: 16,
    color: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingVertical: 8,
  },
  bioInput: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
});
