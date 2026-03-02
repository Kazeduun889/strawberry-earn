import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, KeyboardAvoidingView, Platform, Image, Alert } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MockDB } from '../../services/mockDb';
import { SupportMessage } from '../../services/types';

export default function AdminChatScreen() {
  const router = useRouter();
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [reply, setReply] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (userId) {
      loadMessages();
      const interval = setInterval(loadMessages, 5000);
      return () => clearInterval(interval);
    }
  }, [userId]);

  const loadMessages = async () => {
    if (!userId) return;
    const data = await MockDB.getAdminUserMessages(userId);
    setMessages(data);
  };

  const handleSend = async () => {
    console.log('handleSend triggered. UserId:', userId, 'Reply length:', reply.trim().length);
    
    if (!reply.trim()) return;
    
    if (!userId) {
      if (Platform.OS === 'web') window.alert('Ошибка: ID пользователя не найден');
      else Alert.alert('Ошибка', 'ID пользователя не найден');
      return;
    }

    setIsSending(true);
    try {
      const success = await MockDB.sendAdminReply(userId, reply.trim());
      if (success) {
        setReply('');
        await loadMessages();
      } else {
        if (Platform.OS === 'web') window.alert('Ошибка при отправке ответа в БД');
        else Alert.alert('Ошибка', 'Не удалось отправить ответ в БД');
      }
    } catch (e) {
      console.error('handleSend exception:', e);
      if (Platform.OS === 'web') window.alert('Критическая ошибка при отправке');
      else Alert.alert('Ошибка', 'Критическая ошибка при отправке');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Назад</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Чат с {userId?.substring(0, 6)}...</Text>
      </View>

      <ScrollView 
        ref={scrollViewRef}
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map((msg) => (
          <View key={msg.id} style={[
            styles.messageBubble, 
            msg.is_admin_reply ? styles.adminBubble : styles.userBubble
          ]}>
             <Text style={styles.messageUser}>{msg.is_admin_reply ? 'Вы (Админ)' : 'Пользователь'}</Text>
            {msg.image_url && (
              <Image source={{ uri: msg.image_url }} style={styles.messageImage} />
            )}
            <Text style={[styles.messageText, msg.is_admin_reply ? styles.adminText : styles.userText]}>
              {msg.content}
            </Text>
            <Text style={styles.messageDate}>
              {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </Text>
          </View>
        ))}
      </ScrollView>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={10}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Ответ админа..."
            value={reply}
            onChangeText={setReply}
            multiline
          />
          <TouchableOpacity 
            style={[styles.sendButton, isSending && styles.disabledButton]} 
            onPress={handleSend}
            disabled={isSending}
          >
            <Text style={styles.sendText}>→</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#eee', paddingTop: 40 },
  backButton: { marginRight: 15 },
  backButtonText: { fontSize: 18, color: '#007AFF' },
  title: { fontSize: 16, fontWeight: 'bold' },
  content: { flex: 1 },
  contentContainer: { padding: 15, paddingBottom: 20 },
  messageBubble: { maxWidth: '80%', padding: 12, borderRadius: 15, marginBottom: 10 },
  userBubble: { alignSelf: 'flex-start', backgroundColor: 'white', borderBottomLeftRadius: 2, borderWidth: 1, borderColor: '#eee' },
  adminBubble: { alignSelf: 'flex-end', backgroundColor: '#34C759', borderBottomRightRadius: 2 }, // Green for admin
  messageUser: { fontSize: 10, marginBottom: 2, color: '#999' },
  messageText: { fontSize: 16 },
  userText: { color: '#333' },
  adminText: { color: 'white' },
  messageDate: { fontSize: 10, marginTop: 5, alignSelf: 'flex-end', color: '#ccc' },
  messageImage: { width: 200, height: 150, borderRadius: 10, marginBottom: 5 },
  inputContainer: { flexDirection: 'row', padding: 12, backgroundColor: 'white', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#eee', paddingBottom: Platform.OS === 'ios' ? 30 : 12 },
  input: { flex: 1, backgroundColor: '#f0f0f0', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 10, maxHeight: 100, marginRight: 10, fontSize: 16 },
  sendButton: { backgroundColor: '#34C759', width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 2, shadowOffset: { width: 0, height: 1 } },
  disabledButton: { opacity: 0.5 },
  sendText: { color: 'white', fontSize: 20, fontWeight: 'bold' }
});