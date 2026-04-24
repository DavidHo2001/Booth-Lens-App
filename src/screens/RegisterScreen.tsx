import React, {useState} from 'react';
import {ScrollView, StyleSheet, View} from 'react-native';
import {Button, Snackbar, TextInput} from 'react-native-paper';
import {register, sendVerificationCode} from '../api/auth';

export function RegisterScreen({navigation}: {navigation: any}) {
  const [form, setForm] = useState({
    username: '',
    email: '',
    phone: '',
    password: '',
    verificationCode: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  function updateField(key: keyof typeof form, value: string) {
    setForm(prev => ({...prev, [key]: value}));
  }

  async function onSendCode() {
    try {
      setLoading(true);
      await sendVerificationCode(form.email);
      setMessage('Verification code sent');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to send code');
    } finally {
      setLoading(false);
    }
  }

  async function onRegister() {
    try {
      setLoading(true);
      await register(form);
      setMessage('Registration successful, please login');
      navigation.goBack();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.form}>
        <TextInput label="Username" value={form.username} onChangeText={v => updateField('username', v)} />
        <TextInput label="Email" value={form.email} onChangeText={v => updateField('email', v)} autoCapitalize="none" />
        <TextInput label="Phone" value={form.phone} onChangeText={v => updateField('phone', v)} />
        <TextInput label="Password" value={form.password} onChangeText={v => updateField('password', v)} secureTextEntry />
        <TextInput
          label="Verification Code"
          value={form.verificationCode}
          onChangeText={v => updateField('verificationCode', v)}
        />
        <Button mode="outlined" onPress={onSendCode} loading={loading}>
          Send Verification Code
        </Button>
        <Button mode="contained" onPress={onRegister} loading={loading}>
          Register
        </Button>
      </View>
      <Snackbar visible={!!message} onDismiss={() => setMessage('')}>
        {message}
      </Snackbar>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {padding: 20},
  form: {gap: 12},
});

