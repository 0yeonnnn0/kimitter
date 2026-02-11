import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as userService from '../../src/services/userService';
import { getFileUrl } from '../../src/config/constants';
import type { User } from '../../src/types/models';
import ProfileTabs from '../../src/components/ProfileTabs';
import ImageViewerModal from '../../src/components/ImageViewerModal';

export default function UserProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);

  const loadUser = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await userService.getUser(Number(userId));
      setUser(res.data.data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>유저를 찾을 수 없습니다.</Text>
      </View>
    );
  }

  const profileHeader = (
    <View style={styles.profileSection}>
      <View style={styles.profileRow}>
        <View style={styles.profileInfo}>
          <Text style={styles.nickname}>{user.nickname}</Text>
          <Text style={styles.username}>@{user.username}</Text>
          {user.bio ? <Text style={styles.bio}>{user.bio}</Text> : null}
        </View>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setImageViewerVisible(true)}
        >
          {user.profileImageUrl ? (
            <Image source={{ uri: getFileUrl(user.profileImageUrl) }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={36} color="#999" />
            </View>
          )}
        </TouchableOpacity>
      </View>
      {user.role === 'ADMIN' ? (
        <View style={styles.badgeRow}>
          <View style={styles.adminBadge}>
            <Text style={styles.adminBadgeText}>관리자</Text>
          </View>
        </View>
      ) : null}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{user.nickname}</Text>
        <View style={styles.backButton} />
      </View>

      <ProfileTabs userId={user.id} headerComponent={profileHeader} />

      <ImageViewerModal
        visible={imageViewerVisible}
        imageUrl={user.profileImageUrl ? getFileUrl(user.profileImageUrl) : undefined}
        onClose={() => setImageViewerVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  errorText: {
    fontSize: 16,
    color: '#999',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 72,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  backButton: {
    width: 32,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  profileSection: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  profileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  profileInfo: {
    flex: 1,
    marginRight: 16,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  avatarPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#e8e8e8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nickname: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  username: {
    fontSize: 15,
    color: '#999',
  },
  bio: {
    fontSize: 15,
    color: '#333',
    marginTop: 10,
    lineHeight: 21,
  },
  badgeRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  adminBadge: {
    backgroundColor: '#ff9500',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  adminBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});
