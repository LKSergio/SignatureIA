import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { Camera, ImageIcon, Upload, CheckCircle2, XCircle, RefreshCw } from 'lucide-react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

interface SignatureImage {
  uri: string;
  label: string;
}

export default function VerifyScreen() {
  const [referenceImage, setReferenceImage] = useState<SignatureImage | null>(null);
  const [testImage, setTestImage] = useState<SignatureImage | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<CameraType>('back');
  const [activeImageType, setActiveImageType] = useState<'reference' | 'test' | null>(null);
  const [verificationResult, setVerificationResult] = useState<'authentic' | 'fake' | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [permission, requestPermission] = useCameraPermissions();

  const openCamera = async (imageType: 'reference' | 'test') => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('Permission required', 'Camera permission is needed to take photos');
        return;
      }
    }
    
    setActiveImageType(imageType);
    setShowCamera(true);
  };

  const pickImage = async (imageType: 'reference' | 'test') => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
      base64: false, // <--- asegúrate de que esto esté en false o no esté presente
    });

    if (!result.canceled && result.assets[0]) {
      const label = imageType === 'reference' ? 'Reference Signature' : 'Signature to Verify';
      const imageData = { uri: result.assets[0].uri, label };
      
      if (imageType === 'reference') {
        setReferenceImage(imageData);
      } else {
        setTestImage(imageData);
      }
    }
  };

  const takePicture = async (camera: any) => {
    if (camera && activeImageType) {
      const photo = await camera.takePictureAsync();
      const label = activeImageType === 'reference' ? 'Reference Signature' : 'Signature to Verify';
      const imageData = { uri: photo.uri, label };
      
      if (activeImageType === 'reference') {
        setReferenceImage(imageData);
      } else {
        setTestImage(imageData);
      }
      
      setShowCamera(false);
      setActiveImageType(null);
    }
  };

  function base64ToBlob(base64: string, mime: string) {
    const byteChars = atob(base64);
    const byteNumbers = new Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++) {
      byteNumbers[i] = byteChars.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mime });
  }

  function getImageFileFromDataUri(dataUri: string, fileName: string) {
    const [meta, base64] = dataUri.split(',');
    const match = meta.match(/data:(.*);base64/);
    if (!match) {
      throw new Error('Invalid data URI format');
    }
    const mime = match[1];
    const blob = base64ToBlob(base64, mime);
    // En web, usamos File, en móvil usamos Blob (pero móvil no debería necesitar esto)
    if (Platform.OS === 'web') {
      return new File([blob], fileName, { type: mime });
    } else {
      return blob;
    }
  }

  const analyzeSignatures = async () => {
    if (!referenceImage || !testImage) {
      Alert.alert('Missing Images', 'Please capture both signatures before analyzing');
      return;
    }

    setIsAnalyzing(true);
    setVerificationResult(null);

    try {
      let referenceFile = referenceImage.uri;
      let testFile = testImage.uri;

      // Si estamos en web y el uri es base64, convertir a File o Blob
      let referenceUpload: string | Blob | File = referenceFile;
      let testUpload: string | Blob | File = testFile;

      if (Platform.OS === 'web') {
        if (referenceFile.startsWith('data:')) {
          referenceUpload = getImageFileFromDataUri(referenceFile, 'reference.jpg');
        }
        if (testFile.startsWith('data:')) {
          testUpload = getImageFileFromDataUri(testFile, 'test.jpg');
        }
      }

      const formData = new FormData();

      if (Platform.OS === 'web') {
        formData.append('reference', referenceUpload);
        formData.append('test', testUpload);
      } else {
        formData.append('reference', {
          uri: referenceImage.uri,
          name: 'reference.jpg',
          type: 'image/jpeg',
        } as any);
        formData.append('test', {
          uri: testImage.uri,
          name: 'test.jpg',
          type: 'image/jpeg',
        } as any);
      }

      const response = await fetch('http://192.168.41.49:8000/verify-signature/', {
        method: 'POST',
        body: formData,
      });

      const text = await response.text();
      console.log('Backend response:', text);

      let data;
      try {
        data = JSON.parse(text);
        // Tu backend responde con "Verdadera" o "Falsificada"
        setVerificationResult(data.result === 'Verdadera' ? 'authentic' : 'fake');
      } catch (e) {
        Alert.alert('Error', 'Respuesta inesperada del backend');
      }
    } catch (error) {
      console.log('Fetch error:', error);
      Alert.alert('Error', 'Failed to analyze signatures');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetAnalysis = () => {
    setReferenceImage(null);
    setTestImage(null);
    setVerificationResult(null);
    setIsAnalyzing(false);
  };

  if (showCamera) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          facing={cameraFacing}
          ref={(ref) => {
            if (ref) {
              // Store camera reference for taking pictures
              (ref as any).takePictureAsync = (ref as any).takePictureAsync?.bind(ref);
            }
          }}
        >
          <View style={styles.cameraOverlay}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                setShowCamera(false);
                setActiveImageType(null);
              }}
            >
              <XCircle size={32} color="white" />
            </TouchableOpacity>

            <View style={styles.cameraControls}>
              <TouchableOpacity
                style={styles.captureButton}
                onPress={() => takePicture}
              >
                <View style={styles.captureButtonInner} />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.flipButton}
                onPress={() => setCameraFacing(current => current === 'back' ? 'front' : 'back')}
              >
                <RefreshCw size={24} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        </CameraView>
      </View>
    );
  }

  return (
    <LinearGradient colors={['#1a1a2e', '#16213e']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInUp.duration(800)} style={styles.header}>
          <Text style={styles.title}>Signature Verification</Text>
          <Text style={styles.subtitle}>Upload or capture signatures to verify authenticity</Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(200).duration(800)} style={styles.imagesContainer}>
          {/* Reference Image */}
          <View style={styles.imageCard}>
            <Text style={styles.imageLabel}>Reference Signature</Text>
            {referenceImage ? (
              <Image source={{ uri: referenceImage.uri }} style={styles.imagePreview} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <ImageIcon size={48} color="#6B7280" strokeWidth={1.5} />
                <Text style={styles.placeholderText}>No image selected</Text>
              </View>
            )}
            
            <View style={styles.imageButtons}>
              <TouchableOpacity
                style={styles.imageButton}
                onPress={() => openCamera('reference')}
              >
                <Camera size={20} color="#4F46E5" strokeWidth={2} />
                <Text style={styles.imageButtonText}>Camera</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.imageButton}
                onPress={() => pickImage('reference')}
              >
                <Upload size={20} color="#4F46E5" strokeWidth={2} />
                <Text style={styles.imageButtonText}>Gallery</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Test Image */}
          <View style={styles.imageCard}>
            <Text style={styles.imageLabel}>Signature to Verify</Text>
            {testImage ? (
              <Image source={{ uri: testImage.uri }} style={styles.imagePreview} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <ImageIcon size={48} color="#6B7280" strokeWidth={1.5} />
                <Text style={styles.placeholderText}>No image selected</Text>
              </View>
            )}
            
            <View style={styles.imageButtons}>
              <TouchableOpacity
                style={styles.imageButton}
                onPress={() => openCamera('test')}
              >
                <Camera size={20} color="#4F46E5" strokeWidth={2} />
                <Text style={styles.imageButtonText}>Camera</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.imageButton}
                onPress={() => pickImage('test')}
              >
                <Upload size={20} color="#4F46E5" strokeWidth={2} />
                <Text style={styles.imageButtonText}>Gallery</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

        {/* Analysis Section */}
        <Animated.View entering={FadeInUp.delay(400).duration(800)} style={styles.analysisContainer}>
          {verificationResult && (
            <View style={[
              styles.resultCard,
              { backgroundColor: verificationResult === 'authentic' ? '#065F46' : '#7F1D1D' }
            ]}>
              {verificationResult === 'authentic' ? (
                <CheckCircle2 size={32} color="#10B981" strokeWidth={2} />
              ) : (
                <XCircle size={32} color="#EF4444" strokeWidth={2} />
              )}
              <Text style={styles.resultTitle}>
                {verificationResult === 'authentic' ? 'Signature Authentic' : 'Signature Suspicious'}
              </Text>
              <Text style={styles.resultDescription}>
                {verificationResult === 'authentic' 
                  ? 'The signature appears to be genuine based on our analysis'
                  : 'The signature shows signs of forgery or inconsistencies'
                }
              </Text>
            </View>
          )}

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[
                styles.analyzeButton,
                (!referenceImage || !testImage || isAnalyzing) && styles.disabledButton
              ]}
              onPress={analyzeSignatures}
              disabled={!referenceImage || !testImage || isAnalyzing}
            >
              <LinearGradient
                colors={isAnalyzing ? ['#6B7280', '#4B5563'] : ['#4F46E5', '#7C3AED']}
                style={styles.analyzeButtonGradient}
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw size={20} color="white" strokeWidth={2} />
                    <Text style={styles.analyzeButtonText}>Analyzing...</Text>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={20} color="white" strokeWidth={2} />
                    <Text style={styles.analyzeButtonText}>Verify Signatures</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {(referenceImage || testImage || verificationResult) && (
              <TouchableOpacity style={styles.resetButton} onPress={resetAnalysis}>
                <Text style={styles.resetButtonText}>Reset</Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 100,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 22,
  },
  imagesContainer: {
    gap: 20,
    marginBottom: 32,
  },
  imageCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  imageLabel: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
    marginBottom: 16,
    textAlign: 'center',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginBottom: 16,
  },
  imagePlaceholder: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
    borderStyle: 'dashed',
  },
  placeholderText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginTop: 8,
  },
  imageButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  imageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(79,70,229,0.1)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4F46E5',
    gap: 8,
  },
  imageButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#4F46E5',
  },
  analysisContainer: {
    gap: 20,
  },
  resultCard: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 8,
  },
  resultTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#ffffff',
    marginTop: 12,
    marginBottom: 8,
  },
  resultDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 20,
  },
  actionButtons: {
    gap: 12,
  },
  analyzeButton: {
    borderRadius: 12,
  },
  analyzeButtonGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  analyzeButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  disabledButton: {
    opacity: 0.6,
  },
  resetButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  resetButtonText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  closeButton: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
  },
  cameraControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 40,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'white',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
  },
  flipButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 25,
    padding: 12,
  },
  
});
