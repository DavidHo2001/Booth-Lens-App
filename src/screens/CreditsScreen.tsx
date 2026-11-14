import React, {useCallback, useState} from 'react';
import {FlatList, RefreshControl, StyleSheet, View} from 'react-native';
import {Button, Text} from 'react-native-paper';
import {useFocusEffect} from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {useAuth} from '../context/AuthContext';
import {getMyTransactions, getMyCredits} from '../api/user';
import {TransactionDto, UserCreditsResponse} from '../types/api';
import {boothLensColors} from '../theme/theme';
import {showError} from '../utils/snackbarUtils';

export function CreditsScreen() {
  const {token} = useAuth();
  const [transactions, setTransactions] = useState<TransactionDto[]>([]);
  const [showTransactions, setShowTransactions] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [credits, setCredits] = useState<UserCreditsResponse | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setRefreshing(true);
      const data = await getMyCredits();
      setCredits(data);
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to fetch credits');
    } finally {
      setRefreshing(false);
    }
  }, [token]);

  const loadTransactions = useCallback(async () => {
    if (!token) return;
    setRefreshing(true);
    try {
      const data = await getMyTransactions();
      setTransactions(data);
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
      data={showTransactions ? transactions : []}
      keyExtractor={item => String(item.id)}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadTransactions} />}
      contentContainerStyle={styles.container}
      ListHeaderComponent={
        <View style={styles.headerGroup}>
          <Text variant="headlineSmall" style={styles.title}>
            My Credits
          </Text>
          
          {/* Token and super-token balances */}
          <View style={styles.creditsRow}>
            <View style={styles.creditBlock}>
              <MaterialCommunityIcons name="currency-usd" size={28} color={boothLensColors.primaryDark} />
              <Text style={styles.creditLabel}>Balance(USD)</Text>
              <Text style={styles.creditValue}>{credits?.balance ?? '0.00'}</Text>
            </View>
            
            <View style={styles.divider} />

            <View style={styles.creditBlock}>
              <MaterialCommunityIcons name="ticket-confirmation-outline" size={28} color={boothLensColors.primaryDark} />
              <Text style={styles.creditLabel}>Token</Text>
              <Text style={styles.creditValue}>{credits?.token ?? 0}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.creditBlock}>
              <MaterialCommunityIcons name="star-circle-outline" size={28} color="#FFD700" />
              <Text style={styles.creditLabel}>Super Token</Text>
              <Text style={styles.creditValue}>{credits?.superToken ?? 0}</Text>
            </View>
          </View>

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
        <View style={styles.panel}>
          <Text variant="titleMedium">{item.transactionType}</Text>
          <Text>Status: {item.status}</Text>
          <Text>Amount: {item.amount}</Text>
          <Text>Description: {item.description ?? '-'}</Text>
        </View>
      )}
      ListEmptyComponent={
        showTransactions ? (
          <Text style={styles.emptyText}>No transaction history.</Text>
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12,
    backgroundColor: boothLensColors.background,
  },
  headerGroup: {
    gap: 16, // Increased gap for better spacing
  },
  title: {
    color: boothLensColors.primaryDark,
    fontWeight: '800',
  },
  // Side-by-side credit balances.
  creditsRow: {
    flexDirection: 'row',
    backgroundColor: boothLensColors.surface,
    borderRadius: 16,
    padding: 16,
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2, // Shadow for Android
    shadowColor: '#000', // Shadow for iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  creditBlock: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  divider: {
    width: 1,
    height: '80%',
    backgroundColor: boothLensColors.outline,
    marginHorizontal: 8,
  },
  creditLabel: {
    fontSize: 12,
    color: boothLensColors.muted,
    textAlign: 'center',
  },
  creditValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: boothLensColors.primaryDark,
  },
  panel: {
    backgroundColor: boothLensColors.surface,
    borderRadius: 14,
    padding: 14,
    gap: 6,
    marginTop: 8,
  },
  emptyText: {
    marginTop: 16,
    color: boothLensColors.muted,
    textAlign: 'center',
  },
});
