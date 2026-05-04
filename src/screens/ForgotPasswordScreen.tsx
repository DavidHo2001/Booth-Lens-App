import React, {useState} from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import {Button, Text, TextInput} from 'react-native-paper';
import {resetPassword, sendPasswordResetVerificationCode} from '../api/auth';
import {boothLensColors} from '../theme/theme';
import {showError, showSuccess} from '../utils/snackbarUtils';

export function ForgotPasswordScreen({navigation}: {navigation: any}) {
  const [form, setForm] = useState({
    email: '',
    verificationCode: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [sendingCode, setSendingCode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showPasswordFields, setShowPasswordFields] = useState(false);

  function updateField<K extends keyof typeof form>(key: K, value: string) {
    setForm(prev => ({...prev, [key]: value}));
  }

  async function onSendCode() {
    const email = form.email.trim();
    if (!email) {
      showError('Please enter email first');
      return;
    }
    try {
      Keyboard.dismiss();
      setSendingCode(true);
      await sendPasswordResetVerificationCode(email);
      showSuccess('If this email exists, verification code has been sent');
      setShowPasswordFields(true);
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to send verification code');
    } finally {
      setSendingCode(false);
    }
  }

  async function onResetPassword() {
    if (!form.email.trim() || !form.verificationCode.trim()) {
      showError('Please enter email and verification code');
      return;
    }
    if (!form.newPassword || !form.confirmNewPassword) {
      showError('Please fill in both new password fields');
      return;
    }

    try {
      Keyboard.dismiss();
      setSubmitting(true);
      const success = await resetPassword({
        email: form.email.trim(),
        verificationCode: form.verificationCode.trim(),
        newPassword: form.newPassword,
        confirmNewPassword: form.confirmNewPassword,
      });
      if (success) {
        showSuccess('Password reset successful. Please login again.');
        navigation.goBack();
        return;
      }
      showError('Password reset failed');
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Password reset failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled">
        <View style={styles.formCard}>
          <Text variant="headlineSmall" style={styles.title}>
            Forgot Password
          </Text>
          <Text style={styles.subtitle}>
            Enter your email to receive a code, then reset your password.
          </Text>

          <TextInput
            mode="outlined"
            label="Email"
            value={form.email}
            onChangeText={value => updateField('email', value)}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <Button mode="outlined" onPress={onSendCode} loading={sendingCode} disabled={sendingCode}>
            Send Verification Code
          </Button>
          {showPasswordFields && (<>
          <TextInput
            mode="outlined"
            label="Verification Code"
            value={form.verificationCode}
            onChangeText={value => updateField('verificationCode', value)}
          />
          <TextInput
            mode="outlined"
            label="New Password"
            value={form.newPassword}
            onChangeText={value => updateField('newPassword', value)}
            secureTextEntry
          />
          <TextInput
            mode="outlined"
            label="Confirm New Password"
            value={form.confirmNewPassword}
            onChangeText={value => updateField('confirmNewPassword', value)}
            secureTextEntry
          />

          <Button
            mode="contained"
            onPress={onResetPassword}
            loading={submitting}
            disabled={submitting || sendingCode}>
            Reset Password
          </Button>
          </>
          )}
          <Button mode="text" onPress={() => navigation.goBack()}>
            Back to Login
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: boothLensColors.background,
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  formCard: {
    gap: 12,
    padding: 20,
    borderRadius: 24,
    backgroundColor: boothLensColors.surface,
    borderWidth: 1,
    borderColor: boothLensColors.outline,
  },
  title: {
    color: boothLensColors.primaryDark,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    color: boothLensColors.muted,
    textAlign: 'center',
    marginBottom: 6,
  },
});
