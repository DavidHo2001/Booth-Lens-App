import React, {useCallback, useState} from 'react';
import {FlatList, Linking, RefreshControl, View} from 'react-native';
import {Button, Card, Snackbar, Text, TextInput} from 'react-native-paper';
import {useFocusEffect} from '@react-navigation/native';
import {launchImageLibrary} from 'react-native-image-picker';
import {useAuth} from '../context/AuthContext';
import {
  createCommonRequest,
  getFileDownloadUrl,
  getMyRequests,
  getRequestFiles,
} from '../api/user';
import {FileRecordDto, UserRequestDto} from '../types/api';

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
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    if (!token) {
      return;
    }
    try {
      setRefreshing(true);
      const data = await getMyRequests(token);
      setRequests(data);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to fetch requests');
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
      setMessage(`Request created: ${response.requestReferenceCode}`);
      setRequestInfo('');
      setSourceReferenceCode('');
      setFiles([]);
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to create request');
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
      setMessage(error instanceof Error ? error.message : 'Failed to load files');
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
      setMessage(error instanceof Error ? error.message : 'Failed to open download URL');
    }
  }

  return (
    <FlatList
      data={requests}
      keyExtractor={item => String(item.id)}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
      contentContainerStyle={{padding: 16, gap: 12}}
      ListHeaderComponent={
        <View style={{gap: 10}}>
          <Text variant="titleLarge">Create Request</Text>
          <TextInput
            label="Request Type (SUPPORT / CONTRACTOR)"
            value={requestType}
            onChangeText={text =>
              setRequestType(text.toUpperCase() === 'CONTRACTOR' ? 'CONTRACTOR' : 'SUPPORT')
            }
          />
          <TextInput label="Request Info" value={requestInfo} onChangeText={setRequestInfo} />
          <TextInput
            label="Source Reference Code (optional)"
            value={sourceReferenceCode}
            onChangeText={setSourceReferenceCode}
          />
          <Button mode="outlined" onPress={onPickFiles}>
            Attach Files ({files.length})
          </Button>
          <Button mode="contained" onPress={onSubmitRequest}>
            Submit Request
          </Button>
          <Text variant="titleLarge" style={{marginTop: 8}}>
            My Requests
          </Text>
        </View>
      }
      renderItem={({item}) => {
        const filesForItem = filesByRequest[item.referenceCode] ?? [];
        return (
          <Card>
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
      ListEmptyComponent={<Text>No requests yet.</Text>}
      ListFooterComponent={
        <Snackbar visible={!!message} onDismiss={() => setMessage('')}>
          {message}
        </Snackbar>
      }
    />
  );
}

