import React, {useCallback, useState} from 'react';
import {Image, StyleSheet, FlatList, RefreshControl, View} from 'react-native';
import {Card, Text} from 'react-native-paper';
import {useFocusEffect} from '@react-navigation/native';
import {useAuth} from '../context/AuthContext';
import {Announcement, getAnnouncements} from '../api/admin';
import {boothLensColors} from '../theme/theme';

export function HomeScreen() {
  const {token, me} = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!token) {
      return;
    }
    try {
      setRefreshing(true);
      const roleId = me?.roleResponse?.roleId ?? 1;
      if (roleId === 3 || roleId === 4) {
        const data = await getAnnouncements(token);
        setAnnouncements(data.filter(item => item.active));
      } else {
        setAnnouncements([]);
      }
    } finally {
      setRefreshing(false);
    }
  }, [token, me?.roleResponse?.roleId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return (
    <FlatList
      data={announcements}
      keyExtractor={item => String(item.id)}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
      contentContainerStyle={styles.container}
      ListHeaderComponent={
        <View style={styles.heroCard}>
          <Image
            source={require('../assets/Booth-Lens-Icon-Transparent.png')}
            style={styles.heroIcon}
            resizeMode="contain"
          />
          <Text variant="headlineSmall" style={styles.title}>
            Welcome, {me?.profileResponse?.username ?? 'User'}
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            {announcements.length > 0
              ? 'Latest announcements'
              : 'No announcement'}
          </Text>
        </View>
      }
      renderItem={({item}) => (
        <Card style={styles.card}>
          <Card.Title title={item.title} />
          <Card.Content>
            <Text>{item.body}</Text>
          </Card.Content>
        </Card>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12,
    backgroundColor: boothLensColors.background,
  },
  heroCard: {
    alignItems: 'center',
    marginBottom: 8,
    padding: 20,
    borderRadius: 28,
    backgroundColor: boothLensColors.surface,
    borderWidth: 1,
    borderColor: boothLensColors.outline,
  },
  heroIcon: {
    width: 96,
    height: 96,
    marginBottom: 10,
  },
  title: {
    color: boothLensColors.primaryDark,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 4,
    color: boothLensColors.muted,
  },
  card: {
    backgroundColor: boothLensColors.surface,
  },
});

