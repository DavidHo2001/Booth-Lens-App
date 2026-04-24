import React, {useCallback, useState} from 'react';
import {FlatList, RefreshControl, View} from 'react-native';
import {Card, Text} from 'react-native-paper';
import {useFocusEffect} from '@react-navigation/native';
import {useAuth} from '../context/AuthContext';
import {Announcement, getAnnouncements} from '../api/admin';

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
      contentContainerStyle={{padding: 16, gap: 12}}
      ListHeaderComponent={
        <View style={{marginBottom: 8}}>
          <Text variant="headlineSmall">Welcome, {me?.profileResponse?.username ?? 'User'}</Text>
          <Text variant="bodyMedium">
            {announcements.length > 0
              ? 'Latest announcements'
              : 'No public announcement endpoint for normal users yet.'}
          </Text>
        </View>
      }
      renderItem={({item}) => (
        <Card>
          <Card.Title title={item.title} />
          <Card.Content>
            <Text>{item.body}</Text>
          </Card.Content>
        </Card>
      )}
    />
  );
}

