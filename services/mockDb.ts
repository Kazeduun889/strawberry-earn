import { supabase } from './supabase';
import { Alert } from 'react-native';

export interface Review {
  id: string;
  username: string;
  content: string;
  rating: number;
  created_at: number;
}

export interface WithdrawalRequest {
  id: string;
  userId: string;
  amount: number;
  screenshotUri: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: number;
  skinName?: string;
}

// Helper to ensure user is logged in
const ensureUser = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) return session.user;

  // If no session, try anonymous sign in
  const { data, error } = await supabase.auth.signInAnonymously();
  
  if (error) {
    // If anonymous sign in fails (maybe disabled), try random email signup
    const email = `user_${Math.random().toString(36).substring(7)}@temp.com`;
    const password = 'password123';
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });
    if (signUpError) {
      console.error('Auth error:', signUpError);
      Alert.alert('Ошибка авторизации', 'Не удалось создать пользователя');
      return null;
    }
    return signUpData.user;
  }
  
  return data.user;
};

export const MockDB = {
  // User: Get Balance
  getBalance: async (): Promise<number> => {
    const user = await ensureUser();
    if (!user) return 0;

    const { data, error } = await supabase
      .from('profiles')
      .select('balance')
      .eq('id', user.id)
      .single();

    if (error && error.code === 'PGRST116') {
      // Profile doesn't exist, create it
      await supabase.from('profiles').insert({ id: user.id, balance: 0 });
      return 0;
    }

    return data?.balance || 0;
  },

  // Task Completion (Prevent duplicates)
  completeTask: async (taskId: string, reward: number): Promise<boolean> => {
    const user = await ensureUser();
    if (!user) return false;

    // Check if task is already completed
    if (taskId === 'subscribe_channel') {
      const { data, error } = await supabase
        .from('profiles')
        .select('has_subscribed')
        .eq('id', user.id)
        .single();
        
      if (data?.has_subscribed) {
        return false; // Already done
      }
      
      // Update profile
      await supabase
        .from('profiles')
        .update({ has_subscribed: true })
        .eq('id', user.id);
    }

    // Add balance
    await MockDB.addBalance(reward);
    return true;
  },

  // Reviews: Get All
  getReviews: async (): Promise<Review[]> => {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.log('Error fetching reviews:', error.message);
      return [];
    }

    return data.map(item => ({
      id: item.id,
      username: item.username || 'Аноним',
      content: item.content,
      rating: item.rating,
      created_at: new Date(item.created_at).getTime(),
    }));
  },

  // Reviews: Add
  addReview: async (content: string, rating: number): Promise<boolean> => {
    const user = await ensureUser();
    if (!user) return false;

    const { error } = await supabase
      .from('reviews')
      .insert({
        user_id: user.id,
        username: user.email?.split('@')[0] || 'User',
        content,
        rating
      });

    if (error) {
      console.error('Error adding review:', error);
      return false;
    }
    return true;
  },

  // User: Add Balance (Ad reward)
  addBalance: async (amount: number): Promise<number> => {
    const user = await ensureUser();
    if (!user) return 0;

    // Get current balance
    const current = await MockDB.getBalance();
    const newBal = current + amount;

    // Update balance
    const { error } = await supabase
      .from('profiles')
      .update({ balance: newBal })
      .eq('id', user.id);

    if (error) {
      console.error('Error adding balance:', error);
      return current;
    }
    return newBal;
  },

  // User: Create Withdrawal Request
  createWithdrawal: async (amount: number, screenshotUri: string, skinName: string): Promise<boolean> => {
    const user = await ensureUser();
    if (!user) return false;

    const current = await MockDB.getBalance();
    if (current < amount) return false;

    // 1. Upload screenshot
    const fileName = `${user.id}/${Date.now()}.jpg`;
    const formData = new FormData();
    formData.append('file', {
      uri: screenshotUri,
      name: fileName,
      type: 'image/jpeg',
    } as any);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('screenshots')
      .upload(fileName, formData, {
        contentType: 'image/jpeg',
      });

    if (uploadError) {
      Alert.alert('Ошибка загрузки', 'Проверьте, создан ли бакет "screenshots" (public) в Supabase');
      console.error('Upload error:', uploadError);
      return false;
    }

    const screenshotUrl = supabase.storage.from('screenshots').getPublicUrl(fileName).data.publicUrl;

    // 2. Deduct balance
    const { error: balanceError } = await supabase
      .from('profiles')
      .update({ balance: current - amount })
      .eq('id', user.id);

    if (balanceError) {
      console.error('Balance error:', balanceError);
      return false;
    }

    // 3. Create request
    const { error: insertError } = await supabase
      .from('withdrawals')
      .insert({
        user_id: user.id,
        amount,
        screenshot_url: screenshotUrl,
        skin_name: skinName,
        status: 'pending'
      });

    if (insertError) {
      // Refund if insert fails
      await supabase.from('profiles').update({ balance: current }).eq('id', user.id);
      console.error('Insert error:', insertError);
      return false;
    }

    return true;
  },

  // Admin: Get All Requests
  getRequests: async (): Promise<WithdrawalRequest[]> => {
    const { data, error } = await supabase
      .from('withdrawals')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fetch error:', error);
      return [];
    }

    return data.map(item => ({
      id: item.id,
      userId: item.user_id,
      amount: item.amount,
      screenshotUri: item.screenshot_url,
      status: item.status,
      createdAt: new Date(item.created_at).getTime(),
      skinName: item.skin_name
    }));
  },

  // Admin: Approve Request
  approveRequest: async (id: string): Promise<void> => {
    await supabase
      .from('withdrawals')
      .update({ status: 'approved' })
      .eq('id', id);
  },

  // Admin: Reject Request (Refund balance)
  rejectRequest: async (id: string): Promise<void> => {
    // Get request details
    const { data: request } = await supabase
      .from('withdrawals')
      .select('*')
      .eq('id', id)
      .single();

    if (!request || request.status !== 'pending') return;

    // Update status
    await supabase
      .from('withdrawals')
      .update({ status: 'rejected' })
      .eq('id', id);

    // Refund user
    const { data: profile } = await supabase
      .from('profiles')
      .select('balance')
      .eq('id', request.user_id)
      .single();

    if (profile) {
      await supabase
        .from('profiles')
        .update({ balance: profile.balance + request.amount })
        .eq('id', request.user_id);
    }
  }
};
