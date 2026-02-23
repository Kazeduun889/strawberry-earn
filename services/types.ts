export interface SupportMessage {
  id: string;
  user_id: string;
  is_admin_reply: boolean;
  content: string;
  image_url?: string;
  created_at: number;
}

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
