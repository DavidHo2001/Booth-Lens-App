import React, {useState} from 'react';
import {ScrollView, View} from 'react-native';
import {Button, Snackbar, Text, TextInput} from 'react-native-paper';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import {analyzeBooth} from '../api/booth';
import {useAuth} from '../context/AuthContext';

type PickedImage = {
  uri: string;
  type: string;
  name: string;
};

export function CaptureScreen() {
  const {token} = useAuth();
  const [images, setImages] = useState<PickedImage[]>([]);
  const [boothWidth, setBoothWidth] = useState('3');
  const [boothLength, setBoothLength] = useState('3');
  const [boothHeight, setBoothHeight] = useState('2.5');
  const [boothSizeUnit, setBoothSizeUnit] = useState('m');
  const [requestInfo, setRequestInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function pickFromCamera() {
    const result = await launchCamera({mediaType: 'photo'});
    if (result.assets?.length) {
      const picked = result.assets
        .filter(asset => asset.uri && asset.type && asset.fileName)
        .map(asset => ({
          uri: asset.uri!,
          type: asset.type!,
          name: asset.fileName!,
        }));
      setImages(prev => [...prev, ...picked]);
    }
  }

  async function pickFromGallery() {
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
      setImages(prev => [...prev, ...picked]);
    }
  }

  async function submitAnalyze() {
    if (loading) return;
    if (images.length === 0) {
      setMessage('Please select at least one photo');
      return;
    }
    try {
      setLoading(true);
      const referenceCode = await analyzeBooth({
        boothWidth: Number(boothWidth),
        boothLength: Number(boothLength),
        boothHeight: Number(boothHeight),
        boothSizeUnit,
        requestInfo,
        images,
      });
      setMessage(`Analyze request created: ${referenceCode}`);
      setImages([]);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Analyze failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={{padding: 16, gap: 12}}>
      <Text variant="headlineSmall">Booth Analyze</Text>
      <View style={{flexDirection: 'row', gap: 8}}>
        <TextInput style={{flex: 1}} label="Width" value={boothWidth} onChangeText={setBoothWidth} keyboardType="decimal-pad" />
        <TextInput style={{flex: 1}} label="Length" value={boothLength} onChangeText={setBoothLength} keyboardType="decimal-pad" />
      </View>
      <View style={{flexDirection: 'row', gap: 8}}>
        <TextInput style={{flex: 1}} label="Height" value={boothHeight} onChangeText={setBoothHeight} keyboardType="decimal-pad" />
        <TextInput style={{flex: 1}} label="Unit" value={boothSizeUnit} onChangeText={setBoothSizeUnit} />
      </View>
      <TextInput label="Additional Info" value={requestInfo} onChangeText={setRequestInfo} multiline />
      <Button mode="outlined" onPress={pickFromCamera}>
        Take Photo
      </Button>
      <Button mode="outlined" onPress={pickFromGallery}>
        Select From Gallery
      </Button>
      <Text>Selected images: {images.length}</Text>
      <Button mode="contained" onPress={submitAnalyze} loading={loading}>
        Submit Analyze
      </Button>
      <Snackbar visible={!!message} onDismiss={() => setMessage('')}>
        {message}
      </Snackbar>
    </ScrollView>
  );
}

