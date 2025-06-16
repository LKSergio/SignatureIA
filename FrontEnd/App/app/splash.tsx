import React, { useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import LottieView from 'lottie-react-native';
import { useRouter } from 'expo-router';
import { useFonts, Inter_700Bold } from '@expo-google-fonts/inter';

export default function SplashScreen() {
  const router = useRouter();
  const [fontsLoaded] = useFonts({ Inter_700Bold });

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('/onboarding');
    }, 4000); // 5 segundos

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <LottieView
        source={require('../assets/animations/Vaca.json')}
        autoPlay ={true}
        resizeMode="cover"
        loop={true}
        style={{ width: 300, height: 300 }}
      />
      <Text style={styles.text}>¡Bienvenido a SignatureIA 🤖!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#141aa7', // Cambia el color si lo deseas
    alignItems: 'center',
    justifyContent: 'center',
  },
    text: {
    marginTop: 24,
    fontFamily: 'Inter_700Bold',
    fontSize: 22,
    color: '#ecff00',
    
    textAlign: 'center',
  },
});