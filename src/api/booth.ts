import axiosService from './axios';

export async function analyzeBooth(
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

  const {data} = await axiosService.post<string>('/api/v1/booth/analyze', formData);
  return data;
}

