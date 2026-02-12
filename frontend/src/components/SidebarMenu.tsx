import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Animated,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../stores/authStore';
import { getAllUsers } from '../services/adminService';
import { getFileUrl } from '../config/constants';
import type { User } from '../types/models';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SIDEBAR_WIDTH = 300;

interface SidebarMenuProps {
  visible: boolean;
  onClose: () => void;
  user: User;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}.${m}.${day}`;
}

export default function SidebarMenu({ visible, onClose, user }: SidebarMenuProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { logout } = useAuthStore();
  const translateX = useRef(new Animated.Value(SIDEBAR_WIDTH)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.parallel([
        Animated.spring(translateX, {
          toValue: 0,
          damping: 25,
          stiffness: 200,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();

      if (user.role === 'ADMIN') {
        fetchUsers();
      }
    }
  }, [visible]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await getAllUsers();
      setUsers(res.data.data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '유저 목록을 불러올 수 없습니다.';
      Alert.alert('오류', message);
    } finally {
      setLoadingUsers(false);
    }
  };

  const animateClose = () => {
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: SIDEBAR_WIDTH,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setMounted(false);
      onClose();
    });
  };

  const handleLogout = () => {
    animateClose();
    setTimeout(() => {
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
    }, 300);
  };

  const handleChangePassword = () => {
    animateClose();
    setTimeout(() => {
      router.push('/change-password');
    }, 300);
  };

  if (!mounted) return null;

  const renderUserItem = ({ item }: { item: User }) => (
    <View style={styles.userCard}>
      {item.profileImageUrl ? (
        <Image source={{ uri: getFileUrl(item.profileImageUrl) }} style={styles.userAvatar} />
      ) : (
        <View style={styles.userAvatarPlaceholder}>
          <Ionicons name="person" size={20} color="#999" />
        </View>
      )}
      <View style={styles.userInfo}>
        <View style={styles.userNameRow}>
          <Text style={styles.userNickname} numberOfLines={1}>{item.nickname}</Text>
          {item.role === 'ADMIN' ? (
            <View style={styles.adminBadge}>
              <Text style={styles.adminBadgeText}>관리자</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.userUsername}>@{item.username}</Text>
        <Text style={styles.userDate}>가입일: {formatDate(item.createdAt)}</Text>
      </View>
    </View>
  );

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={animateClose} />
      </Animated.View>

      <Animated.View
        style={[
          styles.sidebar,
          {
            transform: [{ translateX }],
            paddingTop: insets.top + 16,
            paddingBottom: insets.bottom + 16,
          },
        ]}
      >
        <View style={styles.sidebarHeader}>
          <Text style={styles.sidebarTitle}>설정</Text>
          <TouchableOpacity onPress={animateClose}>
            <Ionicons name="close" size={24} color="#1a1a1a" />
          </TouchableOpacity>
        </View>

        {user.role === 'ADMIN' ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>모든 유저</Text>
            {loadingUsers ? (
              <ActivityIndicator style={styles.loader} size="small" color="#999" />
            ) : (
              <FlatList
                data={users}
                keyExtractor={(item) => String(item.id)}
                renderItem={renderUserItem}
                style={styles.userList}
                scrollEnabled={true}
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>
        ) : <View style={styles.spacer} />}

        <View style={styles.menuSection}>
          <TouchableOpacity style={styles.menuItem} onPress={handleChangePassword}>
            <Ionicons name="lock-closed-outline" size={22} color="#1a1a1a" />
            <Text style={styles.menuText}>비밀번호 변경</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleLogout} disabled={loggingOut}>
            {loggingOut ? (
              <ActivityIndicator size="small" color="#ff3b30" />
            ) : (
              <Ionicons name="log-out-outline" size={22} color="#ff3b30" />
            )}
            <Text style={[styles.menuText, styles.logoutText]}>로그아웃</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: SIDEBAR_WIDTH,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 20,
    paddingHorizontal: 16,
  },
  sidebarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  sidebarTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  section: {
    flex: 1,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  loader: {
    marginTop: 20,
  },
  userList: {
    flex: 1,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  userAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e8e8e8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userNickname: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    flexShrink: 1,
  },
  adminBadge: {
    backgroundColor: '#ff9500',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  adminBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  userUsername: {
    fontSize: 13,
    color: '#999',
    marginTop: 1,
  },
  userDate: {
    fontSize: 11,
    color: '#bbb',
    marginTop: 2,
  },
  spacer: {
    flex: 1,
  },
  menuSection: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
  },
  menuText: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  logoutText: {
    color: '#ff3b30',
  },
});
