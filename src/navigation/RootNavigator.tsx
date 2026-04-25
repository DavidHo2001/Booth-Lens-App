import React from 'react';
import {Image, StyleSheet, View} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {ActivityIndicator, Text} from 'react-native-paper';
import {useAuth} from '../context/AuthContext';
import {LoginScreen} from '../screens/LoginScreen';
import {RegisterScreen} from '../screens/RegisterScreen';
import {MainTabs} from './MainTabs';
import {boothLensColors, navigationTheme} from '../theme/theme';

const Stack = createNativeStackNavigator();

function LoadingScreen() {
  return (
    <View style={styles.loadingContainer}>
      <Image
        source={require('../assets/Booth-Lens-Icon-Transparent.png')}
        style={styles.loadingLogo}
        resizeMode="contain"
      />
      <Text variant="headlineSmall" style={styles.loadingTitle}>
        Booth Lens
      </Text>
      <Text variant="bodyLarge" style={styles.loadingSubtitle}>
        Your Reliable Trade Show Partner
      </Text>
      <ActivityIndicator style={styles.loadingIndicator} size="large" />
    </View>
  );
}

export function RootNavigator() {
  const {initializing, token} = useAuth();

  if (initializing) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator>
        {token ? (
          <Stack.Screen
            name="Main"
            component={MainTabs}
            options={{headerShown: false}}
          />
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
    backgroundColor: boothLensColors.background,
  },
  loadingLogo: {
    width: 160,
    height: 160,
    marginBottom: 18,
  },
  loadingTitle: {
    color: boothLensColors.primaryDark,
    fontWeight: '800',
  },
  loadingSubtitle: {
    color: boothLensColors.muted,
    marginTop: 6,
    textAlign: 'center',
  },
  loadingIndicator: {
    marginTop: 28,
  },
});

