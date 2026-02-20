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
  ActivityIndicator,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { searchUsers } from '../services/userService';
import { getFileUrl } from '../config/constants';
import { useFeedStore } from '../stores/feedStore';
import type { User } from '../types/models';

const SIDEBAR_WIDTH = 300;

interface HomeSidebarProps {
  visible: boolean;
  onClose: () => void;
}

export default function HomeSidebar({ visible, onClose }: HomeSidebarProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const showBotPosts = useFeedStore((s) => s.showBotPosts);
  const toggleShowBotPosts = useFeedStore((s) => s.toggleShowBotPosts);
  const translateX = useRef(new Animated.Value(SIDEBAR_WIDTH)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

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

      fetchUsers();
    }
  }, [visible]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await searchUsers('');
      setUsers(res.data.data);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
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

  const handleUserPress = (userId: number) => {
    animateClose();
    setTimeout(() => {
      router.push(`/user/${userId}`);
    }, 300);
  };

  if (!mounted) return null;

  const renderUserItem = ({ item }: { item: User }) => (
    <TouchableOpacity
      style={styles.userCard}
      activeOpacity={0.7}
      onPress={() => handleUserPress(item.id)}
    >
      {item.profileImageUrl ? (
        <Image source={{ uri: getFileUrl(item.profileImageUrl) }} style={styles.userAvatar} />
      ) : (
        <View style={styles.userAvatarPlaceholder}>
          <Ionicons name="person" size={22} color="#999" />
        </View>
      )}
      <View style={styles.userInfo}>
        <Text style={styles.userNickname} numberOfLines={1}>{item.nickname}</Text>
        <Text style={styles.userUsername}>@{item.username}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#ccc" />
    </TouchableOpacity>
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
          <Text style={styles.sidebarTitle}>멤버</Text>
          <TouchableOpacity onPress={animateClose}>
            <Ionicons name="close" size={24} color="#1a1a1a" />
          </TouchableOpacity>
        </View>

        <View style={styles.toggleRow}>
          <View style={styles.toggleLabel}>
            <Ionicons name="hardware-chip-outline" size={20} color="#1a1a1a" />
            <Text style={styles.toggleText}>봇 글 보기</Text>
          </View>
          <Switch
            value={showBotPosts}
            onValueChange={toggleShowBotPosts}
            trackColor={{ false: '#e0e0e0', true: '#1a1a1a' }}
            thumbColor="#fff"
          />
        </View>

        <Text style={styles.sectionLabel}>유저별 게시글 보기</Text>

        {loading ? (
          <ActivityIndicator style={styles.loader} size="small" color="#999" />
        ) : (
          <FlatList
            data={users}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderUserItem}
            style={styles.userList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <Text style={styles.emptyText}>유저가 없습니다.</Text>
            }
          />
        )}
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
    marginBottom: 20,
  },
  sidebarTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    marginBottom: 20,
  },
  toggleLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  toggleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#999',
    marginBottom: 12,
    letterSpacing: 0.3,
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
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  userAvatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#e8e8e8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userNickname: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  userUsername: {
    fontSize: 13,
    color: '#999',
    marginTop: 2,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 40,
  },
});
