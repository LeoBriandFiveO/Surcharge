import { Alert as NativeAlert, Platform, type AlertButton } from 'react-native';

// Alert.alert ne fait rien sur le web : on utilise alors les boîtes de dialogue du navigateur.
function alert(title: string, message?: string, buttons?: AlertButton[]) {
  if (Platform.OS !== 'web') {
    NativeAlert.alert(title, message, buttons);
    return;
  }
  const text = message ? `${title}\n\n${message}` : title;
  const action = buttons?.find((b) => b.style !== 'cancel');
  if (!buttons || buttons.length <= 1) {
    window.alert(text);
    action?.onPress?.();
    return;
  }
  if (window.confirm(text)) action?.onPress?.();
  else buttons.find((b) => b.style === 'cancel')?.onPress?.();
}

export const Alert = { alert };
