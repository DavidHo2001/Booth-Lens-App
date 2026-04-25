import React, {useState} from 'react';
import {Image, KeyboardAvoidingView, Platform, StyleSheet, View} from 'react-native';
import {Button, Text, TextInput} from 'react-native-paper';
import {useAuth} from '../context/AuthContext';
import {boothLensColors} from '../theme/theme';
import {showError} from '../utils/snackbarUtils';

export function LoginScreen({navigation}: {navigation: any}) {
  const {login} = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function onLogin() {
    try {
      setLoading(true);
      await login({email, password, keepLoggedIn: true});
    } catch (e) {
      showError(e instanceof Error ? e.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}>

      <View style={styles.card}>
        <Image
          source={require('../assets/Booth-Lens-Icon-Transparent.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text variant="headlineMedium" style={styles.title}>
          Booth Lens
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Your Reliable Trade Show Partner
        </Text>
        <TextInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.input}
        />
        <TextInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
        />
        <Button mode="contained" onPress={onLogin} loading={loading} disabled={loading}>
          Login
        </Button>
        <Button mode="text" onPress={() => navigation.navigate('Register')}>
          Create account
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: boothLensColors.background,
  },
  card: {
    gap: 12,
    padding: 22,
    borderRadius: 30,
    backgroundColor: boothLensColors.surface,
    borderWidth: 1,
    borderColor: boothLensColors.outline,
  },
  title: {
    textAlign: 'center',
    color: boothLensColors.primaryDark,
    fontWeight: '800',
  },
  subtitle: {
    textAlign: 'center',
    color: boothLensColors.muted,
    marginBottom: 8,
  },
  input: {backgroundColor: boothLensColors.surface},
  logo: {
    width: 136,
    height: 136,
    alignSelf: 'center',
    marginBottom: 4,
  },
});

