import React, {useEffect, useState} from 'react';
import {Image, Pressable, ScrollView, StyleSheet, View} from 'react-native';
import {Button, Text, TextInput} from 'react-native-paper';
import {launchImageLibrary} from 'react-native-image-picker';
import {Camera, useCameraDevice, useCameraPermission, usePhotoOutput} from 'react-native-vision-camera';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {analyzeBooth} from '../api/booth';
import {useAuth} from '../context/AuthContext';
import {boothLensColors} from '../theme/theme';
import {showError, showSuccess} from '../utils/snackbarUtils';

type PickedImage = {
  uri: string;
  type: string;
  name: string;
};

export function BoothAnalyzeScreen() {
  const {token} = useAuth();
  const device = useCameraDevice('back');
  const photoOutput = usePhotoOutput({quality: 0.9});
  const {hasPermission, requestPermission} = useCameraPermission();
  const [images, setImages] = useState<PickedImage[]>([]);
  const [boothWidth, setBoothWidth] = useState('3');
  const [boothLength, setBoothLength] = useState('3');
  const [boothHeight, setBoothHeight] = useState('2.5');
  const [boothSizeUnit, setBoothSizeUnit] = useState('m');
  const [requestInfo, setRequestInfo] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission, requestPermission]);

  function appendPickedImages(assets: NonNullable<Awaited<ReturnType<typeof launchImageLibrary>>['assets']>) {
    const picked = assets
      .filter(asset => asset.uri && asset.type && asset.fileName)
      .map(asset => ({
        uri: asset.uri!,
        type: asset.type!,
        name: asset.fileName!,
      }));
    setImages(prev => [...prev, ...picked]);
  }

  async function takePhoto() {
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
      setImages(prev => [
        ...prev,
        {
          uri,
          type: 'image/jpeg',
          name: photo.filePath.split('/').pop() ?? `booth-${Date.now()}.jpg`,
        },
      ]);
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Unable to take photo');
    }
  }

  async function pickFromGallery() {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      selectionLimit: 8,
    });
    if (result.didCancel) {
      return;
    }
    if (result.errorCode) {
      showError(result.errorMessage ?? 'Unable to open gallery');
      return;
    }
    if (result.assets?.length) {
      appendPickedImages(result.assets);
    }
  }

  function removeImage(uri: string) {
    setImages(prev => prev.filter(image => image.uri !== uri));
  }

  async function submitAnalyze() {
    if (!token) {
      return;
    }
    if (images.length === 0) {
      showError('Please select at least one photo');
      return;
    }
    try {
      setLoading(true);
      const referenceCode = await analyzeBooth(token, {
        boothWidth: Number(boothWidth),
        boothLength: Number(boothLength),
        boothHeight: Number(boothHeight),
        boothSizeUnit,
        requestInfo,
        images,
      });
      showSuccess(`Analyze request created: ${referenceCode}`);
      setImages([]);
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Analyze failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.heroCard}>
        <Text variant="headlineSmall" style={styles.title}>
          Scan Your Booth
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Capture booth photos first, then add dimensions for analysis.
        </Text>

        {/* Camera-first area matching the requested scan workflow. */}
        <View style={styles.cameraPanel}>
          {hasPermission && device ? (
            <Camera
              style={StyleSheet.absoluteFill}
              device={device}
              outputs={[photoOutput]}
              isActive
              resizeMode="cover"
            />
          ) : (
            <>
              <Icon name="camera-iris" size={72} color={boothLensColors.primary} />
              <Text variant="titleMedium" style={styles.cameraTitle}>
                Camera access needed
              </Text>
              <Text style={styles.cameraHint}>
                Allow camera access to scan directly in Booth Lens.
              </Text>
            </>
          )}
          <View style={styles.cameraOverlay} />
          <Button
            mode="contained"
            icon="camera"
            onPress={takePhoto}
            style={styles.cameraButton}>
            Take Photo
          </Button>
          <Pressable style={styles.galleryButton} onPress={pickFromGallery}>
            <Icon name="image-multiple-outline" size={22} color={boothLensColors.primaryDark} />
            <Text style={styles.galleryText}>Gallery</Text>
          </Pressable>
        </View>
      </View>

      {images.length > 0 ? (
        <>
          <View style={styles.sectionHeader}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Selected Photos
            </Text>
            <Text style={styles.countText}>{images.length} photo(s)</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.previewList}>
            {images.map(image => (
              <View key={image.uri} style={styles.previewCard}>
                <Image source={{uri: image.uri}} style={styles.previewImage} />
                <Pressable style={styles.removeButton} onPress={() => removeImage(image.uri)}>
                  <Icon name="close" size={16} color="#FFFFFF" />
                </Pressable>
              </View>
            ))}
          </ScrollView>

          <View style={styles.formCard}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Booth Information
            </Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.flexInput}
                label="Width"
                value={boothWidth}
                onChangeText={setBoothWidth}
                keyboardType="decimal-pad"
              />
              <TextInput
                style={styles.flexInput}
                label="Length"
                value={boothLength}
                onChangeText={setBoothLength}
                keyboardType="decimal-pad"
              />
            </View>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.flexInput}
                label="Height"
                value={boothHeight}
                onChangeText={setBoothHeight}
                keyboardType="decimal-pad"
              />
              <TextInput
                style={styles.flexInput}
                label="Unit"
                value={boothSizeUnit}
                onChangeText={setBoothSizeUnit}
              />
            </View>
            <TextInput
              label="Additional Info"
              value={requestInfo}
              onChangeText={setRequestInfo}
              multiline
            />
            <Button mode="contained" icon="line-scan" onPress={submitAnalyze} loading={loading}>
              Submit Analyze
            </Button>
          </View>
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
    backgroundColor: boothLensColors.background,
  },
  heroCard: {
    padding: 18,
    borderRadius: 28,
    backgroundColor: boothLensColors.surface,
    borderWidth: 1,
    borderColor: boothLensColors.outline,
  },
  title: {
    color: boothLensColors.primaryDark,
    fontWeight: '800',
  },
  subtitle: {
    marginTop: 4,
    marginBottom: 16,
    color: boothLensColors.muted,
  },
  cameraPanel: {
    minHeight: 360,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: boothLensColors.surfaceSoft,
    borderWidth: 1,
    borderColor: boothLensColors.outline,
  },
  cameraTitle: {
    marginTop: 12,
    color: boothLensColors.primaryDark,
    fontWeight: '800',
  },
  cameraHint: {
    marginTop: 6,
    marginBottom: 18,
    color: boothLensColors.muted,
    textAlign: 'center',
  },
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(13,79,128,0.16)',
  },
  cameraButton: {
    borderRadius: 999,
    paddingHorizontal: 12,
    zIndex: 2,
  },
  galleryButton: {
    position: 'absolute',
    left: 16,
    bottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.82)',
    zIndex: 2,
  },
  galleryText: {
    color: boothLensColors.primaryDark,
    fontWeight: '800',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: boothLensColors.primaryDark,
    fontWeight: '800',
  },
  countText: {
    color: boothLensColors.muted,
    fontWeight: '700',
  },
  previewList: {
    gap: 12,
    paddingRight: 16,
  },
  previewCard: {
    width: 112,
    height: 112,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: boothLensColors.surface,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  removeButton: {
    position: 'absolute',
    right: 8,
    top: 8,
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    backgroundColor: 'rgba(13,79,128,0.88)',
  },
  formCard: {
    gap: 12,
    padding: 16,
    borderRadius: 24,
    backgroundColor: boothLensColors.surface,
    borderWidth: 1,
    borderColor: boothLensColors.outline,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  flexInput: {
    flex: 1,
  },
});

