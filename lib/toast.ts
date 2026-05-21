import Toast from 'react-native-toast-message';

export const toast = {
  success: (message: string, title = 'Done') =>
    Toast.show({ type: 'success', text1: title, text2: message, visibilityTime: 2800 }),

  info: (message: string, title?: string) =>
    Toast.show({ type: 'info', text1: title ?? message, text2: title ? message : undefined, visibilityTime: 2500 }),

  error: (message: string, title = 'Error') =>
    Toast.show({ type: 'error', text1: title, text2: message, visibilityTime: 3500 }),
};
