export interface User {
  id: number;
  username: string;
  nickname: string;
  bio: string | null;
  profileImageUrl: string | null;
  calendarColor: string | null;
  role: 'USER' | 'ADMIN' | 'BOT';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PostMedia {
  id: number;
  postId: number;
  mediaType: 'PHOTO' | 'GIF' | 'VIDEO';
  fileUrl: string;
  fileName: string | null;
  fileSize: number | null;
  duration: number | null;
  position: number;
  createdAt: string;
}

export interface Tag {
  id: number;
  name: string;
}

export interface Post {
  id: number;
  userId: number;
  content: string;
  createdAt: string;
  updatedAt: string;
  user: Pick<User, 'id' | 'username' | 'nickname' | 'profileImageUrl' | 'role'>;
  media: PostMedia[];
  tags: Array<{ tag: Tag }>;
  isLiked: boolean;
  _count: {
    likes: number;
    comments: number;
  };
}

export interface Comment {
  id: number;
  postId: number;
  parentCommentId: number | null;
  userId: number;
  content: string;
  createdAt: string;
  updatedAt: string;
  user: Pick<User, 'id' | 'username' | 'nickname' | 'profileImageUrl' | 'role'>;
  replies?: Comment[];
  _count?: { likes: number };
}

export interface Schedule {
  id: number;
  userId: number;
  title: string;
  memo: string | null;
  startDate: string;
  endDate: string;
  color: string;
  createdAt: string;
  updatedAt: string;
  user: Pick<User, 'id' | 'username' | 'nickname' | 'profileImageUrl' | 'calendarColor'>;
}

export interface Notification {
  id: number;
  postId: number | null;
  senderId: number;
  recipientId: number;
  notificationType: 'POST_MENTION' | 'COMMENT' | 'REPLY' | 'LIKE' | 'CUSTOM';
  message: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  sender: Pick<User, 'id' | 'nickname' | 'profileImageUrl'>;
  post: { id: number; content: string } | null;
}
