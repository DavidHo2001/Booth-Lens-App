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
  Menu,
  Portal,
  Text,
  TextInput,
} from 'react-native-paper';
import {useFocusEffect} from '@react-navigation/native';
import {searchAdminRequests, updateAdminRequest} from '../../api/admin';
import {
  ADMIN_DEFAULT_LIMIT,
  ADMIN_DEFAULT_PAGE,
  REQUEST_STATUS_OPTIONS,
} from '../../constants/constants';
import {useAuth} from '../../context/AuthContext';
import {boothLensColors} from '../../theme/theme';
import {UserRequestDto} from '../../types/api';
import {showError, showSuccess} from '../../utils/snackbarUtils';

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export function AdminRequestsScreen() {
  const {token} = useAuth();
  const [items, setItems] = useState<UserRequestDto[]>([]);
  const [keywordInput, setKeywordInput] = useState('');
  const [statusInput, setStatusInput] = useState('');
  const [filters, setFilters] = useState({
    keyword: '',
    status: '',
  });
  const [hasSearched, setHasSearched] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusMenuVisible, setStatusMenuVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [pagination, setPagination] = useState<Pagination>({
    page: ADMIN_DEFAULT_PAGE,
    limit: ADMIN_DEFAULT_LIMIT,
    total: 0,
    totalPages: 1,
  });

  // Dialog State
  const [editingItem, setEditingItem] = useState<UserRequestDto | null>(null);
  const [editStatus, setEditStatus] = useState('');
  const [editResultInfo, setEditResultInfo] = useState('');
  const [editStatusMenuVisible, setEditStatusMenuVisible] = useState(false);

  const load = useCallback(
    async (targetPage: number, activeFilters = filters) => {
      try {
        setLoading(true);
        const result = await searchAdminRequests({
          keyword: activeFilters.keyword || undefined,
          status: activeFilters.status || undefined,
          page: targetPage,
          limit: ADMIN_DEFAULT_LIMIT,
        });
        setItems(result.data);
        setPagination(result.pagination);
      } catch (error) {
        showError(error instanceof Error ? error.message : 'Failed to search requests');
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
      status: statusInput.trim(),
    };
    setFilters(nextFilters);
    setHasSearched(true);
    load(ADMIN_DEFAULT_PAGE, nextFilters);
  }

  function openEditDialog(item: UserRequestDto) {
    setEditingItem(item);
    setEditStatus(item.status);
    setEditResultInfo(item.resultInfo ?? '');
  }

  async function onSaveEdit() {
    if (!token || !editingItem) {
      return;
    }
    
    const nextStatus = editStatus;
    const nextResultInfo = editResultInfo.trim();
    const currentResultInfo = editingItem.resultInfo ?? '';
    
    const statusChanged = nextStatus !== editingItem.status;
    const resultInfoChanged = nextResultInfo !== currentResultInfo;

    if (!statusChanged && !resultInfoChanged) {
      showError('No changes to save');
      return;
    }

    try {
      Keyboard.dismiss();
      setSubmitting(true);
      await updateAdminRequest(token, editingItem.id, {
        status: statusChanged ? nextStatus : undefined,
        resultInfo: resultInfoChanged ? nextResultInfo : undefined,
      });
      showSuccess(`Updated ${editingItem.referenceCode}`);
      setEditingItem(null);
      await load(pagination.page);
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to update request');
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
              Search & Filter
            </Text>
            <TextInput
              mode="outlined"
              label="Keyword (ref / request / result / userId)"
              value={keywordInput}
              onChangeText={setKeywordInput}
            />
            <TextInput
              mode="outlined"
              label="Status (optional)"
              value={statusInput || 'All'}
              editable={false}
              right={
                <TextInput.Icon
                  icon={statusMenuVisible ? 'chevron-up' : 'chevron-down'}
                  onPress={() => setStatusMenuVisible(prev => !prev)}
                />
              }
              onPressIn={() => setStatusMenuVisible(true)}
            />
            <Menu
              visible={statusMenuVisible}
              onDismiss={() => setStatusMenuVisible(false)}
              anchor={<View style={styles.menuAnchor} />}>
              <Menu.Item
                title="All"
                onPress={() => {
                  setStatusInput('');
                  setStatusMenuVisible(false);
                }}
              />
              {REQUEST_STATUS_OPTIONS.map(option => (
                <Menu.Item
                  key={option}
                  title={option}
                  onPress={() => {
                    setStatusInput(option);
                    setStatusMenuVisible(false);
                  }}
                />
              ))}
            </Menu>
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
            <View style={styles.rowHeader}>
              <View>
                <Text variant="titleMedium">{item.referenceCode}</Text>
                <Text style={styles.userTag}>User #{item.userId}</Text>
              </View>
              <IconButton
                icon="pencil"
                mode="contained-tonal"
                size={20}
                onPress={() => openEditDialog(item)}
              />
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.statusText}>Status: {item.status}</Text>
            </View>
            <Text style={styles.requestInfoText}>{item.requestInfo}</Text>
            {!!item.resultInfo && (
              <Text style={styles.resultInfoText}>Reply: {item.resultInfo}</Text>
            )}
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {hasSearched ? 'No requests found.' : 'Tap Search to load requests.'}
          </Text>
        }
      />

      <Portal>
        <Dialog
          visible={!!editingItem}
          onDismiss={() => setEditingItem(null)}
          style={styles.dialog}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.dialogInner}>
              <Dialog.Title>Edit Request</Dialog.Title>
              <Dialog.Content>
                <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.dialogContent}>
                  <Text style={styles.fieldLabel}>Update Status</Text>
                  <Menu
                    visible={editStatusMenuVisible}
                    onDismiss={() => setEditStatusMenuVisible(false)}
                    anchor={
                      <Button
                        mode="outlined"
                        icon="chevron-down"
                        contentStyle={styles.statusPickerButton}
                        onPress={() => setEditStatusMenuVisible(true)}>
                        {editStatus}
                      </Button>
                    }>
                    {REQUEST_STATUS_OPTIONS.map(option => (
                      <Menu.Item
                        key={`edit-${option}`}
                        title={option}
                        onPress={() => {
                          setEditStatus(option);
                          setEditStatusMenuVisible(false);
                        }}
                      />
                    ))}
                  </Menu>

                  <TextInput
                    mode="outlined"
                    multiline
                    label="Admin reply (resultInfo)"
                    value={editResultInfo}
                    onChangeText={setEditResultInfo}
                    style={styles.replyInput}
                  />
                </ScrollView>
              </Dialog.Content>
              <Dialog.Actions>
                <Button onPress={() => setEditingItem(null)}>Cancel</Button>
                <Button mode="contained" onPress={onSaveEdit} loading={submitting}>
                  Save
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
  filters: {
    gap: 10,
    marginBottom: 8,
  },
  menuAnchor: {
    width: 1,
    height: 1,
  },
  fieldLabel: {
    color: boothLensColors.muted,
    marginBottom: 4,
  },
  statusPickerButton: {
    flexDirection: 'row-reverse',
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
    gap: 8,
    marginBottom: 12,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  userTag: {
    color: boothLensColors.muted,
    fontWeight: '600',
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusText: {
    fontWeight: '600',
    color: boothLensColors.primary,
  },
  requestInfoText: {
    color: boothLensColors.primaryDark,
    marginTop: 4,
  },
  resultInfoText: {
    color: boothLensColors.muted,
    fontStyle: 'italic',
    marginTop: 4,
  },
  dialogContent: {
    gap: 16,
  },
  dialog: {
    maxHeight: '85%',
  },
  dialogInner: {
    flexShrink: 1,
  },
  replyInput: {
    minHeight: 86,
    marginTop: 8,
  },
  emptyText: {
    color: boothLensColors.muted,
    textAlign: 'center',
    marginTop: 24,
  },
});
