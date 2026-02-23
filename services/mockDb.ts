import AsyncStorage from '@react-native-async-storage/async-storage';

export interface WithdrawalRequest {
  id: string;
  userId: string;
  amount: number;
  screenshotUri: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: number;
  skinName?: string;
}

const STORAGE_KEY_BALANCE = 'user_balance';
const STORAGE_KEY_REQUESTS = 'admin_requests';

// Mock delay to simulate network
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const MockDB = {
  // User: Get Balance
  getBalance: async (): Promise<number> => {
    const bal = await AsyncStorage.getItem(STORAGE_KEY_BALANCE);
    return bal ? parseFloat(bal) : 0;
  },

  // User: Add Balance (Ad reward)
  addBalance: async (amount: number): Promise<number> => {
    const current = await MockDB.getBalance();
    const newBal = current + amount;
    await AsyncStorage.setItem(STORAGE_KEY_BALANCE, newBal.toString());
    return newBal;
  },

  // User: Create Withdrawal Request
  createWithdrawal: async (amount: number, screenshotUri: string, skinName: string): Promise<boolean> => {
    await delay(1000);
    const current = await MockDB.getBalance();
    if (current < amount) return false;

    // Deduct balance immediately (or hold it)
    await AsyncStorage.setItem(STORAGE_KEY_BALANCE, (current - amount).toString());

    const requestsJson = await AsyncStorage.getItem(STORAGE_KEY_REQUESTS);
    const requests: WithdrawalRequest[] = requestsJson ? JSON.parse(requestsJson) : [];

    const newRequest: WithdrawalRequest = {
      id: Math.random().toString(36).substr(2, 9),
      userId: 'user_1', // Mock user ID
      amount,
      screenshotUri,
      status: 'pending',
      createdAt: Date.now(),
      skinName
    };

    requests.push(newRequest);
    await AsyncStorage.setItem(STORAGE_KEY_REQUESTS, JSON.stringify(requests));
    return true;
  },

  // Admin: Get All Requests
  getRequests: async (): Promise<WithdrawalRequest[]> => {
    const requestsJson = await AsyncStorage.getItem(STORAGE_KEY_REQUESTS);
    return requestsJson ? JSON.parse(requestsJson) : [];
  },

  // Admin: Approve Request
  approveRequest: async (id: string): Promise<void> => {
    await delay(500);
    const requests = await MockDB.getRequests();
    const updated = requests.map(r => r.id === id ? { ...r, status: 'approved' as const } : r);
    await AsyncStorage.setItem(STORAGE_KEY_REQUESTS, JSON.stringify(updated));
  },

  // Admin: Reject Request (Refund balance)
  rejectRequest: async (id: string): Promise<void> => {
    await delay(500);
    const requests = await MockDB.getRequests();
    const request = requests.find(r => r.id === id);
    
    if (request && request.status === 'pending') {
      // Refund
      const current = await MockDB.getBalance();
      await AsyncStorage.setItem(STORAGE_KEY_BALANCE, (current + request.amount).toString());
    }

    const updated = requests.map(r => r.id === id ? { ...r, status: 'rejected' as const } : r);
    await AsyncStorage.setItem(STORAGE_KEY_REQUESTS, JSON.stringify(updated));
  }
};
