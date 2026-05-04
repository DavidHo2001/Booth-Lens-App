import React, {useCallback, useState} from 'react';
import {
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import {
  Button,
  Dialog,
  IconButton,
  Portal,
  Text,
  TextInput,
} from 'react-native-paper';
import {useFocusEffect} from '@react-navigation/native';
import {adjustAdminCredits, searchAdminCredits} from '../../api/admin';
import {ADMIN_DEFAULT_LIMIT, ADMIN_DEFAULT_PAGE} from '../../constants/constants';
import {useAuth} from '../../context/AuthContext';
import {boothLensColors} from '../../theme/theme';
import {UserCreditsResponse} from '../../types/api';
import {showError, showSuccess} from '../../utils/snackbarUtils';

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export function AdminCreditsScreen() {
  const [items, setItems] = useState<UserCreditsResponse[]>([]);
  const [keywordInput, setKeywordInput] = useState('');
  const [searchUserIdInput, setSearchUserIdInput] = useState('');
  const [filters, setFilters] = useState({
    keyword: '',
    userId: '',
  });
  const [hasSearched, setHasSearched] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [pagination, setPagination] = useState<Pagination>({
    page: ADMIN_DEFAULT_PAGE,
    limit: ADMIN_DEFAULT_LIMIT,
    total: 0,
    totalPages: 1,
  });

  // Dialog State
  const [editingUser, setEditingUser] = useState<UserCreditsResponse | null>(null);
  const [adjustForm, setAdjustForm] = useState({
    tokenDelta: '0',
    superTokenDelta: '0',
    balanceDelta: '0',
    referenceCode: '',
    description: '',
  });

  const load = useCallback(
    async (targetPage: number, activeFilters = filters) => {
      try {
        setLoading(true);
        const result = await searchAdminCredits({
          keyword: activeFilters.keyword || undefined,
          userId: activeFilters.userId ? Number(activeFilters.userId) : undefined,
          page: targetPage,
          limit: ADMIN_DEFAULT_LIMIT,
        });
        setItems(result.data);
        setPagination(result.pagination);
      } catch (error) {
        showError(error instanceof Error ? error.message : 'Failed to search credits');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [filters],
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
      userId: searchUserIdInput.trim(),
    };
    setFilters(nextFilters);
    setHasSearched(true);
    load(ADMIN_DEFAULT_PAGE, nextFilters);
  }

  function openEditDialog(item: UserCreditsResponse) {
    setEditingUser(item);
    setAdjustForm({
      tokenDelta: '0',
      superTokenDelta: '0',
      balanceDelta: '0',
      referenceCode: '',
      description: '',
    });
  }

  async function onAdjustCredits() {
    if (!editingUser) {
      return;
    }
    
    try {
      Keyboard.dismiss();
      setSubmitting(true);
      await adjustAdminCredits({
        userId: editingUser.userId,
        tokenDelta: Number(adjustForm.tokenDelta || '0'),
        superTokenDelta: Number(adjustForm.superTokenDelta || '0'),
        balanceDelta: adjustForm.balanceDelta || '0',
        referenceCode: adjustForm.referenceCode || undefined,
        description: adjustForm.description || undefined,
      });
      showSuccess(`Credits adjusted for User ${editingUser.userId}`);
      setEditingUser(null);
      await load(pagination.page);
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to adjust credits');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <FlatList
        data={items}
        keyExtractor={item => String(item.userId)}
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
          <View style={styles.form}>
            <Text variant="titleLarge" style={styles.title}>
              Search Credits
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
              value={searchUserIdInput}
              onChangeText={setSearchUserIdInput}
              keyboardType="numeric"
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

            <Text variant="titleLarge" style={[styles.title, styles.listTitle]}>
              Credits List
            </Text>
          </View>
        }
        renderItem={({item}) => (
          <View style={styles.rowItem}>
            <View style={styles.rowHeader}>
              <Text variant="titleMedium">User {item.userId}</Text>
              <IconButton
                icon="pencil"
                mode="contained-tonal"
                size={20}
                onPress={() => openEditDialog(item)}
              />
            </View>
            <Text>Balance: {item.balance}</Text>
            <Text>Token: {item.token}</Text>
            <Text>Super Token: {item.superToken}</Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {hasSearched ? 'No credits found.' : 'Tap Search to load credits.'}
          </Text>
        }
      />

      <Portal>
        <Dialog
          visible={!!editingUser}
          onDismiss={() => setEditingUser(null)}
          style={styles.dialog}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.dialogInner}>
              <Dialog.Title>Adjust User {editingUser?.userId}</Dialog.Title>
              <Dialog.Content>
                <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.dialogContent}>
                  <Text style={styles.currentStats}>
                    Current Balance: {editingUser?.balance} | Tokens: {editingUser?.token} | Super:{' '}
                    {editingUser?.superToken}
                  </Text>
                  <TextInput
                    mode="outlined"
                    label="Token Delta (+/-)"
                    value={adjustForm.tokenDelta}
                    keyboardType="numbers-and-punctuation"
                    onChangeText={value => setAdjustForm(prev => ({...prev, tokenDelta: value}))}
                  />
                  <TextInput
                    mode="outlined"
                    label="Super Token Delta (+/-)"
                    value={adjustForm.superTokenDelta}
                    keyboardType="numbers-and-punctuation"
                    onChangeText={value => setAdjustForm(prev => ({...prev, superTokenDelta: value}))}
                  />
                  <TextInput
                    mode="outlined"
                    label="Balance Delta (+/-)"
                    value={adjustForm.balanceDelta}
                    keyboardType="numbers-and-punctuation"
                    onChangeText={value => setAdjustForm(prev => ({...prev, balanceDelta: value}))}
                  />
                  <TextInput
                    mode="outlined"
                    label="Reference Code (optional)"
                    value={adjustForm.referenceCode}
                    onChangeText={value => setAdjustForm(prev => ({...prev, referenceCode: value}))}
                  />
                  <TextInput
                    mode="outlined"
                    label="Description (optional)"
                    value={adjustForm.description}
                    onChangeText={value => setAdjustForm(prev => ({...prev, description: value}))}
                  />
                </ScrollView>
              </Dialog.Content>
              <Dialog.Actions>
                <Button onPress={() => setEditingUser(null)}>Cancel</Button>
                <Button mode="contained" onPress={onAdjustCredits} loading={submitting}>
                  Apply
                </Button>
              </Dialog.Actions>
            </View>
          </TouchableWithoutFeedback>
        </Dialog>
      </Portal>
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
  listTitle: {
    marginTop: 16,
  },
  form: {
    gap: 10,
    marginBottom: 8,
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 8,
  },
  rowItem: {
    backgroundColor: boothLensColors.surface,
    borderRadius: 12,
    padding: 12,
    gap: 6,
    marginBottom: 12,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  emptyText: {
    textAlign: 'center',
    color: boothLensColors.muted,
    marginTop: 24,
  },
  dialogContent: {
    gap: 12,
  },
  dialog: {
    maxHeight: '85%',
  },
  dialogInner: {
    flexShrink: 1,
  },
  currentStats: {
    color: boothLensColors.muted,
    marginBottom: 8,
    fontWeight: '500',
  },
});
