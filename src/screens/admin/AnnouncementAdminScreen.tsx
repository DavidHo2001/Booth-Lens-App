import React, {useCallback, useState} from 'react';
import {FlatList, RefreshControl, StyleSheet, View} from 'react-native';
import {Button, Switch, Text, TextInput} from 'react-native-paper';
import {useFocusEffect} from '@react-navigation/native';
import {
  Announcement,
  createAnnouncement,
  deleteAnnouncement,
  getAnnouncements,
  updateAnnouncement,
} from '../../api/admin';
import {useAuth} from '../../context/AuthContext';
import {boothLensColors} from '../../theme/theme';
import {showError, showSuccess} from '../../utils/snackbarUtils';

export function AnnouncementAdminScreen() {
  const {token} = useAuth();
  const [items, setItems] = useState<Announcement[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [active, setActive] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!token) {
      return;
    }
    try {
      setRefreshing(true);
      const data = await getAnnouncements(token);
      setItems(data);
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to load announcements');
    } finally {
      setRefreshing(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  function resetForm() {
    setTitle('');
    setBody('');
    setActive(true);
    setEditingId(null);
  }

  async function onSubmit() {
    if (!token) {
      return;
    }
    if (!title.trim() || !body.trim()) {
      showError('Title and body are required');
      return;
    }
    try {
      setSaving(true);
      if (editingId) {
        await updateAnnouncement(token, editingId, {
          title: title.trim(),
          body: body.trim(),
          active,
        });
        showSuccess('Announcement updated');
      } else {
        await createAnnouncement(token, {
          title: title.trim(),
          body: body.trim(),
          active,
        });
        showSuccess('Announcement created');
      }
      resetForm();
      await load();
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to save announcement');
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id: number) {
    if (!token) {
      return;
    }
    try {
      await deleteAnnouncement(token, id);
      showSuccess('Announcement deleted');
      await load();
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to delete announcement');
    }
  }

  return (
    <FlatList
      data={items}
      keyExtractor={item => String(item.id)}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
      contentContainerStyle={styles.container}
      ListHeaderComponent={
        <View style={styles.form}>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            {editingId ? 'Edit Announcement' : 'Create Announcement'}
          </Text>
          <TextInput label="Title" value={title} onChangeText={setTitle} mode="outlined" />
          <TextInput label="Body" value={body} onChangeText={setBody} multiline mode="outlined" />
          <View style={styles.switchRow}>
            <Text>Active</Text>
            <Switch value={active} onValueChange={setActive} />
          </View>
          <View style={styles.formActions}>
            <Button mode="contained" onPress={onSubmit} loading={saving}>
              {editingId ? 'Update' : 'Create'}
            </Button>
            {editingId ? (
              <Button mode="outlined" onPress={resetForm}>
                Cancel Edit
              </Button>
            ) : null}
          </View>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            Announcement List
          </Text>
        </View>
      }
      renderItem={({item}) => (
        <View style={styles.rowItem}>
          <Text variant="titleMedium">{item.title}</Text>
          <Text style={styles.meta}>{item.active ? 'Active' : 'Inactive'}</Text>
          <Text>{item.body}</Text>
          <View style={styles.itemActions}>
            <Button
              mode="text"
              onPress={() => {
                setEditingId(item.id);
                setTitle(item.title);
                setBody(item.body);
                setActive(item.active);
              }}>
              Edit
            </Button>
            <Button mode="text" textColor="#C62828" onPress={() => onDelete(item.id)}>
              Delete
            </Button>
          </View>
        </View>
      )}
      ListEmptyComponent={<Text style={styles.emptyText}>No announcements.</Text>}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12,
    backgroundColor: boothLensColors.background,
  },
  form: {
    gap: 12,
  },
  sectionTitle: {
    color: boothLensColors.primaryDark,
    fontWeight: '800',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  formActions: {
    flexDirection: 'row',
    gap: 10,
  },
  rowItem: {
    backgroundColor: boothLensColors.surface,
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  meta: {
    color: boothLensColors.muted,
    fontWeight: '700',
  },
  itemActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  emptyText: {
    textAlign: 'center',
    color: boothLensColors.muted,
  },
});
