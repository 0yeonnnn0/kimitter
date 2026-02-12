import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CreatePostModal from '../../src/components/CreatePostModal';
import PostActionSheet from '../../src/components/PostActionSheet';
import { useCreateModalStore } from '../../src/stores/createModalStore';

interface TabIconProps {
  focused: boolean;
  iconName: string;
  iconNameFocused: string;
}

function TabIcon({ focused, iconName, iconNameFocused }: TabIconProps) {
  return (
    <View style={styles.tabItem}>
      <Ionicons
        name={(focused ? iconNameFocused : iconName) as React.ComponentProps<typeof Ionicons>['name']}
        size={30}
        color={focused ? '#000' : '#999'}
      />
    </View>
  );
}

export default function TabsLayout() {
  const { visible: createModalVisible, open: openCreateModal, close: closeCreateModal } = useCreateModalStore();
  const insets = useSafeAreaInsets();

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarStyle: {
            ...styles.tabBar,
            paddingBottom: Math.max(insets.bottom, 8),
            height: 56 + Math.max(insets.bottom, 8),
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon focused={focused} iconName="home-outline" iconNameFocused="home" />
            ),
          }}
        />
        <Tabs.Screen
          name="search"
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon focused={focused} iconName="search-outline" iconNameFocused="search" />
            ),
          }}
        />
        <Tabs.Screen
          name="create"
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon focused={focused} iconName="add-circle-outline" iconNameFocused="add-circle" />
            ),
          }}
          listeners={{
            tabPress: (e) => {
              e.preventDefault();
              openCreateModal();
            },
          }}
        />
        <Tabs.Screen
          name="activity"
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon focused={focused} iconName="notifications-outline" iconNameFocused="notifications" />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon focused={focused} iconName="person-outline" iconNameFocused="person" />
            ),
          }}
        />
      </Tabs>

      <CreatePostModal
        visible={createModalVisible}
        onClose={closeCreateModal}
      />

      <PostActionSheet />
    </>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    paddingTop: 8,
    backgroundColor: '#fff',
    borderTopColor: '#e0e0e0',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
