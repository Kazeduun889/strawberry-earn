import { supabase } from './supabase';
import { Alert, Platform } from 'react-native';
import { SupportMessage, Review, WithdrawalRequest } from './types';

const safeAlert = (title: string, message?: string) => {
  if (Platform.OS === 'web') {
    window.alert(`${title}: ${message}`);
  } else {
    Alert.alert(title, message);
  }
};

// Helper to ensure user is logged in
const ensureUser = async () => {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (session?.user) {
      return session.user;
    }

    if (sessionError) {
      console.error('Session error:', sessionError.message);
    }

    // Attempt anonymous sign in
    const { data, error } = await supabase.auth.signInAnonymously();
    
    if (error) {
      console.error('Auth error (Anonymous failed):', error.message);

      // If anonymous is disabled, we MUST use a fallback user immediately
      // This happens if the user hasn't enabled "Allow anonymous sign-ins" in Supabase Dashboard
      const fallbackEmail = `user_fixed@strawberry.com`;
      const fallbackPassword = 'password_fixed_123';

      console.log('Trying fallback login/signup...');
      
      // Try to sign in first
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: fallbackEmail,
        password: fallbackPassword,
      });

      if (!signInError && signInData.user) {
        return signInData.user;
      }

      // If sign in fails, try to sign up
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: fallbackEmail,
        password: fallbackPassword,
      });

      if (signUpError) {
        console.error('All auth methods failed:', signUpError.message);
        safeAlert('Ошибка Supabase', 'У вас в панели Supabase ОТКЛЮЧЕНА авторизация. Перейдите в Authentication -> Providers и ВКЛЮЧИТЕ "Anonymous" или "Email". Ошибка: ' + error.message);
        return null;
      }

      return signUpData.user;
    }
    
    // Create profile if it doesn't exist
    if (data.user) {
      const { error: profileError } = await supabase.from('profiles').upsert({ 
        id: data.user.id, 
        balance: 0,
        email: data.user.email || `user_${data.user.id.substring(0, 8)}`
      }, { onConflict: 'id' });
      
      if (profileError) {
        console.error('Profile creation error:', profileError);
      }
    }

    return data.user;
  } catch (e) {
    console.error('ensureUser exception:', e);
    safeAlert('Критическая ошибка', 'Ошибка входа: ' + (e as Error).message);
    return null;
  }
};

// Helper: Upload Image to Supabase Storage
const uploadImage = async (uri: string, folder: string): Promise<string | null> => {
  try {
    const user = await ensureUser();
    if (!user) return null;

    const ext = uri.split('.').pop() || 'jpg';
    const fileName = `${folder}/${user.id}/${Date.now()}.${ext}`;
    
    // Improved Blob handling for React Native
    const response = await fetch(uri);
    const blob = await response.blob();
    
    // Explicitly set the file object structure for Supabase
    const file = {
      uri: uri,
      name: fileName,
      type: `image/${ext === 'png' ? 'png' : 'jpeg'}`,
    };

    const { data, error } = await supabase.storage
      .from('screenshots')
      .upload(fileName, blob, {
        contentType: `image/${ext === 'png' ? 'png' : 'jpeg'}`,
        upsert: true,
        cacheControl: '3600'
      });

    if (error) {
      console.error('Detailed Upload error:', error);
      safeAlert('Ошибка загрузки', `Не удалось отправить файл: ${error.message}`);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from('screenshots')
      .getPublicUrl(fileName);
      
    return urlData.publicUrl;
  } catch (e) {
    console.error('Upload exception:', e);
    safeAlert('Критическая ошибка загрузки', (e as Error).message);
    return null;
  }
};

export const MockDB = {
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
        if (error.code === 'PGRST116') return 0;
        console.error('Get balance error:', error.message);
        return 0;
      }

      return data?.balance || 0;
    } catch (e) {
      return 0;
    }
  },

  completeTask: async (taskId: string, reward: number): Promise<boolean> => {
    try {
      const user = await ensureUser();
      if (!user) {
        safeAlert('Ошибка', 'Не удалось определить пользователя. Попробуйте еще раз.');
        return false;
      }

      // Check current status before anything
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('has_subscribed, balance')
        .eq('id', user.id)
        .single();
        
      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Check task error:', profileError);
        safeAlert('Ошибка проверки', profileError.message);
        return false;
      }

      if (taskId === 'subscribe_channel') {
        if (profile?.has_subscribed) {
          safeAlert('Инфо', 'Награда уже была начислена ранее');
          return true; // Already done, return true to hide UI
        }
        
        // UPDATE SUB STATUS AND BALANCE IN ONE GO IF POSSIBLE
        // But since we don't have a single RPC, let's do them sequentially with error check
        const newBalance = (profile?.balance || 0) + reward;
        
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ 
            has_subscribed: true,
            balance: newBalance
          })
          .eq('id', user.id);

        if (updateError) {
          safeAlert('Ошибка БД', 'Не удалось сохранить выполнение: ' + updateError.message);
          return false;
        }
        
        return true;
      }

      // Generic task handling
      const currentBalance = await MockDB.getBalance();
      const { error: balError } = await supabase
        .from('profiles')
        .update({ balance: currentBalance + reward })
        .eq('id', user.id);

      if (balError) {
        safeAlert('Ошибка БД', 'Не удалось начислить баланс: ' + balError.message);
        return false;
      }

      return true;
    } catch (e) {
      safeAlert('Критическая ошибка задания', (e as Error).message);
      return false;
    }
  },

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

  addReview: async (content: string, rating: number): Promise<boolean> => {
    try {
      const user = await ensureUser();
      if (!user) {
        safeAlert('Ошибка', 'Не удалось авторизоваться для отправки отзыва.');
        return false;
      }

      // Check if user already has a review
      const { data: existingReview, error: checkError } = await supabase
        .from('reviews')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingReview) {
        safeAlert('Ограничение', 'Вы уже оставляли отзыв. Больше одного отзыва писать нельзя!');
        return false;
      }

      const { error } = await supabase
        .from('reviews')
        .insert({
          user_id: user.id,
          username: user.email?.split('@')[0] || `User_${user.id.substring(0, 5)}`,
          content,
          rating
        });

      if (error) {
        safeAlert('Ошибка отзыва', 'Не удалось отправить отзыв в базу: ' + error.message);
        return false;
      }
      return true;
    } catch (e) {
      safeAlert('Ошибка отзыва', 'Системная ошибка: ' + (e as Error).message);
      return false;
    }
  },

  getSupportMessages: async (): Promise<SupportMessage[]> => {
    try {
      const user = await ensureUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('support_messages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Fetch support error:', error.message);
        return [];
      }
      return (data || []).map(item => ({ ...item, created_at: new Date(item.created_at).getTime() }));
    } catch (e) {
      return [];
    }
  },

  sendSupportMessage: async (content: string, imageUri?: string): Promise<boolean> => {
    try {
      const user = await ensureUser();
      if (!user) {
        safeAlert('Ошибка', 'Не удалось авторизоваться для отправки сообщения.');
        return false;
      }

      let imageUrl = null;
      if (imageUri) {
        imageUrl = await uploadImage(imageUri, 'support');
        if (!imageUrl) {
          console.error('Support image upload failed');
          safeAlert('Внимание', 'Фото не загрузилось, отправляем только текст.');
          // Continue without image
        }
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
        safeAlert('Ошибка поддержки', 'Не удалось отправить сообщение в базу: ' + error.message);
        return false;
      }
      return true;
    } catch (e) {
      safeAlert('Ошибка поддержки', 'Системная ошибка: ' + (e as Error).message);
      return false;
    }
  },

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
