import React from 'react';
import {StyleSheet, View} from 'react-native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useAuth} from '../context/AuthContext';
import {HomeScreen} from '../screens/HomeScreen';
import {CreditsScreen} from '../screens/CreditsScreen';
import {BoothAnalyzeScreen} from '../screens/BoothAnalyzeScreen';
import {RequestsScreen} from '../screens/RequestsScreen';
import {ProfileScreen} from '../screens/ProfileScreen';
import {SettingsScreen} from '../screens/SettingsScreen';
import {AdminScreen} from '../screens/AdminScreen';
import {boothLensColors} from '../theme/theme';

const Tab = createBottomTabNavigator();
const iconMap: Record<string, string> = {
  Home: 'home-outline',
  Credits: 'wallet-outline',
  Scan: 'line-scan',
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
        headerStyle: styles.header,
        headerTintColor: boothLensColors.primaryDark,
        headerTitleStyle: styles.headerTitle,
        tabBarActiveTintColor: boothLensColors.primary,
        tabBarInactiveTintColor: boothLensColors.muted,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarIcon: ({color, focused, size}) =>
          route.name === 'Scan' ? (
            <View style={[styles.scanButton, focused && styles.scanButtonActive]}>
              <Icon name={iconMap[route.name]} size={32} color="#FFFFFF" />
            </View>
          ) : (
            <Icon name={iconMap[route.name] ?? 'circle-outline'} size={size} color={color} />
          ),
      })}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Credits" component={CreditsScreen} />
      <Tab.Screen name="Scan" component={BoothAnalyzeScreen} />
      <Tab.Screen name="Requests" component={RequestsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
      {showAdmin ? <Tab.Screen name="Admin" component={AdminScreen} /> : null}
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: boothLensColors.surface,
  },
  headerTitle: {
    color: boothLensColors.primaryDark,
    fontWeight: '800',
  },
  tabBar: {
    height: 76,
    paddingTop: 8,
    paddingBottom: 10,
    borderTopWidth: 0,
    backgroundColor: boothLensColors.surface,
    shadowColor: boothLensColors.primaryDark,
    shadowOffset: {width: 0, height: -4},
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 12,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  scanButton: {
    width: 62,
    height: 62,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
    borderRadius: 31,
    backgroundColor: boothLensColors.primary,
    borderWidth: 4,
    borderColor: boothLensColors.surface,
    shadowColor: boothLensColors.primary,
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  scanButtonActive: {
    backgroundColor: boothLensColors.primaryDark,
  },
});

