import React, {useState} from 'react';
import {View} from 'react-native';
import {Button, Snackbar, Text} from 'react-native-paper';
import {useAuth} from '../context/AuthContext';

export function SettingsScreen() {
  const {logout} = useAuth();
  const [message, setMessage] = useState('');

  return (
    <View style={{flex: 1, padding: 16, gap: 12}}>
      <Text variant="headlineSmall">Settings</Text>
      <Button
        mode="contained"
        onPress={async () => {
          await logout();
          setMessage('Logged out');
        }}>
        Logout
      </Button>
      <Snackbar visible={!!message} onDismiss={() => setMessage('')}>
        {message}
      </Snackbar>
    </View>
  );
}

