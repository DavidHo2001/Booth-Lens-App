import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {AdminHomeScreen} from '../screens/admin/AdminHomeScreen';
import {AnnouncementAdminScreen} from '../screens/admin/AnnouncementAdminScreen';
import {AdminRequestsScreen} from '../screens/admin/AdminRequestsScreen';
import {AdminTransactionsScreen} from '../screens/admin/AdminTransactionsScreen';
import {AdminCreditsScreen} from '../screens/admin/AdminCreditsScreen';
import {SuperAdminUsersScreen} from '../screens/admin/SuperAdminUsersScreen';
import {boothLensColors} from '../theme/theme';

const Stack = createNativeStackNavigator();

export function AdminStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {backgroundColor: boothLensColors.surface},
        headerTintColor: boothLensColors.primaryDark,
        headerTitleStyle: {fontWeight: '800'},
      }}>
      <Stack.Screen
        name="AdminHome"
        component={AdminHomeScreen}
        options={{title: 'Admin Portal'}}
      />
      <Stack.Screen
        name="AnnouncementAdmin"
        component={AnnouncementAdminScreen}
        options={{title: 'Announcement'}}
      />
      <Stack.Screen
        name="AdminRequests"
        component={AdminRequestsScreen}
        options={{title: 'User Requests'}}
      />
      <Stack.Screen
        name="AdminTransactions"
        component={AdminTransactionsScreen}
        options={{title: 'User Transactions'}}
      />
      <Stack.Screen
        name="AdminCredits"
        component={AdminCreditsScreen}
        options={{title: 'User Credits'}}
      />
      <Stack.Screen
        name="SuperAdminUsers"
        component={SuperAdminUsersScreen}
        options={{title: 'User Role Management'}}
      />
    </Stack.Navigator>
  );
}
