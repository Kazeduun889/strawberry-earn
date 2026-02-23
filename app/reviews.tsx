import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, FlatList } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { MockDB } from '../services/mockDb';
import { Review } from '../services/types';

export default function ReviewsScreen() {
  const router = useRouter();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [newReview, setNewReview] = useState('');
  const [rating, setRating] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    const data = await MockDB.getReviews();
    setReviews(data);
  };

  const handleSubmit = async () => {
    if (!newReview.trim()) {
      Alert.alert('Ошибка', 'Напишите текст отзыва');
      return;
    }

    setIsSubmitting(true);
    const success = await MockDB.addReview(newReview, rating);
    setIsSubmitting(false);

    if (success) {
      Alert.alert('Спасибо!', 'Ваш отзыв добавлен');
      setNewReview('');
      loadReviews();
    } else {
      Alert.alert('Ошибка', 'Не удалось отправить отзыв (возможно, вы не создали таблицу reviews в SQL)');
    }
  };

  const renderStars = (count: number, setRate?: (r: number) => void) => {
    return (
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity 
            key={star} 
            onPress={() => setRate && setRate(star)}
            disabled={!setRate}
          >
            <Text style={[styles.star, star <= count ? styles.starFilled : styles.starEmpty]}>★</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Назад</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Отзывы</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Write Review Section */}
        <View style={styles.writeCard}>
          <Text style={styles.writeTitle}>Оставить отзыв</Text>
          {renderStars(rating, setRating)}
          <TextInput
            style={styles.input}
            placeholder="Напишите ваш отзыв..."
            value={newReview}
            onChangeText={setNewReview}
            multiline
          />
          <TouchableOpacity 
            style={[styles.submitButton, isSubmitting && styles.disabledButton]} 
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <Text style={styles.submitText}>{isSubmitting ? 'Отправка...' : 'Отправить'}</Text>
          </TouchableOpacity>
        </View>

        {/* Reviews List */}
        <Text style={styles.listTitle}>Последние отзывы ({reviews.length})</Text>
        {reviews.length === 0 ? (
          <Text style={styles.emptyText}>Пока нет отзывов. Будьте первым!</Text>
        ) : (
          reviews.map((item) => (
            <View key={item.id} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <Text style={styles.reviewUser}>{item.username}</Text>
                {renderStars(item.rating)}
              </View>
              <Text style={styles.reviewContent}>{item.content}</Text>
              <Text style={styles.reviewDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
            </View>
          ))
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#eee' },
  backButton: { marginRight: 15 },
  backButtonText: { fontSize: 18, color: '#007AFF' },
  title: { fontSize: 20, fontWeight: 'bold' },
  content: { padding: 20 },
  writeCard: { backgroundColor: 'white', padding: 20, borderRadius: 15, marginBottom: 30, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5, elevation: 3 },
  writeTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  starsRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 15 },
  star: { fontSize: 32, marginHorizontal: 5, color: '#ccc' },
  starFilled: { color: '#FFD700' },
  starEmpty: { color: '#ddd' },
  input: { backgroundColor: '#f9f9f9', padding: 15, borderRadius: 10, minHeight: 80, marginBottom: 15, textAlignVertical: 'top' },
  submitButton: { backgroundColor: '#007AFF', padding: 15, borderRadius: 10, alignItems: 'center' },
  disabledButton: { opacity: 0.7 },
  submitText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  listTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  emptyText: { textAlign: 'center', color: '#999', marginTop: 20 },
  reviewCard: { backgroundColor: 'white', padding: 15, borderRadius: 10, marginBottom: 10 },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  reviewUser: { fontWeight: 'bold', fontSize: 16 },
  reviewContent: { fontSize: 14, color: '#333', marginBottom: 5 },
  reviewDate: { fontSize: 12, color: '#999', textAlign: 'right' }
});