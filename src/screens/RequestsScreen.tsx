import React, {useCallback, useState} from 'react';
import {FlatList, Image, Linking, Pressable, RefreshControl, StyleSheet, View} from 'react-native';
import {Button, Card, Menu, Text, TextInput} from 'react-native-paper';
import {useFocusEffect} from '@react-navigation/native';
import {launchImageLibrary} from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useAuth} from '../context/AuthContext';
import {
  createCommonRequest,
  getFileDownloadUrl,
  getMyRequests,
  getRequestFiles,
} from '../api/user';
import {FileRecordDto, UserRequestDto} from '../types/api';
import {boothLensColors} from '../theme/theme';
import {showError, showSuccess} from '../utils/snackbarUtils';

type PickedFile = {
  uri: string;
  type: string;
  name: string;
};

export function RequestsScreen() {
  const {token} = useAuth();
  const [requests, setRequests] = useState<UserRequestDto[]>([]);
  const [filesByRequest, setFilesByRequest] = useState<Record<string, FileRecordDto[]>>({});
  const [requestType, setRequestType] = useState<'CONTRACTOR' | 'SUPPORT'>('SUPPORT');
  const [requestInfo, setRequestInfo] = useState('');
  const [sourceReferenceCode, setSourceReferenceCode] = useState('');
  const [files, setFiles] = useState<PickedFile[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [requestMenuVisible, setRequestMenuVisible] = useState(false);

  const load = useCallback(async () => {
    if (!token) {
      return;
    }
    try {
      setRefreshing(true);
      const data = await getMyRequests(token);
      setRequests(data);
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to fetch requests');
    } finally {
      setRefreshing(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function onPickFiles() {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      selectionLimit: 5,
    });
    if (result.assets?.length) {
      const picked = result.assets
        .filter(asset => asset.uri && asset.type && asset.fileName)
        .map(asset => ({
          uri: asset.uri!,
          type: asset.type!,
          name: asset.fileName!,
        }));
      setFiles(prev => [...prev, ...picked]);
    }
  }

  function removeFile(uri: string) {
    setFiles(prev => prev.filter(file => file.uri !== uri));
  }

  async function onSubmitRequest() {
    if (!token) {
      return;
    }
    try {
      const response = await createCommonRequest(token, {
        requestType,
        requestInfo,
        sourceReferenceCode: sourceReferenceCode || undefined,
        files,
      });
      showSuccess(`Request created: ${response.requestReferenceCode}`);
      setRequestInfo('');
      setSourceReferenceCode('');
      setFiles([]);
      await load();
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to create request');
    }
  }

  async function onLoadFiles(referenceCode: string) {
    if (!token) {
      return;
    }
    try {
      const items = await getRequestFiles(token, referenceCode);
      setFilesByRequest(prev => ({...prev, [referenceCode]: items}));
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to load files');
    }
  }

  async function onDownloadFile(fileId: number) {
    if (!token) {
      return;
    }
    try {
      const {downloadUrl} = await getFileDownloadUrl(token, fileId);
      await Linking.openURL(downloadUrl);
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to open download URL');
    }
  }

  return (
    <FlatList
      data={requests}
      keyExtractor={item => String(item.id)}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
      contentContainerStyle={styles.container}
      ListHeaderComponent={
        <View style={styles.headerCard}>
          <Text variant="titleLarge" style={styles.title}>
            Create Request
          </Text>
          {/* Request type is intentionally limited until backend adds more supported values. */}
          <Menu
            visible={requestMenuVisible}
            onDismiss={() => setRequestMenuVisible(false)}
            anchor={
              <Button
                mode="outlined"
                icon="chevron-down"
                contentStyle={styles.dropdownContent}
                onPress={() => setRequestMenuVisible(true)}>
                {requestType === 'SUPPORT' ? 'Support' : 'Contractor'}
              </Button>
            }>
            <Menu.Item
              leadingIcon="lifebuoy"
              title="Support"
              onPress={() => {
                setRequestType('SUPPORT');
                setRequestMenuVisible(false);
              }}
            />
            <Menu.Item
              leadingIcon="account-hard-hat"
              title="Contractor"
              onPress={() => {
                setRequestType('CONTRACTOR');
                setRequestMenuVisible(false);
              }}
            />
          </Menu>
          <TextInput label="Request Info" value={requestInfo} onChangeText={setRequestInfo} />
          <TextInput
            label="Source Reference Code (optional)"
            value={sourceReferenceCode}
            onChangeText={setSourceReferenceCode}
          />
          <Button mode="outlined" icon="image-plus" onPress={onPickFiles}>
            Attach Files ({files.length})
          </Button>

          {files.length > 0 ? (
            <View style={styles.previewList}>
              {files.map(file => (
                <View key={file.uri} style={styles.previewCard}>
                  <Image source={{uri: file.uri}} style={styles.previewImage} />
                  <Pressable style={styles.removeButton} onPress={() => removeFile(file.uri)}>
                    <Icon name="close" size={15} color="#FFFFFF" />
                  </Pressable>
                </View>
              ))}
            </View>
          ) : null}

          <Button mode="contained" icon="send" onPress={onSubmitRequest}>
            Submit Request
          </Button>
          <Text variant="titleLarge" style={styles.listTitle}>
            My Requests
          </Text>
        </View>
      }
      renderItem={({item}) => {
        const filesForItem = filesByRequest[item.referenceCode] ?? [];
        return (
          <Card style={styles.requestCard}>
            <Card.Content style={{gap: 6}}>
              <Text variant="titleMedium">{item.referenceCode}</Text>
              <Text>Status: {item.status}</Text>
              <Text>{item.requestInfo}</Text>
              <Button mode="text" onPress={() => onLoadFiles(item.referenceCode)}>
                Load Files
              </Button>
              {filesForItem.map(file => (
                <Button key={file.id} mode="text" onPress={() => onDownloadFile(file.id)}>
                  Download: {file.fileName}
                </Button>
              ))}
            </Card.Content>
          </Card>
        );
      }}
      ListEmptyComponent={<Text style={styles.emptyText}>No requests yet.</Text>}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12,
    backgroundColor: boothLensColors.background,
  },
  headerCard: {
    gap: 12,
    padding: 16,
    borderRadius: 24,
    backgroundColor: boothLensColors.surface,
    borderWidth: 1,
    borderColor: boothLensColors.outline,
  },
  title: {
    color: boothLensColors.primaryDark,
    fontWeight: '800',
  },
  dropdownContent: {
    justifyContent: 'space-between',
    flexDirection: 'row-reverse',
  },
  previewList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  previewCard: {
    width: 86,
    height: 86,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: boothLensColors.surfaceSoft,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  removeButton: {
    position: 'absolute',
    right: 6,
    top: 6,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: 'rgba(13,79,128,0.88)',
  },
  listTitle: {
    marginTop: 8,
    color: boothLensColors.primaryDark,
    fontWeight: '800',
  },
  requestCard: {
    backgroundColor: boothLensColors.surface,
  },
  emptyText: {
    color: boothLensColors.muted,
    textAlign: 'center',
  },
});

