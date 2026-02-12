import { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getFileUrl } from '../../src/config/constants';
import { useRouter } from 'expo-router';
import { useNotificationStore } from '../../src/stores/notificationStore';
import type { Notification } from '../../src/types/models';

type ActivityTab = 'activity' | 'notification';

const ACTIVITY_TYPES: Notification['notificationType'][] = [
  'COMMENT', 'REPLY', 'LIKE', 'POST_MENTION',
];

const NOTIFICATION_LABELS: Record<Notification['notificationType'], string> = {
  POST_MENTION: '회원님을 멘션했습니다',
  COMMENT: '댓글을 달았습니다',
  REPLY: '답글을 달았습니다',
  LIKE: '좋아요를 눌렀습니다',
  CUSTOM: '',
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return '방금 전';
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}시간 전`;
  return new Date(dateStr).toLocaleDateString('ko-KR');
}

export default function ActivityScreen() {
  const { notifications, unreadCount, fetchNotifications, markRead, markAllRead } =
    useNotificationStore();

  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<ActivityTab>('activity');

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchNotifications();
    } finally {
      setRefreshing(false);
    }
  }, [fetchNotifications]);

  const router = useRouter();

  const handlePress = (notification: Notification) => {
    if (!notification.isRead) {
      markRead(notification.id);
    }
    if (notification.postId) {
      router.push(`/${notification.postId}`);
    }
  };

  const activityItems = notifications.filter((n) =>
    ACTIVITY_TYPES.includes(n.notificationType),
  );
  const notificationItems = notifications.filter((n) =>
    n.notificationType === 'CUSTOM',
  );

  const currentData = activeTab === 'activity' ? activityItems : notificationItems;
  const activityUnread = activityItems.filter((n) => !n.isRead).length;
  const notificationUnread = notificationItems.filter((n) => !n.isRead).length;

  const renderActivityItem = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[styles.item, !item.isRead && styles.itemUnread]}
      onPress={() => handlePress(item)}
    >
      {item.sender.profileImageUrl ? (
        <Image
          source={{ uri: getFileUrl(item.sender.profileImageUrl) }}
          style={styles.itemAvatarImage}
        />
      ) : (
        <View style={styles.itemAvatar}>
          <Ionicons name="person" size={20} color="#999" />
        </View>
      )}
      <View style={styles.itemBody}>
        <Text style={styles.itemText}>
          <Text style={styles.itemNickname}>{item.sender.nickname}</Text>
          {' '}
          {NOTIFICATION_LABELS[item.notificationType]}
        </Text>
        {item.message ? (
          <Text style={styles.itemMessage} numberOfLines={1}>
            {item.message}
          </Text>
        ) : null}
        <Text style={styles.itemDate}>{formatDate(item.createdAt)}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderNotificationItem = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[styles.item, !item.isRead && styles.itemUnread]}
      onPress={() => handlePress(item)}
    >
      {item.sender.profileImageUrl ? (
        <Image
          source={{ uri: getFileUrl(item.sender.profileImageUrl) }}
          style={styles.itemAvatarImage}
        />
      ) : (
        <View style={styles.itemAvatar}>
          <Ionicons name="notifications" size={20} color="#999" />
        </View>
      )}
      <View style={styles.itemBody}>
        <Text style={styles.itemNickname}>{item.sender.nickname}</Text>
        {item.message ? (
          <Text style={styles.itemText}>{item.message}</Text>
        ) : null}
        <Text style={styles.itemDate}>{formatDate(item.createdAt)}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>활동</Text>
        {unreadCount > 0 ? (
          <TouchableOpacity onPress={markAllRead}>
            <Text style={styles.readAllButton}>모두 읽음</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'activity' && styles.tabActive]}
          onPress={() => setActiveTab('activity')}
        >
          <Text style={[styles.tabText, activeTab === 'activity' && styles.tabTextActive]}>
            활동
          </Text>
          {activityUnread > 0 ? (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{activityUnread}</Text>
            </View>
          ) : null}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'notification' && styles.tabActive]}
          onPress={() => setActiveTab('notification')}
        >
          <Text style={[styles.tabText, activeTab === 'notification' && styles.tabTextActive]}>
            알림
          </Text>
          {notificationUnread > 0 ? (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{notificationUnread}</Text>
            </View>
          ) : null}
        </TouchableOpacity>
      </View>

      <FlatList
        data={currentData}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ flexGrow: 1 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        renderItem={activeTab === 'activity' ? renderActivityItem : renderNotificationItem}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              {activeTab === 'activity'
                ? '새로운 활동이 없습니다.'
                : '받은 알림이 없습니다.'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 72,
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  readAllButton: {
    color: '#000',
    fontSize: 15,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#1a1a1a',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#999',
  },
  tabTextActive: {
    color: '#1a1a1a',
    fontWeight: '600',
  },
  tabBadge: {
    backgroundColor: '#ff3b30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  tabBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 1,
    gap: 12,
  },
  itemUnread: {
    backgroundColor: '#f5f5f5',
  },
  itemAvatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  itemAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e8e8e8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemBody: {
    flex: 1,
  },
  itemText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  itemNickname: {
    fontWeight: '600',
    color: '#1a1a1a',
  },
  itemMessage: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  itemDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  empty: {
    paddingTop: 80,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});
