import axiosService from './axios';

export async function analyzeBooth(
  token: string,
  payload: {
    boothWidth: number;
    boothLength: number;
    boothHeight: number;
    boothSizeUnit: string;
    requestInfo?: string;
    images: Array<{uri: string; type: string; name: string}>;
  },
): Promise<string> {
  const formData = new FormData();
  payload.images.forEach(image => {
    formData.append('images', image as unknown as Blob);
  });

  formData.append('boothWidth', String(payload.boothWidth));
  formData.append('boothLength', String(payload.boothLength));
  formData.append('boothHeight', String(payload.boothHeight));
  formData.append('boothSizeUnit', payload.boothSizeUnit);
  formData.append('requestInfo', payload.requestInfo ?? '');

  const response = await axiosService.post('/api/v1/booth/analyze', formData, {
    headers: token ? {Authorization: `Bearer ${token}`} : undefined,
  });
  if (response.status !== 200) {
    throw new Error('Failed to analyze booth');
  }
  return response.data;
}

