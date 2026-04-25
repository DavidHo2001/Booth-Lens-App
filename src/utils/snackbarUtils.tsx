import Toast, {BaseToast, ErrorToast, ToastConfig} from 'react-native-toast-message';

export const snackbarConfig: ToastConfig = {
  success: props => (
    <BaseToast
      {...props}
      style={{backgroundColor: '#b2e1b2'}}
      contentContainerStyle={{paddingHorizontal: 12}}
      text1NumberOfLines={2}
      text2NumberOfLines={3}
    />
  ),
  error: props => (
    <ErrorToast
      {...props}
      style={{backgroundColor: '#ffc0cb'}}
      contentContainerStyle={{paddingHorizontal: 12}}
      text1NumberOfLines={2}
      text2NumberOfLines={3}
    />
  ),
};

type SnackbarOptions = {
  title?: string;
};

export function showError(message: string, options?: SnackbarOptions) {
  Toast.show({
    type: 'error',
    text1: options?.title ?? 'Error',
    text2: message,
    topOffset: 56,
    visibilityTime: 3000,
    position: 'top',
  });
}

export function showSuccess(message: string, options?: SnackbarOptions) {
  Toast.show({
    type: 'success',
    text1: options?.title ?? 'Success',
    text2: message,
    topOffset: 56,
    visibilityTime: 3000,
    position: 'top',
  });
}

export function hideSnackbar() {
  Toast.hide();
}
