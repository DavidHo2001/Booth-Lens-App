import React, {useCallback, useState} from 'react';
import {FlatList, RefreshControl, View} from 'react-native';
import {Button, Card, Text} from 'react-native-paper';
import {useFocusEffect} from '@react-navigation/native';
import {useAuth} from '../context/AuthContext';
import {getMyTransactions} from '../api/user';
import {TransactionDto} from '../types/api';

export function CreditsScreen() {
  const {token, me, refreshMe} = useAuth();
  const [transactions, setTransactions] = useState<TransactionDto[]>([]);
  const [showTransactions, setShowTransactions] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadTransactions = useCallback(async () => {
    if (!token) {
      return;
    }
    setRefreshing(true);
    try {
      const data = await getMyTransactions(token);
      setTransactions(data);
    } finally {
      setRefreshing(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      refreshMe();
    }, [refreshMe]),
  );

  const credits = me?.creditsResponse;

  return (
    <FlatList
      data={showTransactions ? transactions : []}
      keyExtractor={item => String(item.id)}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadTransactions} />}
      contentContainerStyle={{padding: 16, gap: 12}}
      ListHeaderComponent={
        <View style={{gap: 12}}>
          <Card>
            <Card.Title title="My Credits" />
            <Card.Content>
              <Text>Balance: {credits?.balance ?? '0.00'}</Text>
              <Text>Token: {credits?.token ?? 0}</Text>
              <Text>Super Token: {credits?.superToken ?? 0}</Text>
            </Card.Content>
          </Card>

          <Button
            mode={showTransactions ? 'outlined' : 'contained'}
            onPress={async () => {
              const next = !showTransactions;
              setShowTransactions(next);
              if (next) {
                await loadTransactions();
              }
            }}>
            {showTransactions ? 'Hide Transactions' : 'Show Transactions'}
          </Button>
        </View>
      }
      renderItem={({item}) => (
        <Card>
          <Card.Content>
            <Text variant="titleMedium">{item.transactionType}</Text>
            <Text>Status: {item.status}</Text>
            <Text>Amount: {item.amount}</Text>
            <Text>Description: {item.description ?? '-'}</Text>
            <Text>{new Date(item.createdAt).toLocaleString()}</Text>
          </Card.Content>
        </Card>
      )}
      ListEmptyComponent={
        showTransactions ? (
          <Text style={{marginTop: 16}}>No transaction history.</Text>
        ) : null
      }
    />
  );
}

