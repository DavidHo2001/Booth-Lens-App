import React from 'react';
import {StyleSheet, View} from 'react-native';
import {Button, Text} from 'react-native-paper';
import {useAuth} from '../context/AuthContext';
import {boothLensColors} from '../theme/theme';
import {showSuccess} from '../utils/snackbarUtils';

export function SettingsScreen() {
  const {logout} = useAuth();

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text variant="headlineSmall" style={styles.title}>Settings</Text>
        <Button
          mode="contained"
          onPress={async () => {
            await logout();
            showSuccess('Logged out');
          }}>
          Logout
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: boothLensColors.background,
  },
  card: {
    gap: 12,
    padding: 16,
    borderRadius: 24,
    backgroundColor: boothLensColors.surface,
    borderWidth: 1,
    borderColor: boothLensColors.outline,
  },
  title: {
    color: boothLensColors.primaryDark,
    fontWeight: '800',
  },
});

