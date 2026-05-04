import React, {useEffect, useState} from 'react';
import {Image, Pressable, ScrollView, StyleSheet, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Button, Text, TextInput} from 'react-native-paper';
import {launchImageLibrary} from 'react-native-image-picker';
import {Camera, useCameraDevice, useCameraPermission, usePhotoOutput} from 'react-native-vision-camera';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {analyzeBooth} from '../api/booth';
import {
  CAMERA_CAPTURE_QUALITY,
  IMAGE_PICKER_OPTIONS,
  MAX_IMAGES,
  MAX_UPLOAD_IMAGE_BYTES,
} from '../constants/constants';
import {useAuth} from '../context/AuthContext';
import {boothLensColors} from '../theme/theme';
import {compressImagesToUnderLimit, formatMegabytes} from '../utils/imageUtils';
import {showError, showSuccess} from '../utils/snackbarUtils';

type PickedImage = {
  uri: string;
  type: string;
  name: string;
};

export function BoothAnalyzeScreen() {
  const {token} = useAuth();
  const device = useCameraDevice('back');
  const photoOutput = usePhotoOutput({quality: CAMERA_CAPTURE_QUALITY});
  const {hasPermission, requestPermission} = useCameraPermission();
  
  // 狀態管理
  const [images, setImages] = useState<PickedImage[]>([]);
  const [showForm, setShowForm] = useState(false);
  
  // 表單資料 (初始值改為空字串)
  const [boothWidth, setBoothWidth] = useState('');
  const [boothLength, setBoothLength] = useState('');
  const [boothHeight, setBoothHeight] = useState('');
  const [boothSizeUnit, setBoothSizeUnit] = useState('');
  const [requestInfo, setRequestInfo] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission, requestPermission]);

  async function appendPickedImages(assets: NonNullable<Awaited<ReturnType<typeof launchImageLibrary>>['assets']>) {
    const picked = assets
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
        `Could not compress "${first.name}" below 1 MB (current: ${sizeLabel}). Please choose another photo.`,
      );
    }
    
    setImages(prev => {
      const combined = [...prev, ...compressed.files];
      if (combined.length > MAX_IMAGES) {
        showError(`You can only select up to ${MAX_IMAGES} photos`);
        return combined.slice(0, MAX_IMAGES);
      }
      return combined;
    });
  }

  async function takePhoto() {
    if (images.length >= MAX_IMAGES) {
      showError(`Maximum ${MAX_IMAGES} photos allowed`);
      return;
    }

    if (!hasPermission) {
      const granted = await requestPermission();
      if (!granted) {
        showError('Camera permission is required to scan a booth');
      }
      return;
    }
    if (!device) {
      showError('No camera device found');
      return;
    }

    try {
      const photo = await photoOutput.capturePhotoToFile(
        {flashMode: 'off', enableShutterSound: true},
        {},
      );
      const uri = photo.filePath.startsWith('file://')
        ? photo.filePath
        : `file://${photo.filePath}`;
      const compressed = await compressImagesToUnderLimit(
        [
          {
            uri,
            type: 'image/jpeg',
            name: photo.filePath.split('/').pop() ?? `booth-${Date.now()}.jpg`,
          },
        ],
        MAX_UPLOAD_IMAGE_BYTES,
      );
      if (compressed.failed.length > 0) {
        const first = compressed.failed[0];
        const sizeLabel = first.sizeBytes ? formatMegabytes(first.sizeBytes) : 'unknown size';
        showError(
          `Could not compress captured photo below 1 MB (current: ${sizeLabel}). Please retake with less detail.`,
        );
        return;
      }
      
      setImages(prev => [
        ...prev,
        ...compressed.files,
      ]);
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Unable to take photo');
    }
  }

  async function pickFromGallery() {
    const remainingSlots = MAX_IMAGES - images.length;
    if (remainingSlots <= 0) {
      showError(`Maximum ${MAX_IMAGES} photos allowed`);
      return;
    }

    const result = await launchImageLibrary({
      mediaType: 'photo',
      selectionLimit: remainingSlots,
      maxWidth: IMAGE_PICKER_OPTIONS.maxWidth,
      maxHeight: IMAGE_PICKER_OPTIONS.maxHeight,
      assetRepresentationMode: 'compatible',
    });
    
    if (result.didCancel) return;
    if (result.errorCode) {
      showError(result.errorMessage ?? 'Unable to open gallery');
      return;
    }
    if (result.assets?.length) {
      await appendPickedImages(result.assets);
    }
  }

  function removeImage(uri: string) {
    setImages(prev => prev.filter(image => image.uri !== uri));
  }

  function confirmPhotos() {
    setShowForm(true);
  }

  async function submitAnalyze() {
    if (loading) return;
    
    // 驗證：除了 requestInfo 以外，其他欄位都必須填寫
    if (!boothWidth.trim() || !boothLength.trim() || !boothHeight.trim() || !boothSizeUnit.trim()) {
      showError('Please fill in all booth dimensions and unit');
      return;
    }

    if (images.length === 0) {
      showError('Please select at least one photo');
      return;
    }

    try {
      setLoading(true);
      const compressed = await compressImagesToUnderLimit(images, MAX_UPLOAD_IMAGE_BYTES);
      if (compressed.failed.length > 0) {
        const first = compressed.failed[0];
        const sizeLabel = first.sizeBytes ? formatMegabytes(first.sizeBytes) : 'unknown size';
        showError(
          `Could not compress "${first.name}" below 1 MB (current: ${sizeLabel}). Please choose another photo.`,
        );
        return;
      }

      const referenceCode = await analyzeBooth({
        boothWidth: Number(boothWidth),
        boothLength: Number(boothLength),
        boothHeight: Number(boothHeight),
        boothSizeUnit,
        requestInfo,
        images: compressed.files,
      });
      showSuccess(`Analyze request created: ${referenceCode}`);
      
      // 提交成功後重置所有狀態
      setImages([]);
      setShowForm(false);
      setBoothWidth('');
      setBoothLength('');
      setBoothHeight('');
      setBoothSizeUnit('');
      setRequestInfo('');
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Analyze failed');
    } finally {
      setLoading(false);
    }
  }

  // ==========================================
  // 畫面 2：表單與照片確認頁面
  // ==========================================
  if (showForm) {
    return (
      <SafeAreaView style={styles.formScreenContainer}>
        <View style={styles.formHeader}>
          <Pressable onPress={() => setShowForm(false)} style={styles.backButton}>
            <Icon name="arrow-left" size={28} color={boothLensColors.primaryDark} />
          </Pressable>
          <Text variant="titleLarge" style={styles.formHeaderTitle}>Confirm Details</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView contentContainerStyle={styles.formScrollContent}>
          <View style={styles.sectionHeader}>
            <Text variant="titleMedium" style={styles.sectionTitleDark}>Selected Photos</Text>
            <Text style={styles.countTextDark}>{images.length} / {MAX_IMAGES}</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.previewList}>
            {images.map(image => (
              <View key={image.uri} style={styles.previewCardDark}>
                <Image source={{uri: image.uri}} style={styles.previewImage} />
                <Pressable style={styles.removeButton} onPress={() => {
                  removeImage(image.uri);
                  if (images.length === 1) setShowForm(false);
                }}>
                  <Icon name="close" size={16} color="#FFFFFF" />
                </Pressable>
              </View>
            ))}
            {images.length < MAX_IMAGES && (
              <Pressable style={styles.addMoreButton} onPress={() => setShowForm(false)}>
                <Icon name="plus" size={32} color={boothLensColors.primary} />
                <Text style={styles.addMoreText}>Add</Text>
              </Pressable>
            )}
          </ScrollView>

          <View style={styles.formCardDark}>
            <Text variant="titleMedium" style={styles.formTitle}>Booth Information</Text>
            <View style={styles.inputRow}>
              <TextInput style={styles.flexInput} label="Width" placeholder="e.g. 3" value={boothWidth} onChangeText={setBoothWidth} keyboardType="decimal-pad" mode="outlined" />
              <TextInput style={styles.flexInput} label="Length" placeholder="e.g. 3" value={boothLength} onChangeText={setBoothLength} keyboardType="decimal-pad" mode="outlined" />
            </View>
            <View style={styles.inputRow}>
              <TextInput style={styles.flexInput} label="Height" placeholder="e.g. 2.5" value={boothHeight} onChangeText={setBoothHeight} keyboardType="decimal-pad" mode="outlined" />
              <TextInput style={styles.flexInput} label="Unit" placeholder="e.g. m, ft" value={boothSizeUnit} onChangeText={setBoothSizeUnit} mode="outlined" />
            </View>
            <TextInput label="Additional Info (Optional)" value={requestInfo} onChangeText={setRequestInfo} multiline mode="outlined" style={styles.textArea} placeholder="e.g. There are xxx in the booth..."/>
            <Button mode="contained" icon="line-scan" onPress={submitAnalyze} disabled={loading} loading={loading} style={styles.submitButton}>
              Submit Analyze
            </Button>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ==========================================
  // 畫面 1：全螢幕相機頁面
  // ==========================================
  return (
    <View style={styles.mainContainer}>
      {hasPermission && device ? (
        <Camera
          style={StyleSheet.absoluteFill}
          device={device}
          outputs={[photoOutput]}
          isActive
          resizeMode="cover"
        />
      ) : (
        <View style={styles.noCameraContainer}>
          <Icon name="camera-off" size={64} color="#FFFFFF" />
          <Text style={styles.noCameraText}>Camera access needed</Text>
        </View>
      )}

      <SafeAreaView style={styles.overlayContainer}>
        {/* 頂部提示 */}
        <View style={styles.cameraTopBar}>
          {images.length > 0 && (
            <View style={styles.photoCounterBadge}>
              <Text style={styles.photoCounterText}>{images.length} / {MAX_IMAGES} Photos</Text>
            </View>
          )}
        </View>

        {/* 底部區域：包含小預覽圖與相機控制列 */}
        <View style={styles.cameraBottomArea}>
          
          {/* 懸浮在相簿按鈕上方的小預覽圖 */}
          {images.length > 0 && (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={styles.cameraSmallPreviewList}
            >
              {images.map(image => (
                <View key={image.uri} style={styles.cameraSmallPreviewCard}>
                  <Image source={{uri: image.uri}} style={styles.previewImage} />
                  <Pressable style={styles.cameraSmallRemoveButton} onPress={() => removeImage(image.uri)}>
                    <Icon name="close" size={12} color="#FFFFFF" />
                  </Pressable>
                </View>
              ))}
            </ScrollView>
          )}

          {/* 相機控制列 */}
          <View style={styles.bottomControls}>
            <Pressable style={styles.sideButton} onPress={pickFromGallery}>
              <Icon name="image-multiple" size={28} color="#FFFFFF" />
            </Pressable>

            <Pressable style={[styles.shutterButton, images.length >= MAX_IMAGES && styles.shutterDisabled]} onPress={takePhoto}>
              <View style={styles.shutterInner} />
            </Pressable>

            <Pressable 
              style={[styles.sideButton, images.length === 0 && styles.sideButtonDisabled]} 
              onPress={confirmPhotos} 
              disabled={images.length === 0}
            >
              <Icon name="check" size={32} color="#FFFFFF" />
              {images.length > 0 && images.length < MAX_IMAGES && (
                <View style={styles.redBadge}>
                  <Text style={styles.badgeText}>{images.length}</Text>
                </View>
              )}
              {images.length === MAX_IMAGES && (
                <View style={styles.greenBadge}>
                  <Text style={styles.badgeText}>{images.length}</Text>
                </View>
              )}
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  // --- 相機畫面樣式 ---
  mainContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  noCameraContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
  },
  noCameraText: {
    color: '#FFFFFF',
    marginTop: 16,
    fontSize: 16,
  },
  overlayContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  cameraTopBar: {
    alignItems: 'center',
    paddingTop: 16,
  },
  photoCounterBadge: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  photoCounterText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  cameraBottomArea: {
    justifyContent: 'flex-end',
  },
  cameraSmallPreviewList: {
    paddingHorizontal: 30, // 讓預覽圖跟底部的相簿按鈕切齊
    paddingBottom: 12,     // 與底部控制列保持一點距離
    gap: 8,
  },
  cameraSmallPreviewCard: {
    width: 48,
    height: 48,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  cameraSmallRemoveButton: {
    position: 'absolute',
    right: 2,
    top: 2,
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  bottomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 30,
    paddingBottom: 30,
  },
  sideButton: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 28,
  },
  sideButtonDisabled: {
    opacity: 0.3,
  },
  redBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF3B30',
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#000',
  },
  greenBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#00FF00',
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#000',
  },
  badgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  shutterButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterDisabled: {
    opacity: 0.5,
  },
  shutterInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
  },

  // --- 表單畫面樣式 ---
  formScreenContainer: {
    flex: 1,
    backgroundColor: boothLensColors.background,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 4,
  },
  headerSpacer: {
    width: 28,
  },
  formHeaderTitle: {
    fontWeight: '800',
    color: boothLensColors.primaryDark,
  },
  formScrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitleDark: {
    color: boothLensColors.primaryDark,
    fontWeight: '800',
  },
  countTextDark: {
    color: boothLensColors.muted,
    fontWeight: '700',
  },
  previewList: {
    gap: 12,
    paddingRight: 16,
    marginBottom: 24,
  },
  previewCardDark: {
    width: 100,
    height: 100,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: boothLensColors.surface,
    borderWidth: 1,
    borderColor: boothLensColors.outline,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  removeButton: {
    position: 'absolute',
    right: 4,
    top: 4,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  addMoreButton: {
    width: 100,
    height: 100,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: boothLensColors.outline,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: boothLensColors.surfaceSoft,
  },
  addMoreText: {
    color: boothLensColors.primary,
    fontWeight: '600',
    marginTop: 4,
  },
  formCardDark: {
    gap: 12,
    padding: 20,
    borderRadius: 24,
    backgroundColor: boothLensColors.surface,
    borderWidth: 1,
    borderColor: boothLensColors.outline,
  },
  formTitle: {
    color: boothLensColors.primaryDark,
    fontWeight: '800',
    marginBottom: 4,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  flexInput: {
    flex: 1,
    backgroundColor: boothLensColors.surface,
  },
  textArea: {
    backgroundColor: boothLensColors.surface,
  },
  submitButton: {
    marginTop: 12,
    borderRadius: 12,
    paddingVertical: 4,
  },
});
