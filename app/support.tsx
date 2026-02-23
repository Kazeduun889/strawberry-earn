import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { MockDB } from '../services/mockDb';
import { SupportMessage } from '../services/types';

export default function SupportScreen() {
  const router = useRouter();
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    loadMessages();
    // Poll for new messages every 5 seconds
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadMessages = async () => {
    const data = await MockDB.getSupportMessages();
    setMessages(data);
  };

  const handleSend = async () => {
    if (!newMessage.trim()) return;

    setIsSending(true);
    const success = await MockDB.sendSupportMessage(newMessage);
    setIsSending(false);

    if (success) {
      setNewMessage('');
      loadMessages();
    } else {
      Alert.alert('Ошибка', 'Не удалось отправить сообщение');
    }
  };

  const handleImagePick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.5,
    });

    if (!result.canceled) {
      setIsSending(true);
      const success = await MockDB.sendSupportMessage('Отправил изображение', result.assets[0].uri);
      setIsSending(false);
      
      if (success) {
        loadMessages();
      } else {
        Alert.alert('Ошибка', 'Не удалось отправить изображение');
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Назад</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Поддержка</Text>
      </View>

      <ScrollView 
        ref={scrollViewRef}
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.length === 0 ? (
          <Text style={styles.emptyText}>Напишите нам, если у вас возникли вопросы!</Text>
        ) : (
          messages.map((msg) => (
            <View key={msg.id} style={[
              styles.messageBubble, 
              msg.is_admin_reply ? styles.adminBubble : styles.userBubble
            ]}>
              <Text style={styles.messageUser}>{msg.is_admin_reply ? 'Поддержка' : 'Вы'}</Text>
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
          ))
        )}
      </ScrollView>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={10}>
        <View style={styles.inputContainer}>
          <TouchableOpacity onPress={handleImagePick} style={styles.attachButton}>
            <Text style={styles.attachIcon}>📷</Text>
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="Ваше сообщение..."
            value={newMessage}
            onChangeText={setNewMessage}
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
  title: { fontSize: 20, fontWeight: 'bold' },
  content: { flex: 1 },
  contentContainer: { padding: 15, paddingBottom: 20 },
  emptyText: { textAlign: 'center', color: '#999', marginTop: 50 },
  messageBubble: { maxWidth: '80%', padding: 12, borderRadius: 15, marginBottom: 10 },
  userBubble: { alignSelf: 'flex-end', backgroundColor: '#007AFF', borderBottomRightRadius: 2 },
  adminBubble: { alignSelf: 'flex-start', backgroundColor: 'white', borderBottomLeftRadius: 2, borderWidth: 1, borderColor: '#eee' },
  messageUser: { fontSize: 10, marginBottom: 2, color: '#ddd' },
  messageText: { fontSize: 16 },
  userText: { color: 'white' },
  adminText: { color: '#333' },
  messageDate: { fontSize: 10, marginTop: 5, alignSelf: 'flex-end', color: '#ccc' },
  messageImage: { width: 200, height: 150, borderRadius: 10, marginBottom: 5 },
  inputContainer: { flexDirection: 'row', padding: 10, backgroundColor: 'white', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#eee' },
  attachButton: { padding: 10 },
  attachIcon: { fontSize: 24 },
  input: { flex: 1, backgroundColor: '#f0f0f0', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 8, maxHeight: 100, marginRight: 10 },
  sendButton: { backgroundColor: '#007AFF', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  disabledButton: { opacity: 0.5 },
  sendText: { color: 'white', fontSize: 20, fontWeight: 'bold' }
});