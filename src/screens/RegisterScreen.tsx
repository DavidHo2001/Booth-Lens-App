import React, {useState} from 'react';
import {ScrollView, StyleSheet, View} from 'react-native';
import {Button, Text, TextInput} from 'react-native-paper';
import {register, sendVerificationCode} from '../api/auth';
import {boothLensColors} from '../theme/theme';
import {showError, showSuccess} from '../utils/snackbarUtils';

export function RegisterScreen({navigation}: {navigation: any}) {
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    verificationCode: '',
  });
  
  // Area code and local number are edited separately, then joined for registration.
  const [areaCode, setAreaCode] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswordFields, setShowPasswordFields] = useState(false);

  function updateField(key: keyof typeof form, value: string) {
    setForm(prev => ({...prev, [key]: value}));
  }

  async function onSendCode() {
    try {
      setLoading(true);
      await sendVerificationCode(form.email);
      showSuccess('Verification code sent to your email');
      setShowPasswordFields(true);
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to send code');
    } finally {
      setLoading(false);
    }
  }

  async function onRegister() {
    if (form.password !== confirmPassword) {
      showError('Passwords do not match, please check!');
      return;
    }
    try {
      setLoading(true);
      // Join area code and number before submitting.
      const finalPhone = areaCode && phoneNumber ? `${areaCode}-${phoneNumber}` : phoneNumber;
      
      await register({ ...form, phone: finalPhone });
      showSuccess('Registration successful, please login');
      navigation.goBack();
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.formCard}>
        <Text variant="headlineSmall" style={styles.title}>
          Create Account
        </Text>
        <Text style={styles.subtitle}>Join Booth Lens and start scanning your booth setup.</Text>
        
        <TextInput label="Username" value={form.username} onChangeText={v => updateField('username', v)} />
        <TextInput label="Email" value={form.email} onChangeText={v => updateField('email', v)} autoCapitalize="none" keyboardType="email-address" />
        <Button mode="outlined" onPress={onSendCode} loading={loading} style={{marginTop: 8}}>
          Send Verification Code
        </Button>
        {showPasswordFields && (<>
        {/* Area code and local number */}
        <View style={styles.phoneRow}>
          <TextInput 
            label="Code" 
            value={areaCode} 
            onChangeText={setAreaCode} 
            style={styles.areaCodeInput} 
            keyboardType="phone-pad"
            placeholder="852"
          />
          <TextInput 
            label="Phone (Optional)" 
            value={phoneNumber} 
            onChangeText={setPhoneNumber} 
            style={styles.phoneInput} 
            keyboardType="phone-pad"
          />
        </View>

        <TextInput label="Password" value={form.password} onChangeText={v => updateField('password', v)} secureTextEntry />
        <TextInput label="Confirm Password" value={confirmPassword} onChangeText={v => setConfirmPassword(v)} secureTextEntry />
        <TextInput
          label="Verification Code"
          value={form.verificationCode}
          onChangeText={v => updateField('verificationCode', v)}
        />
        <Button mode="contained" onPress={onRegister} loading={loading}>
          Register
        </Button>
        </>
        )}
      </View>
      <Text style={styles.footer}>Having trouble? Contact us at support@booth-lens.com</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: boothLensColors.background,
  },
  formCard: {
    gap: 12,
    padding: 18,
    borderRadius: 28,
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
  // Phone row layout.
  phoneRow: {
    flexDirection: 'row',
    gap: 10,
  },
  areaCodeInput: {
    flex: 1,
  },
  phoneInput: {
    flex: 2.5,
  },
  footer: {
    textAlign: 'center',
    bottom: 0,
    marginTop: 20,
    color: boothLensColors.muted,
  },
});
