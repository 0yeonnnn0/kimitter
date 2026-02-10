import { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/stores/authStore';
import { getFileUrl } from '../../src/config/constants';
import ProfileTabs from '../../src/components/ProfileTabs';
import EditProfileModal from '../../src/components/EditProfileModal';
import InviteModal from '../../src/components/InviteModal';

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const [loggingOut, setLoggingOut] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [inviteModalVisible, setInviteModalVisible] = useState(false);

  const handleLogout = () => {
    Alert.alert('로그아웃', '정말 로그아웃하시겠어요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '로그아웃',
        style: 'destructive',
        onPress: async () => {
          setLoggingOut(true);
          try {
            await logout();
          } finally {
            setLoggingOut(false);
          }
        },
      },
    ]);
  };

  if (!user) return null;

  const profileHeader = (
    <View style={styles.profileSection}>
      <View style={styles.profileRow}>
        <View style={styles.profileInfo}>
          <Text style={styles.nickname}>{user.nickname}</Text>
          <Text style={styles.username}>@{user.username}</Text>
          {user.bio ? <Text style={styles.bio}>{user.bio}</Text> : null}
        </View>
        {user.profileImageUrl ? (
          <Image source={{ uri: getFileUrl(user.profileImageUrl) }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>{user.nickname[0]}</Text>
          </View>
        )}
      </View>
      {user.role === 'ADMIN' ? (
        <View style={styles.badgeRow}>
          <View style={styles.adminBadge}>
            <Text style={styles.adminBadgeText}>관리자</Text>
          </View>
        </View>
      ) : null}
      {user.role === 'ADMIN' ? (
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.editButton, styles.buttonHalf]}
            onPress={() => setEditModalVisible(true)}
          >
            <Text style={styles.editButtonText}>프로필 편집</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.editButton, styles.buttonHalf]}
            onPress={() => setInviteModalVisible(true)}
          >
            <Text style={styles.editButtonText}>유저 초대하기</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={styles.editButton} onPress={() => setEditModalVisible(true)}>
          <Text style={styles.editButtonText}>프로필 편집</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerSide} />
        <Text style={styles.headerTitle}>{user.nickname}</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.headerSide} disabled={loggingOut}>
          {loggingOut ? (
            <ActivityIndicator size="small" color="#ff3b30" />
          ) : (
            <Ionicons name="log-out-outline" size={24} color="#ff3b30" />
          )}
        </TouchableOpacity>
      </View>

      <ProfileTabs userId={user.id} headerComponent={profileHeader} />

      <EditProfileModal
        visible={editModalVisible}
        user={user}
        onClose={() => setEditModalVisible(false)}
        onSaved={() => {}}
      />

      {user.role === 'ADMIN' ? (
        <InviteModal
          visible={inviteModalVisible}
          onClose={() => setInviteModalVisible(false)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 56,
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  headerSide: {
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
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
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
  buttonRow: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 8,
  },
  buttonHalf: {
    flex: 1,
    marginTop: 0,
  },
  editButton: {
    marginTop: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
});
