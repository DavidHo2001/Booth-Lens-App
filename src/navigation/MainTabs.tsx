import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useAuth} from '../context/AuthContext';
import {HomeScreen} from '../screens/HomeScreen';
import {CreditsScreen} from '../screens/CreditsScreen';
import {CaptureScreen} from '../screens/CaptureScreen';
import {RequestsScreen} from '../screens/RequestsScreen';
import {ProfileScreen} from '../screens/ProfileScreen';
import {SettingsScreen} from '../screens/SettingsScreen';
import {AdminScreen} from '../screens/AdminScreen';

const Tab = createBottomTabNavigator();
const iconMap: Record<string, string> = {
  Home: 'home-outline',
  Credits: 'wallet-outline',
  Capture: 'camera-outline',
  Requests: 'file-document-outline',
  Profile: 'account-circle-outline',
  Settings: 'cog-outline',
  Admin: 'shield-account-outline',
};

export function MainTabs() {
  const {me} = useAuth();
  const roleId = me?.roleResponse?.roleId ?? 1;
  const showAdmin = roleId === 3 || roleId === 4;

  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        headerShown: true,
        tabBarIcon: ({color, size}) => (
          <Icon name={iconMap[route.name] ?? 'circle-outline'} size={size} color={color} />
        ),
      })}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Credits" component={CreditsScreen} />
      <Tab.Screen name="Capture" component={CaptureScreen} />
      <Tab.Screen name="Requests" component={RequestsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
      {showAdmin ? <Tab.Screen name="Admin" component={AdminScreen} /> : null}
    </Tab.Navigator>
  );
}

