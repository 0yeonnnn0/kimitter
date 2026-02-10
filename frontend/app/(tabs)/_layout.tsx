import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface TabIconProps {
  focused: boolean;
  iconName: string;
  iconNameFocused: string;
  label: string;
}

function TabIcon({ focused, iconName, iconNameFocused, label }: TabIconProps) {
  return (
    <View style={styles.tabItem}>
      <Ionicons
        name={(focused ? iconNameFocused : iconName) as React.ComponentProps<typeof Ionicons>['name']}
        size={24}
        color={focused ? '#007AFF' : '#999'}
      />
      <Text style={[styles.label, focused && styles.labelFocused]}>{label}</Text>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBar,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} iconName="home-outline" iconNameFocused="home" label="홈" />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} iconName="search-outline" iconNameFocused="search" label="검색" />
          ),
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} iconName="add-circle-outline" iconNameFocused="add-circle" label="작성" />
          ),
        }}
      />
      <Tabs.Screen
        name="activity"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} iconName="notifications-outline" iconNameFocused="notifications" label="활동" />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} iconName="person-outline" iconNameFocused="person" label="프로필" />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: 60,
    paddingBottom: 4,
    backgroundColor: '#fff',
    borderTopColor: '#e0e0e0',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  labelFocused: {
    color: '#007AFF',
    fontWeight: '600',
  },
});
