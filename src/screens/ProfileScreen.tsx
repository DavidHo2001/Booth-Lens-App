import React, {useCallback, useState} from 'react';
import {ScrollView, StyleSheet, View} from 'react-native';
import {Button, Text, TextInput} from 'react-native-paper';
import {useFocusEffect} from '@react-navigation/native';
import {useAuth} from '../context/AuthContext';
import {updateProfile} from '../api/user';
import {boothLensColors} from '../theme/theme';
import {showError, showSuccess} from '../utils/snackbarUtils';

export function ProfileScreen() {
  const {token, me, refreshMe} = useAuth();
  const [loading, setLoading] = useState(false);
  
  // Area code and local number are edited separately, then joined for the API.
  const [areaCode, setAreaCode] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  const [form, setForm] = useState({
    email: '',
    username: '',
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    zip: '',
    country: '',
  });

  useFocusEffect(
    useCallback(() => {
      const profile = me?.profileResponse;
      if (!profile) return;

      setForm({
        email: profile.email ?? '',
        username: profile.username ?? '',
        firstName: profile.firstName ?? '',
        lastName: profile.lastName ?? '',
        address: profile.address ?? '',
        city: profile.city ?? '',
        zip: profile.zip ?? '',
        country: profile.country ?? '',
      });

      // Stored phone numbers use the form areaCode-number.
      const phoneStr = profile.phone ?? '';
      if (phoneStr.includes('-')) {
        const parts = phoneStr.split('-');
        setAreaCode(parts[0]);
        setPhoneNumber(parts.slice(1).join('-')); // Join the rest in case there are multiple dashes
      } else {
        setAreaCode('');
        setPhoneNumber(phoneStr);
      }
    }, [me?.profileResponse]),
  );

  function onChange(key: keyof typeof form, value: string) {
    setForm(prev => ({...prev, [key]: value}));
  }

  async function onSave() {
    if (!token) return;
    try {
      setLoading(true);
      // Join area code and number before saving the profile.
      const finalPhone = areaCode ? `${areaCode}-${phoneNumber}` : phoneNumber;
      
      await updateProfile({...form, phone: finalPhone});
      await refreshMe();
      showSuccess('Profile updated');
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.form}>
        <Text variant="headlineSmall" style={styles.title}>Profile</Text>
        <TextInput label="Email" value={form.email} onChangeText={v => onChange('email', v)} />
        <TextInput label="Username" value={form.username} onChangeText={v => onChange('username', v)} />
        <TextInput label="First Name" value={form.firstName} onChangeText={v => onChange('firstName', v)} />
        <TextInput label="Last Name" value={form.lastName} onChangeText={v => onChange('lastName', v)} />
        
        {/* Area code and local number */}
        <View style={styles.phoneRow}>
          <TextInput 
            label="Code (e.g. 852)" 
            value={areaCode} 
            onChangeText={setAreaCode} 
            style={styles.areaCodeInput} 
            keyboardType="phone-pad"
          />
          <TextInput 
            label="Phone Number" 
            value={phoneNumber} 
            onChangeText={setPhoneNumber} 
            style={styles.phoneInput} 
            keyboardType="phone-pad"
          />
        </View>

        <TextInput label="Address" value={form.address} onChangeText={v => onChange('address', v)} />
        <TextInput label="City" value={form.city} onChangeText={v => onChange('city', v)} />
        <TextInput label="Zip" value={form.zip} onChangeText={v => onChange('zip', v)} />
        <TextInput label="Country" value={form.country} onChangeText={v => onChange('country', v)} />
        <Button mode="contained" onPress={onSave} loading={loading} style={{marginTop: 10}}>
          Save Profile
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: boothLensColors.background,
  },
  form: {
    gap: 10,
  },
  title: {
    color: boothLensColors.primaryDark,
    fontWeight: '800',
    marginBottom: 10,
  },
  // Phone row layout.
  phoneRow: {
    flexDirection: 'row',
    gap: 10,
  },
  areaCodeInput: {
    flex: 1, // Takes 1 part of the space
  },
  phoneInput: {
    flex: 2.5, // Takes 2.5 parts of the space (wider)
  },
});
