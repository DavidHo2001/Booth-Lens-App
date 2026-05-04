import React, {useCallback, useState} from 'react';
import {FlatList, Image, Linking, Pressable, RefreshControl, StyleSheet, View} from 'react-native';
import {Button, Menu, Text, TextInput} from 'react-native-paper';
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
import {IMAGE_PICKER_OPTIONS, MAX_IMAGES, MAX_UPLOAD_IMAGE_BYTES} from '../constants/constants';
import {compressImagesToUnderLimit, formatMegabytes} from '../utils/imageUtils';
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
      const data = await getMyRequests();
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
    const remainingSlots = MAX_IMAGES - files.length;
    if (remainingSlots <= 0) {
      showError(`Maximum ${MAX_IMAGES} attachments allowed`);
      return;
    }

    const result = await launchImageLibrary({
      mediaType: 'photo',
      selectionLimit: remainingSlots,
      maxWidth: IMAGE_PICKER_OPTIONS.maxWidth,
      maxHeight: IMAGE_PICKER_OPTIONS.maxHeight,
      assetRepresentationMode: 'compatible',
    });
    if (result.assets?.length) {
      const picked = result.assets
        .filter(asset => asset.uri && asset.type && asset.fileName)
        .map(asset => ({
          uri: asset.uri!,
          type: asset.type!,
          name: asset.fileName!,
        }));
      const compressed = await compressImagesToUnderLimit(picked, MAX_UPLOAD_IMAGE_BYTES);
      if (compressed.failed.length > 0) {
        const first = compressed.failed[0];
        const sizeLabel = first.sizeBytes ? formatMegabytes(first.sizeBytes) : 'unknown size';
        showError(
          `Could not compress "${first.name}" below 1 MB (current: ${sizeLabel}). Please choose another file.`,
        );
      }
      setFiles(prev => [...prev, ...compressed.files].slice(0, MAX_IMAGES));
    }
  }

  function removeFile(uri: string) {
    setFiles(prev => prev.filter(file => file.uri !== uri));
  }

  async function onSubmitRequest() {
    if (!token) {
      return;
    }
    const compressed = await compressImagesToUnderLimit(files, MAX_UPLOAD_IMAGE_BYTES);
    if (compressed.failed.length > 0) {
      const first = compressed.failed[0];
      const sizeLabel = first.sizeBytes ? formatMegabytes(first.sizeBytes) : 'unknown size';
      showError(
        `Could not compress "${first.name}" below 1 MB (current: ${sizeLabel}). Please choose another file.`,
      );
      return;
    }
    try {
      const response = await createCommonRequest({
        requestType,
        requestInfo,
        sourceReferenceCode: sourceReferenceCode || undefined,
        files: compressed.files,
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
      const items = await getRequestFiles(referenceCode);
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
      const {downloadUrl} = await getFileDownloadUrl(fileId);
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
          <View style={styles.requestItem}>
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
          </View>
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
  requestItem: {
    backgroundColor: boothLensColors.surface,
    borderRadius: 14,
    padding: 14,
    gap: 6,
  },
  emptyText: {
    color: boothLensColors.muted,
    textAlign: 'center',
  },
});

