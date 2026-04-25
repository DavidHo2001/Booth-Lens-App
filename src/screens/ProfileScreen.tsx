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
  const [form, setForm] = useState({
    email: '',
    username: '',
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    city: '',
    zip: '',
    country: '',
  });

  useFocusEffect(
    useCallback(() => {
      const profile = me?.profileResponse;
      if (!profile) {
        return;
      }
      setForm({
        email: profile.email ?? '',
        username: profile.username ?? '',
        firstName: profile.firstName ?? '',
        lastName: profile.lastName ?? '',
        phone: profile.phone ?? '',
        address: profile.address ?? '',
        city: profile.city ?? '',
        zip: profile.zip ?? '',
        country: profile.country ?? '',
      });
    }, [me?.profileResponse]),
  );

  function onChange(key: keyof typeof form, value: string) {
    setForm(prev => ({...prev, [key]: value}));
  }

  async function onSave() {
    if (!token) {
      return;
    }
    try {
      setLoading(true);
      await updateProfile(token, form);
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
      <View style={styles.card}>
        <Text variant="headlineSmall" style={styles.title}>Profile</Text>
        <TextInput label="Email" value={form.email} onChangeText={v => onChange('email', v)} />
        <TextInput label="Username" value={form.username} onChangeText={v => onChange('username', v)} />
        <TextInput label="First Name" value={form.firstName} onChangeText={v => onChange('firstName', v)} />
        <TextInput label="Last Name" value={form.lastName} onChangeText={v => onChange('lastName', v)} />
        <TextInput label="Phone" value={form.phone} onChangeText={v => onChange('phone', v)} />
        <TextInput label="Address" value={form.address} onChangeText={v => onChange('address', v)} />
        <TextInput label="City" value={form.city} onChangeText={v => onChange('city', v)} />
        <TextInput label="Zip" value={form.zip} onChangeText={v => onChange('zip', v)} />
        <TextInput label="Country" value={form.country} onChangeText={v => onChange('country', v)} />
        <Button mode="contained" onPress={onSave} loading={loading}>
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
  card: {
    gap: 10,
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

