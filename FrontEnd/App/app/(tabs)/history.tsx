import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { CheckCircle2, XCircle, Calendar, Clock } from 'lucide-react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

interface HistoryItem {
  id: string;
  date: string;
  time: string;
  result: 'authentic' | 'fake';
  confidence: number;
  referenceImage: string;
  testImage: string;
}

// Mock data for demonstration
const historyData: HistoryItem[] = [
  {
    id: '1',
    date: '2025-01-12',
    time: '14:30',
    result: 'authentic',
    confidence: 94,
    referenceImage: 'https://images.pexels.com/photos/5668882/pexels-photo-5668882.jpeg',
    testImage: 'https://images.pexels.com/photos/5668856/pexels-photo-5668856.jpeg',
  },
  {
    id: '2',
    date: '2025-01-12',
    time: '11:15',
    result: 'fake',
    confidence: 87,
    referenceImage: 'https://images.pexels.com/photos/4173624/pexels-photo-4173624.jpeg',
    testImage: 'https://images.pexels.com/photos/4173610/pexels-photo-4173610.jpeg',
  },
  {
    id: '3',
    date: '2025-01-11',
    time: '16:45',
    result: 'authentic',
    confidence: 91,
    referenceImage: 'https://images.pexels.com/photos/7319336/pexels-photo-7319336.jpeg',
    testImage: 'https://images.pexels.com/photos/7319297/pexels-photo-7319297.jpeg',
  },
];

export default function HistoryScreen() {
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const renderHistoryItem = (item: HistoryItem, index: number) => (
    <Animated.View
      key={item.id}
      entering={FadeInUp.delay(index * 100).duration(600)}
      style={styles.historyItem}
    >
      <TouchableOpacity
        onPress={() => setSelectedItem(selectedItem?.id === item.id ? null : item)}
        activeOpacity={0.8}
      >
        <View style={styles.historyHeader}>
          <View style={styles.resultIndicator}>
            {item.result === 'authentic' ? (
              <CheckCircle2 size={24} color="#10B981" strokeWidth={2} />
            ) : (
              <XCircle size={24} color="#EF4444" strokeWidth={2} />
            )}
            <View style={styles.resultText}>
              <Text style={[
                styles.resultLabel,
                { color: item.result === 'authentic' ? '#10B981' : '#EF4444' }
              ]}>
                {item.result === 'authentic' ? 'Authentic' : 'Suspicious'}
              </Text>
              <Text style={styles.confidenceText}>
                {item.confidence}% confidence
              </Text>
            </View>
          </View>

          <View style={styles.dateTimeContainer}>
            <View style={styles.dateTime}>
              <Calendar size={14} color="#9CA3AF" strokeWidth={2} />
              <Text style={styles.dateText}>{formatDate(item.date)}</Text>
            </View>
            <View style={styles.dateTime}>
              <Clock size={14} color="#9CA3AF" strokeWidth={2} />
              <Text style={styles.timeText}>{item.time}</Text>
            </View>
          </View>
        </View>

        {selectedItem?.id === item.id && (
          <Animated.View entering={FadeInUp.duration(300)} style={styles.expandedContent}>
            <Text style={styles.sectionTitle}>Signature Comparison</Text>
            <View style={styles.imageComparison}>
              <View style={styles.comparisonImage}>
                <Text style={styles.imageLabel}>Reference</Text>
                <Image source={{ uri: item.referenceImage }} style={styles.thumbnail} />
              </View>
              <View style={styles.comparisonImage}>
                <Text style={styles.imageLabel}>Verified</Text>
                <Image source={{ uri: item.testImage }} style={styles.thumbnail} />
              </View>
            </View>
            
            <View style={styles.analysisDetails}>
              <Text style={styles.sectionTitle}>Analysis Details</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Match Confidence:</Text>
                <Text style={styles.detailValue}>{item.confidence}%</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Processing Time:</Text>
                <Text style={styles.detailValue}>2.3 seconds</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Algorithm Version:</Text>
                <Text style={styles.detailValue}>v2.1.4</Text>
              </View>
            </View>
          </Animated.View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <LinearGradient colors={['#1a1a2e', '#16213e']} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Verification History</Text>
        <Text style={styles.subtitle}>Review your past signature verifications</Text>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {historyData.length > 0 ? (
          historyData.map((item, index) => renderHistoryItem(item, index))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No History Yet</Text>
            <Text style={styles.emptyDescription}>
              Your signature verification history will appear here
            </Text>
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 24,
    alignItems: 'center',
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  historyItem: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  resultIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  resultText: {
    marginLeft: 12,
  },
  resultLabel: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  confidenceText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },
  dateTimeContainer: {
    alignItems: 'flex-end',
  },
  dateTime: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#9CA3AF',
    marginLeft: 6,
  },
  timeText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#9CA3AF',
    marginLeft: 6,
  },
  expandedContent: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  imageComparison: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  comparisonImage: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  imageLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 8,
  },
  thumbnail: {
    width: '100%',
    height: 80,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  analysisDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  detailLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255,255,255,0.7)',
  },
  detailValue: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#ffffff',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
  },
});