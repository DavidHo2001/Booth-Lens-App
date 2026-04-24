import React, {useCallback, useState} from 'react';
import {FlatList, RefreshControl} from 'react-native';
import {Card, Text} from 'react-native-paper';
import {useFocusEffect} from '@react-navigation/native';
import {searchAdminRequests} from '../api/admin';
import {useAuth} from '../context/AuthContext';
import {UserRequestDto} from '../types/api';

export function AdminScreen() {
  const {token} = useAuth();
  const [items, setItems] = useState<UserRequestDto[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!token) {
      return;
    }
    try {
      setRefreshing(true);
      const result = await searchAdminRequests(token, {
        page: 1,
        limit: 20,
      });
      setItems(result.data);
    } finally {
      setRefreshing(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return (
    <FlatList
      data={items}
      keyExtractor={item => String(item.id)}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
      contentContainerStyle={{padding: 16, gap: 12}}
      ListHeaderComponent={<Text variant="headlineSmall">Admin Request Queue</Text>}
      renderItem={({item}) => (
        <Card>
          <Card.Content>
            <Text variant="titleMedium">{item.referenceCode}</Text>
            <Text>User: {item.userId}</Text>
            <Text>Status: {item.status}</Text>
            <Text>{item.requestInfo}</Text>
          </Card.Content>
        </Card>
      )}
      ListEmptyComponent={<Text>No requests.</Text>}
    />
  );
}

