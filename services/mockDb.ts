import { supabase } from './supabase';
import { Alert, Platform } from 'react-native';
import { SupportMessage, Review, WithdrawalRequest } from './types';

// Helper to ensure user is logged in
const ensureUser = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) return session.user;

    // Attempt anonymous sign in if no session
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) {
      console.error('Auth error:', error.message);
      // Fallback: try to get user again in case of race condition
      const { data: retryData } = await supabase.auth.getUser();
      if (retryData?.user) return retryData.user;
      
      Alert.alert('Ошибка авторизации', 'Пожалуйста, проверьте интернет-соединение.');
      return null;
    }
    return data.user;
  } catch (e) {
    console.error('ensureUser exception:', e);
    return null;
  }
};

// Helper: Upload Image to Supabase Storage
const uploadImage = async (uri: string, folder: string): Promise<string | null> => {
  try {
    const user = await ensureUser();
    if (!user) return null;

    // Create unique filename
    const ext = uri.split('.').pop() || 'jpg';
    const fileName = `${folder}/${user.id}/${Date.now()}.${ext}`;
    
    // Convert URI to Blob for better compatibility with Supabase upload
    const response = await fetch(uri);
    const blob = await response.blob();

    const { data, error } = await supabase.storage
      .from('screenshots')
      .upload(fileName, blob, {
        contentType: `image/${ext === 'png' ? 'png' : 'jpeg'}`,
        upsert: true
      });

    if (error) {
      console.error('Upload error:', error.message);
      Alert.alert('Ошибка загрузки', 'Не удалось загрузить изображение: ' + error.message);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from('screenshots')
      .getPublicUrl(fileName);
      
    return urlData.publicUrl;
  } catch (e) {
    console.error('Upload exception:', e);
    Alert.alert('Ошибка', 'Произошла ошибка при загрузке фото.');
    return null;
  }
};

export const MockDB = {
  // Get User Balance
  getBalance: async (): Promise<number> => {
    try {
      const user = await ensureUser();
      if (!user) return 0;

      const { data, error } = await supabase
        .from('profiles')
        .select('balance')
        .eq('id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Profile doesn't exist, create it
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({ id: user.id, balance: 0, email: user.email || `user_${user.id.substring(0,5)}` })
            .select()
            .single();
          
          if (createError) console.error('Create profile error:', createError.message);
          return newProfile?.balance || 0;
        }
        console.error('Get balance error:', error.message);
        return 0;
      }

      return data?.balance || 0;
    } catch (e) {
      return 0;
    }
  },

  // Task Completion
  completeTask: async (taskId: string, reward: number): Promise<boolean> => {
    try {
      const user = await ensureUser();
      if (!user) return false;

      // Special handling for subscription
      if (taskId === 'subscribe_channel') {
        const { data: profile } = await supabase
          .from('profiles')
          .select('has_subscribed')
          .eq('id', user.id)
          .single();
          
        if (profile?.has_subscribed) {
          Alert.alert('Инфо', 'Вы уже получили награду за это задание.');
          return false; 
        }
        
        // Update profile status
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ has_subscribed: true })
          .eq('id', user.id);

        if (updateError) {
          console.error('Update sub error:', updateError.message);
          Alert.alert('Ошибка', 'Не удалось обновить статус подписки.');
          return false;
        }
      }

      // Add balance using RPC or manual update
      const currentBalance = await MockDB.getBalance();
      const { error: balError } = await supabase
        .from('profiles')
        .update({ balance: currentBalance + reward })
        .eq('id', user.id);

      if (balError) {
        Alert.alert('Ошибка', 'Не удалось начислить награду.');
        return false;
      }

      return true;
    } catch (e) {
      console.error('completeTask exception:', e);
      return false;
    }
  },

  // Check Task Status
  checkTaskStatus: async (taskId: string): Promise<boolean> => {
    try {
      const user = await ensureUser();
      if (!user) return false;

      if (taskId === 'subscribe_channel') {
        const { data } = await supabase
          .from('profiles')
          .select('has_subscribed')
          .eq('id', user.id)
          .single();
        return !!data?.has_subscribed;
      }
      return false;
    } catch (e) {
      return false;
    }
  },

  // Reviews: Get All
  getReviews: async (): Promise<Review[]> => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Fetch reviews error:', error.message);
        return [];
      }

      return (data || []).map(item => ({
        id: item.id,
        username: item.username || 'Аноним',
        content: item.content,
        rating: item.rating,
        created_at: new Date(item.created_at).getTime(),
      }));
    } catch (e) {
      return [];
    }
  },

  // Reviews: Add
  addReview: async (content: string, rating: number): Promise<boolean> => {
    try {
      const user = await ensureUser();
      if (!user) return false;

      const { error } = await supabase
        .from('reviews')
        .insert({
          user_id: user.id,
          username: user.email?.split('@')[0] || `User_${user.id.substring(0,4)}`,
          content,
          rating
        });

      if (error) {
        console.error('Add review error:', error.message);
        Alert.alert('Ошибка', 'Не удалось отправить отзыв: ' + error.message);
        return false;
      }
      return true;
    } catch (e) {
      Alert.alert('Ошибка', 'Произошла системная ошибка при отправке отзыва.');
      return false;
    }
  },

  // Support: Get My Messages
  getSupportMessages: async (): Promise<SupportMessage[]> => {
    try {
      const user = await ensureUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('support_messages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) return [];
      return (data || []).map(item => ({ ...item, created_at: new Date(item.created_at).getTime() }));
    } catch (e) {
      return [];
    }
  },

  // Support: Send Message (User)
  sendSupportMessage: async (content: string, imageUri?: string): Promise<boolean> => {
    try {
      const user = await ensureUser();
      if (!user) return false;

      let imageUrl = null;
      if (imageUri) {
        imageUrl = await uploadImage(imageUri, 'support');
        if (!imageUrl) return false; // uploadImage already alerts
      }

      const { error } = await supabase
        .from('support_messages')
        .insert({
          user_id: user.id,
          content,
          image_url: imageUrl,
          is_admin_reply: false
        });

      if (error) {
        Alert.alert('Ошибка', 'Не удалось отправить сообщение: ' + error.message);
        return false;
      }
      return true;
    } catch (e) {
      return false;
    }
  },

  // Admin Support
  getSupportUsers: async () => {
    const { data } = await supabase.from('support_messages').select('*').order('created_at', { ascending: false });
    const usersMap = new Map();
    (data || []).forEach(msg => {
      if (!usersMap.has(msg.user_id)) {
        usersMap.set(msg.user_id, { userId: msg.user_id, lastMessage: msg.content, lastDate: new Date(msg.created_at).getTime() });
      }
    });
    return Array.from(usersMap.values());
  },

  getAdminUserMessages: async (userId: string) => {
    const { data } = await supabase.from('support_messages').select('*').eq('user_id', userId).order('created_at', { ascending: true });
    return (data || []).map(item => ({ ...item, created_at: new Date(item.created_at).getTime() }));
  },

  sendAdminReply: async (userId: string, content: string) => {
    const { error } = await supabase.from('support_messages').insert({ user_id: userId, content, is_admin_reply: true });
    return !error;
  },

  // Balance Management
  addBalance: async (amount: number): Promise<number> => {
    try {
      const user = await ensureUser();
      if (!user) return 0;
      const current = await MockDB.getBalance();
      const { error } = await supabase.from('profiles').update({ balance: current + amount }).eq('id', user.id);
      return error ? current : current + amount;
    } catch (e) {
      return 0;
    }
  },

  // Withdrawals
  createWithdrawal: async (amount: number, screenshotUri: string, skinName: string): Promise<boolean> => {
    try {
      const user = await ensureUser();
      if (!user) return false;

      const balance = await MockDB.getBalance();
      if (balance < amount) {
        Alert.alert('Ошибка', 'Недостаточно средств на балансе.');
        return false;
      }

      const imageUrl = await uploadImage(screenshotUri, 'withdrawals');
      if (!imageUrl) return false;

      const { error: reqError } = await supabase.from('withdrawal_requests').insert({
        user_id: user.id,
        amount,
        screenshot_uri: imageUrl,
        status: 'pending',
        skin_name: skinName
      });

      if (reqError) {
        Alert.alert('Ошибка', 'Не удалось создать запрос: ' + reqError.message);
        return false;
      }

      await supabase.from('profiles').update({ balance: balance - amount }).eq('id', user.id);
      return true;
    } catch (e) {
      return false;
    }
  },

  getRequests: async () => {
    const { data } = await supabase.from('withdrawal_requests').select('*').order('created_at', { ascending: false });
    return (data || []).map(item => ({
      id: item.id,
      userId: item.user_id,
      amount: item.amount,
      screenshotUri: item.screenshot_uri,
      status: item.status,
      createdAt: new Date(item.created_at).getTime(),
      skinName: item.skin_name
    }));
  },

  approveRequest: async (id: string) => {
    await supabase.from('withdrawal_requests').update({ status: 'approved' }).eq('id', id);
  },

  rejectRequest: async (id: string) => {
    const { data: request } = await supabase.from('withdrawal_requests').select('*').eq('id', id).single();
    if (request) {
      const { data: profile } = await supabase.from('profiles').select('balance').eq('id', request.user_id).single();
      if (profile) {
        await supabase.from('profiles').update({ balance: profile.balance + request.amount }).eq('id', request.user_id);
      }
      await supabase.from('withdrawal_requests').update({ status: 'rejected' }).eq('id', id);
    }
  }
};
