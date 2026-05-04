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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: boothLensColors.background,
  },
  title: {
    color: boothLensColors.primaryDark,
    fontWeight: '800',
    marginBottom: 12,
  },
});

