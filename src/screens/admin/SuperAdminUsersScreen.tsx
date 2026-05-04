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
import {Button, Dialog, IconButton, Menu, Portal, Text, TextInput} from 'react-native-paper';
import {useFocusEffect} from '@react-navigation/native';
import {adjustSuperAdminUserRole, searchSuperAdminUsers} from '../../api/admin';
import {ADMIN_DEFAULT_LIMIT, ADMIN_DEFAULT_PAGE, USER_ROLE} from '../../constants/constants';
import {useAuth} from '../../context/AuthContext';
import {boothLensColors} from '../../theme/theme';
import {UserRoleResponse} from '../../types/api';
import {showError, showSuccess} from '../../utils/snackbarUtils';

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

const STATUS_OPTIONS = [
  {label: 'All', value: 'all'},
  {label: 'Active', value: 'active'},
  {label: 'Blocked', value: 'blocked'},
] as const;

const ROLE_OPTIONS = [
  {label: 'Client', value: USER_ROLE.CLIENT},
  {label: 'Contractor', value: USER_ROLE.CONTRACTOR},
  {label: 'Admin', value: USER_ROLE.ADMIN},
  {label: 'Super Admin', value: USER_ROLE.SUPER_ADMIN},
];

type StatusFilter = (typeof STATUS_OPTIONS)[number]['value'];

export function SuperAdminUsersScreen() {
  const {token} = useAuth();
  const [items, setItems] = useState<UserRoleResponse[]>([]);
  const [keywordInput, setKeywordInput] = useState('');
  
  // Search Form State
  const [roleIdInput, setRoleIdInput] = useState<number | ''>('');
  const [roleMenuVisible, setRoleMenuVisible] = useState(false);
  const [statusInput, setStatusInput] = useState<StatusFilter>('all');
  const [statusMenuVisible, setStatusMenuVisible] = useState(false);
  
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  
  const [filters, setFilters] = useState({
    keyword: '',
    roleId: '' as number | '',
    status: 'all' as StatusFilter,
  });
  
  const [pagination, setPagination] = useState<Pagination>({
    page: ADMIN_DEFAULT_PAGE,
    limit: ADMIN_DEFAULT_LIMIT,
    total: 0,
    totalPages: 1,
  });

  // Edit Dialog State
  const [editingUser, setEditingUser] = useState<UserRoleResponse | null>(null);
  const [editRoleId, setEditRoleId] = useState<number>(USER_ROLE.CLIENT);
  const [editRoleMenuVisible, setEditRoleMenuVisible] = useState(false);
  const [editStatus, setEditStatus] = useState<StatusFilter>('active');
  const [editStatusMenuVisible, setEditStatusMenuVisible] = useState(false);

  const load = useCallback(
    async (targetPage: number, activeFilters = filters) => {
      if (!token) {
        return;
      }
      
      const roleId = activeFilters.roleId === '' ? undefined : activeFilters.roleId;
      const isBlocked =
        activeFilters.status === 'blocked'
          ? true
          : activeFilters.status === 'active'
            ? false
            : undefined;

      try {
        setLoading(true);
        const result = await searchSuperAdminUsers(token, {
          keyword: activeFilters.keyword.trim() || undefined,
          roleId,
          isBlocked,
          page: targetPage,
          limit: ADMIN_DEFAULT_LIMIT,
        });
        setItems(result.data);
        setPagination(result.pagination);
      } catch (error) {
        showError(error instanceof Error ? error.message : 'Failed to search users');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token, filters],
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
      roleId: roleIdInput,
      status: statusInput,
    };
    setFilters(nextFilters);
    setHasSearched(true);
    load(ADMIN_DEFAULT_PAGE, nextFilters);
  }

  function openEditDialog(item: UserRoleResponse) {
    setEditingUser(item);
    setEditRoleId(item.roleId);
    setEditStatus(item.isBlocked ? 'blocked' : 'active');
  }

  async function onSaveEdit() {
    if (!token || !editingUser) {
      return;
    }

    const nextBlocked = editStatus === 'blocked';
    const roleChanged = editRoleId !== editingUser.roleId;
    const blockChanged = nextBlocked !== editingUser.isBlocked;

    if (!roleChanged && !blockChanged) {
      showError('No changes to save');
      return;
    }

    try {
      Keyboard.dismiss();
      setSubmitting(true);
      await adjustSuperAdminUserRole(token, editingUser.id, {
        userId: editingUser.id,
        roleId: roleChanged ? editRoleId : undefined,
        isBlocked: blockChanged ? nextBlocked : undefined,
      });
      showSuccess(`Updated user ${editingUser.username}`);
      setEditingUser(null);
      await load(pagination.page);
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to update user');
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
          <View style={styles.form}>
            <Text variant="titleLarge" style={styles.title}>
              Search Users
            </Text>
            <TextInput
              mode="outlined"
              label="Keyword (id / username / email)"
              value={keywordInput}
              onChangeText={setKeywordInput}
            />
            
            {/* Role ID Search Filter */}
            <TextInput
              mode="outlined"
              label="Role (optional)"
              value={roleIdInput === '' ? 'All' : ROLE_OPTIONS.find(r => r.value === roleIdInput)?.label}
              editable={false}
              right={
                <TextInput.Icon
                  icon={roleMenuVisible ? 'chevron-up' : 'chevron-down'}
                  onPress={() => setRoleMenuVisible(prev => !prev)}
                />
              }
              onPressIn={() => setRoleMenuVisible(true)}
            />
            <Menu
              visible={roleMenuVisible}
              onDismiss={() => setRoleMenuVisible(false)}
              anchor={<View style={styles.menuAnchor} />}>
              <Menu.Item
                title="All"
                onPress={() => {
                  setRoleIdInput('');
                  setRoleMenuVisible(false);
                }}
              />
              {ROLE_OPTIONS.map(option => (
                <Menu.Item
                  key={`search-role-${option.value}`}
                  title={option.label}
                  onPress={() => {
                    setRoleIdInput(option.value);
                    setRoleMenuVisible(false);
                  }}
                />
              ))}
            </Menu>

            {/* Status Search Filter */}
            <TextInput
              mode="outlined"
              label="Status"
              value={STATUS_OPTIONS.find(option => option.value === statusInput)?.label ?? 'All'}
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
              {STATUS_OPTIONS.map(option => (
                <Menu.Item
                  key={`status-${option.value}`}
                  title={option.label}
                  onPress={() => {
                    setStatusInput(option.value);
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
                <Text variant="titleMedium">
                  #{item.id} {item.username}
                </Text>
                <Text style={styles.metaText}>
                  Role: {item.role} ({item.roleId})
                </Text>
                <Text style={styles.metaText}>Status: {item.isBlocked ? 'Blocked' : 'Active'}</Text>
              </View>
              <IconButton
                icon="pencil"
                mode="contained-tonal"
                size={20}
                onPress={() => openEditDialog(item)}
              />
            </View>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {hasSearched ? 'No users found.' : 'Tap Search to load users.'}
          </Text>
        }
      />

      {/* Edit Dialog */}
      <Portal>
        <Dialog visible={!!editingUser} onDismiss={() => setEditingUser(null)}>
          <Dialog.Title>Adjust User #{editingUser?.id}</Dialog.Title>
          <Dialog.Content style={styles.dialogContent}>
            
            <Text style={styles.fieldLabel}>Role</Text>
            <Menu
              visible={editRoleMenuVisible}
              onDismiss={() => setEditRoleMenuVisible(false)}
              anchor={
                <Button 
                  mode="outlined" 
                  onPress={() => setEditRoleMenuVisible(true)}
                  contentStyle={styles.menuButtonContent}
                  icon="chevron-down"
                >
                  {ROLE_OPTIONS.find(r => r.value === editRoleId)?.label}
                </Button>
              }>
              {ROLE_OPTIONS.map(option => (
                <Menu.Item
                  key={`edit-role-${option.value}`}
                  title={option.label}
                  onPress={() => {
                    setEditRoleId(option.value);
                    setEditRoleMenuVisible(false);
                  }}
                />
              ))}
            </Menu>

            <Text style={styles.fieldLabel}>Blocked Status</Text>
            <Menu
              visible={editStatusMenuVisible}
              onDismiss={() => setEditStatusMenuVisible(false)}
              anchor={
                <Button 
                  mode="outlined" 
                  onPress={() => setEditStatusMenuVisible(true)}
                  contentStyle={styles.menuButtonContent}
                  icon="chevron-down"
                >
                  {editStatus === 'blocked' ? 'Blocked' : 'Active'}
                </Button>
              }>
              <Menu.Item
                title="Active"
                onPress={() => {
                  setEditStatus('active');
                  setEditStatusMenuVisible(false);
                }}
              />
              <Menu.Item
                title="Blocked"
                onPress={() => {
                  setEditStatus('blocked');
                  setEditStatusMenuVisible(false);
                }}
              />
            </Menu>
            
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setEditingUser(null)}>Cancel</Button>
            <Button mode="contained" onPress={onSaveEdit} loading={submitting}>
              Save
            </Button>
          </Dialog.Actions>
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
  form: {
    gap: 10,
    marginBottom: 8,
  },
  menuAnchor: {
    width: 1,
    height: 1,
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
  metaText: {
    color: boothLensColors.muted,
    fontWeight: '500',
  },
  emptyText: {
    textAlign: 'center',
    color: boothLensColors.muted,
    marginTop: 24,
  },
  dialogContent: {
    gap: 10,
  },
  fieldLabel: {
    color: boothLensColors.muted,
    marginBottom: 2,
    marginTop: 8,
  },
  menuButtonContent: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
  }
});
