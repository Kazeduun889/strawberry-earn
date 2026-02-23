import { supabase } from './supabase';
import { Alert, Platform } from 'react-native';
import { SupportMessage, Review, WithdrawalRequest } from './types';

// Helper to ensure user is logged in
const ensureUser = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) return session.user;

    // If no session, try anonymous sign in
    console.log('No session, attempting anonymous sign in...');
    const { data, error } = await supabase.auth.signInAnonymously();
    
    if (error) {
      console.error('Anonymous auth failed:', error);
      // If anonymous sign in fails, try random email signup as fallback
      const email = `user_${Math.random().toString(36).substring(7)}@temp.com`;
      const password = 'password123';
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });
      if (signUpError) {
        console.error('Signup fallback failed:', signUpError);
        Alert.alert('Ошибка авторизации', 'Не удалось создать пользователя. Проверьте интернет.');
        return null;
      }
      return signUpData.user;
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

    const fileName = `${folder}/${user.id}/${Date.now()}.jpg`;
    
    // Create FormData for upload
    const formData = new FormData();
    formData.append('file', {
      uri: uri,
      name: fileName,
      type: 'image/jpeg',
    } as any);

    const { data, error } = await supabase.storage
      .from('screenshots')
      .upload(fileName, formData, {
        contentType: 'image/jpeg',
        upsert: false
      });

    if (error) {
      console.error('Upload error:', error);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from('screenshots')
      .getPublicUrl(fileName);
      
    return urlData.publicUrl;
  } catch (e) {
    console.error('Upload exception:', e);
    return null;
  }
};

export const MockDB = {
  // Get User Balance
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
    try {
      const user = await ensureUser();
      if (!user) return false;

      // Check if task is already completed
      if (taskId === 'subscribe_channel') {
        const { data, error } = await supabase
          .from('profiles')
          .select('has_subscribed')
          .eq('id', user.id)
          .single();
          
        if (error && error.code !== 'PGRST116') {
          console.error('Error checking subscription:', error);
        }

        if (data?.has_subscribed) {
          return false; // Already done
        }
        
        // Update profile
        const { error: updateError } = await supabase
          .from('profiles')
          .upsert({ id: user.id, has_subscribed: true })
          .eq('id', user.id);

        if (updateError) {
          console.error('Error updating subscription status:', updateError);
          return false;
        }
      }

      // Add balance
      await MockDB.addBalance(reward);
      return true;
    } catch (e) {
      console.error('completeTask exception:', e);
      return false;
    }
  },

  // Check Task Status
  checkTaskStatus: async (taskId: string): Promise<boolean> => {
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
    try {
      const user = await ensureUser();
      if (!user) {
        console.error('User not found in addReview');
        return false;
      }

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
    } catch (e) {
      console.error('addReview exception:', e);
      return false;
    }
  },

  // Support: Get My Messages
  getSupportMessages: async (): Promise<SupportMessage[]> => {
    const user = await ensureUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('support_messages')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (error) {
      console.log('Error fetching support:', error.message);
      return [];
    }
    return data.map(item => ({ ...item, created_at: new Date(item.created_at).getTime() }));
  },

  // Support: Send Message (User)
  sendSupportMessage: async (content: string, imageUri?: string): Promise<boolean> => {
    try {
      const user = await ensureUser();
      if (!user) return false;

      let imageUrl = null;

      if (imageUri) {
        imageUrl = await uploadImage(imageUri, 'support');
        if (!imageUrl) {
          Alert.alert('Ошибка', 'Не удалось загрузить изображение.');
          return false;
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
        console.error('Send message error:', error);
        return false;
      }

      return true;
    } catch (e) {
      console.error('sendSupportMessage exception:', e);
      return false;
    }
  },

  // Admin Support: Get All Conversations (Grouped by User)
  getSupportUsers: async (): Promise<{userId: string, lastMessage: string, lastDate: number}[]> => {
    const { data, error } = await supabase
      .from('support_messages')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return [];

    const usersMap = new Map();
    data.forEach(msg => {
      if (!usersMap.has(msg.user_id)) {
        usersMap.set(msg.user_id, {
          userId: msg.user_id,
          lastMessage: msg.content,
          lastDate: new Date(msg.created_at).getTime()
        });
      }
    });

    return Array.from(usersMap.values());
  },

  // Admin Support: Get User Messages
  getAdminUserMessages: async (userId: string): Promise<SupportMessage[]> => {
    const { data, error } = await supabase
      .from('support_messages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) return [];
    return data.map(item => ({ ...item, created_at: new Date(item.created_at).getTime() }));
  },

  // Admin Support: Reply
  sendAdminReply: async (userId: string, content: string): Promise<boolean> => {
    const { error } = await supabase
      .from('support_messages')
      .insert({
        user_id: userId,
        content,
        is_admin_reply: true
      });
    return !error;
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
    try {
      const user = await ensureUser();
      if (!user) return false;

      const current = await MockDB.getBalance();
      if (current < amount) return false;

      // 1. Upload screenshot
      const screenshotUrl = await uploadImage(screenshotUri, 'withdrawals');
      if (!screenshotUrl) {
        Alert.alert('Ошибка', 'Не удалось загрузить скриншот.');
        return false;
      }

      // 2. Deduct balance
      const { error: balanceError } = await supabase
        .from('profiles')
        .update({ balance: current - amount })
        .eq('id', user.id);
        
      if (balanceError) {
        console.error('Balance update error:', balanceError);
        return false;
      }

      // 3. Create Withdrawal Request Record
      const { error: requestError } = await supabase
        .from('withdrawal_requests')
        .insert({
          user_id: user.id,
          amount,
          screenshot_uri: screenshotUrl,
          status: 'pending',
          skin_name: skinName
        });

      if (requestError) {
        console.error('Withdrawal request error:', requestError);
        // Refund balance if request creation fails
        await supabase.from('profiles').update({ balance: current }).eq('id', user.id);
        return false;
      }

      return true;
    } catch (e) {
      console.error('createWithdrawal exception:', e);
      return false;
    }
  },

  // Admin: Get All Requests
  getRequests: async (): Promise<WithdrawalRequest[]> => {
    try {
      const { data, error } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Fetch error:', error);
        return [];
      }

      return (data || []).map(item => ({
        id: item.id,
        userId: item.user_id,
        amount: item.amount,
        screenshotUri: item.screenshot_uri,
        status: item.status,
        createdAt: new Date(item.created_at).getTime(),
        skinName: item.skin_name
      }));
    } catch (e) {
      console.error('getRequests error:', e);
      return [];
    }
  },

  // Admin: Approve Request
  approveRequest: async (id: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('withdrawal_requests')
        .update({ status: 'approved' })
        .eq('id', id);
      
      if (error) console.error('Error approving request:', error);
    } catch (e) {
      console.error('approveRequest error:', e);
    }
  },

  // Admin: Reject Request (Refund balance)
  rejectRequest: async (id: string): Promise<void> => {
    try {
      // Get request details
      const { data: request, error: reqError } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .eq('id', id)
        .single();

      if (reqError || !request) {
        console.error('Error fetching request for rejection:', reqError);
        return;
      }

      // Get user profile
      const { data: user, error: userError } = await supabase
        .from('profiles')
        .select('balance')
        .eq('id', request.user_id)
        .single();

      if (userError || !user) {
        console.error('Error fetching user for refund:', userError);
        return;
      }

      // Refund balance
      const { error: refundError } = await supabase
        .from('profiles')
        .update({ balance: user.balance + request.amount })
        .eq('id', request.user_id);

      if (refundError) {
        console.error('Error refunding balance:', refundError);
        return;
      }

      // Update status
      const { error: statusError } = await supabase
        .from('withdrawal_requests')
        .update({ status: 'rejected' })
        .eq('id', id);
        
      if (statusError) console.error('Error updating status to rejected:', statusError);
      
    } catch (e) {
      console.error('rejectRequest error:', e);
    }
  }
};
