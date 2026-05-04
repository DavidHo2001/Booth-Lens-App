import React, {useCallback, useState} from 'react';
import {
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import {Button, Text, TextInput} from 'react-native-paper';
import {useFocusEffect} from '@react-navigation/native';
import {searchAdminTransactions} from '../../api/admin';
import {ADMIN_DEFAULT_LIMIT, ADMIN_DEFAULT_PAGE} from '../../constants/constants';
import {useAuth} from '../../context/AuthContext';
import {boothLensColors} from '../../theme/theme';
import {TransactionDto} from '../../types/api';
import {showError} from '../../utils/snackbarUtils';

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export function AdminTransactionsScreen() {
  const {token} = useAuth();
  const [items, setItems] = useState<TransactionDto[]>([]);
  const [keywordInput, setKeywordInput] = useState('');
  const [userIdInput, setUserIdInput] = useState('');
  const [statusInput, setStatusInput] = useState('');
  const [transactionTypeInput, setTransactionTypeInput] = useState('');
  const [filters, setFilters] = useState({
    keyword: '',
    userId: '',
    status: '',
    transactionType: '',
  });
  const [hasSearched, setHasSearched] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<Pagination>({
    page: ADMIN_DEFAULT_PAGE,
    limit: ADMIN_DEFAULT_LIMIT,
    total: 0,
    totalPages: 1,
  });

  const load = useCallback(
    async (targetPage = pagination.page, activeFilters = filters) => {
      try {
        setLoading(true);
        const result = await searchAdminTransactions(token, {
          keyword: activeFilters.keyword || undefined,
          userId: activeFilters.userId ? Number(activeFilters.userId) : undefined,
          status: activeFilters.status || undefined,
          transactionType: activeFilters.transactionType || undefined,
          page: targetPage,
          limit: pagination.limit,
        });
        setItems(result.data);
        setPagination(result.pagination);
      } catch (error) {
        showError(error instanceof Error ? error.message : 'Failed to search transactions');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token, filters, pagination.page, pagination.limit],
  );

  useFocusEffect(
    useCallback(() => {
      if (hasSearched) {
        load(ADMIN_DEFAULT_PAGE);
      }
    }, [hasSearched, load]),
  );

  function onSearchPress() {
    Keyboard.dismiss();
    const nextFilters = {
      keyword: keywordInput.trim(),
      userId: userIdInput.trim(),
      status: statusInput.trim(),
      transactionType: transactionTypeInput.trim(),
    };
    setFilters(nextFilters);
    setHasSearched(true);
    load(ADMIN_DEFAULT_PAGE, nextFilters);
  }

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <FlatList
        data={items}
        keyExtractor={item => String(item.id)}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              if (!hasSearched) {
                setRefreshing(false);
                return;
              }
              setRefreshing(true);
              load(pagination.page);
            }}
          />
        }
        contentContainerStyle={styles.container}
        ListHeaderComponent={
          <View style={styles.filters}>
            <Text variant="titleLarge" style={styles.title}>
              Search Transactions
            </Text>
            <TextInput
              mode="outlined"
              label="Keyword"
              value={keywordInput}
              onChangeText={setKeywordInput}
            />
            <TextInput
              mode="outlined"
              label="User ID"
              value={userIdInput}
              onChangeText={setUserIdInput}
              keyboardType="numeric"
            />
            <TextInput
              mode="outlined"
              label="Status"
              value={statusInput}
              onChangeText={setStatusInput}
            />
            <TextInput
              mode="outlined"
              label="Transaction Type"
              value={transactionTypeInput}
              onChangeText={setTransactionTypeInput}
            />
            <Button mode="contained" onPress={onSearchPress} loading={loading}>
              Search
            </Button>
            <View style={styles.paginationRow}>
              <Button
                mode="outlined"
                disabled={!hasSearched || pagination.page <= 1 || loading}
                onPress={() => load(pagination.page - 1)}>
                Prev
              </Button>
              <Text>
                Page {pagination.page} / {pagination.totalPages} ({pagination.total})
              </Text>
              <Button
                mode="outlined"
                disabled={!hasSearched || pagination.page >= pagination.totalPages || loading}
                onPress={() => load(pagination.page + 1)}>
                Next
              </Button>
            </View>
          </View>
        }
        renderItem={({item}) => (
          <View style={styles.rowItem}>
            <Text variant="titleMedium">{item.transactionType}</Text>
            <Text>User: {item.userId}</Text>
            <Text>Status: {item.status}</Text>
            <Text>Amount: {item.amount}</Text>
            <Text>Token Delta: {item.tokenAmount}</Text>
            <Text>Super Token Delta: {item.superTokenAmount}</Text>
            <Text>{new Date(item.createdAt).toLocaleString()}</Text>
            {item.description ? <Text>Description: {item.description}</Text> : null}
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {hasSearched ? 'No transactions found.' : 'Tap Search to load transactions.'}
          </Text>
        }
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },
  container: {
    backgroundColor: boothLensColors.background,
    padding: 16,
    gap: 12,
    flexGrow: 1,
  },
  title: {
    color: boothLensColors.primaryDark,
    fontWeight: '800',
  },
  filters: {
    gap: 10,
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  rowItem: {
    backgroundColor: boothLensColors.surface,
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  emptyText: {
    textAlign: 'center',
    color: boothLensColors.muted,
  },
});
