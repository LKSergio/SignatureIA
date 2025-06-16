import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState, useRef } from 'react';
import { FlatList } from 'react-native';
import { Camera, Shield, CheckCircle, ArrowRight } from 'lucide-react-native';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

const onboardingData = [
  {
    id: '1',
    title: 'Capture Signatures',
    description: 'Take photos or select images of signatures you want to verify',
    icon: Camera,
    color: '#4F46E5',
  },
  {
    id: '2',
    title: 'AI-Powered Analysis',
    description: 'Our advanced AI compares signatures to detect authenticity',
    icon: Shield,
    color: '#7C3AED',
  },
  {
    id: '3',
    title: 'Instant Results',
    description: 'Get accurate verification results in seconds',
    icon: CheckCircle,
    color: '#059669',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const goToNext = () => {
    if (currentIndex < onboardingData.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
    } else {
      router.replace('/(tabs)');
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      setCurrentIndex(prevIndex);
      flatListRef.current?.scrollToIndex({ index: prevIndex, animated: true });
    }
  };

  const renderItem = ({ item, index }: { item: typeof onboardingData[0]; index: number }) => {
    const IconComponent = item.icon;
    
    return (
      <View style={styles.slide}>
        <LinearGradient
          colors={['#1a1a2e', '#16213e', '#0f3460']}
          style={styles.gradient}
        >
          <Animated.View 
            entering={FadeInUp.delay(200).duration(800)}
            style={styles.iconContainer}
          >
            <View style={[styles.iconCircle, { backgroundColor: item.color }]}>
              <IconComponent size={60} color="white" strokeWidth={1.5} />
            </View>
          </Animated.View>

          <Animated.View 
            entering={FadeInUp.delay(400).duration(800)}
            style={styles.textContainer}
          >
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.description}>{item.description}</Text>
          </Animated.View>
        </LinearGradient>
      </View>
    );
  };

  const renderDots = () => {
    return (
      <View style={styles.dotsContainer}>
        {onboardingData.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              {
                backgroundColor: index === currentIndex ? '#4F46E5' : '#rgba(255,255,255,0.3)',
                width: index === currentIndex ? 24 : 8,
              },
            ]}
          />
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={onboardingData}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
      />

      <Animated.View 
        entering={FadeInDown.delay(600).duration(800)}
        style={styles.bottomContainer}
      >
        {renderDots()}
        
        <View style={styles.buttonContainer}>
          {currentIndex > 0 && (
            <TouchableOpacity
              style={[styles.button, styles.backButton]}
              onPress={goToPrevious}
            >
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={[styles.button, styles.nextButton]}
            onPress={goToNext}
          >
            <LinearGradient
              colors={['#4F46E5', '#7C3AED']}
              style={styles.nextButtonGradient}
            >
              <Text style={styles.nextButtonText}>
                {currentIndex === onboardingData.length - 1 ? 'Get Started' : 'Next'}
              </Text>
              <ArrowRight size={20} color="white" strokeWidth={2} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  slide: {
    width,
    height,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  iconContainer: {
    marginBottom: 60,
  },
  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 18,
    fontFamily: 'Inter-Regular',
    color: '#rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 26,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    paddingHorizontal: 32,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  button: {
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    minWidth: 100,
  },
  backButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
  },
  nextButton: {
    flex: 1,
    marginLeft: 16,
  },
  nextButtonGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  nextButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginRight: 8,
  },
});