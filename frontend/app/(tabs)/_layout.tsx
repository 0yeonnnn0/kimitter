import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
        size={26}
        color={focused ? '#000' : '#999'}
      />
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
});
