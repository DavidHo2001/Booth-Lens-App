import React from 'react';
import {StyleSheet, View} from 'react-native';
import {Button, Text} from 'react-native-paper';
import {useNavigation} from '@react-navigation/native';
import {useAuth} from '../../context/AuthContext';
import {boothLensColors} from '../../theme/theme';

export function AdminHomeScreen() {
  const navigation = useNavigation();
  const {me} = useAuth();
  const isSuperAdmin = me?.roleResponse?.roleId === 4;

  return (
    <View style={styles.container}>
      <Text variant="headlineSmall" style={styles.title}>
        Admin Management
      </Text>
      <Text style={styles.subtitle}>
        Select a module.
      </Text>

      <View style={styles.buttonGroup}>
        <Button
          mode="contained"
          icon="bullhorn-outline"
          onPress={() => navigation.navigate('AnnouncementAdmin' as never)}>
          Announcement
        </Button>
        <Button
          mode="contained"
          icon="file-search-outline"
          onPress={() => navigation.navigate('AdminRequests' as never)}>
          User Requests
        </Button>
        <Button
          mode="contained"
          icon="cash-multiple"
          onPress={() => navigation.navigate('AdminTransactions' as never)}>
          User Transaction
        </Button>
        <Button
          mode="contained"
          icon="wallet-outline"
          onPress={() => navigation.navigate('AdminCredits' as never)}>
          User Credits
        </Button>
        {isSuperAdmin && (
          <Button
            mode="contained"
            icon="shield-account"
            onPress={() => navigation.navigate('SuperAdminUsers' as never)}>
            User Role Management
          </Button>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: boothLensColors.background,
    padding: 16,
    gap: 12,
  },
  title: {
    color: boothLensColors.primaryDark,
    fontWeight: '800',
  },
  subtitle: {
    color: boothLensColors.muted,
    marginBottom: 8,
  },
  buttonGroup: {
    gap: 12,
  },
});
