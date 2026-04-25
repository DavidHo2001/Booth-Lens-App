import 'react-native-gesture-handler';
import React from 'react';
import {StatusBar} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {PaperProvider} from 'react-native-paper';
import Toast from 'react-native-toast-message';
import {AuthProvider} from './src/context/AuthContext';
import {RootNavigator} from './src/navigation/RootNavigator';
import {appTheme} from './src/theme/theme';
import {snackbarConfig} from './src/utils/snackbarUtils';

function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={appTheme}>
        <StatusBar barStyle="dark-content" />
        <AuthProvider>
          <RootNavigator />
        </AuthProvider>
        <Toast config={snackbarConfig} />
      </PaperProvider>
    </SafeAreaProvider>
  );
}

export default App;
