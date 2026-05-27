import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Text, View } from 'react-native';

import { CalendarScreen } from './screens/CalendarScreen';
import { EventDetailScreen } from './screens/EventDetailScreen';
import { GroupsScreen } from './screens/GroupsScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { SyncManager } from './sync/SyncManager';
import { NotificationManager } from './notifications/NotificationManager';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function CalendarStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#2196F3',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="CalendarList"
        component={CalendarScreen}
        options={{ title: 'Kalender' }}
      />
      <Stack.Screen
        name="EventDetail"
        component={EventDetailScreen}
        options={{ title: 'Ereignisdetails' }}
      />
    </Stack.Navigator>
  );
}

function GroupsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#2196F3',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="GroupsList"
        component={GroupsScreen}
        options={{ title: 'Gruppen' }}
      />
    </Stack.Navigator>
  );
}

function SettingsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#2196F3',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="SettingsList"
        component={SettingsScreen}
        options={{ title: 'Einstellungen' }}
      />
    </Stack.Navigator>
  );
}

export default function App() {
  const [syncManager] = useState(() => new SyncManager());
  const [notificationManager] = useState(() => new NotificationManager());

  useEffect(() => {
    // Initialize sync manager
    syncManager.initialize().catch((error) => {
      console.error('Failed to initialize sync manager:', error);
    });

    // Initialize notification manager
    notificationManager.initialize().catch((error) => {
      console.error('Failed to initialize notification manager:', error);
    });

    return () => {
      syncManager.shutdown();
      notificationManager.shutdown();
    };
  }, [syncManager, notificationManager]);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: '#2196F3',
            tabBarInactiveTintColor: '#999',
          }}
        >
          <Tab.Screen
            name="Calendar"
            component={CalendarStack}
            options={{
              title: 'Kalender',
              tabBarLabel: 'Kalender',
              tabBarIcon: ({ color }) => (
                <Text style={{ color, fontSize: 20 }}>📅</Text>
              ),
            }}
          />
          <Tab.Screen
            name="Groups"
            component={GroupsStack}
            options={{
              title: 'Gruppen',
              tabBarLabel: 'Gruppen',
              tabBarIcon: ({ color }) => (
                <Text style={{ color, fontSize: 20 }}>👥</Text>
              ),
            }}
          />
          <Tab.Screen
            name="Settings"
            component={SettingsStack}
            options={{
              title: 'Einstellungen',
              tabBarLabel: 'Einstellungen',
              tabBarIcon: ({ color }) => (
                <Text style={{ color, fontSize: 20 }}>⚙️</Text>
              ),
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
