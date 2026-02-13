import { KimitterClient } from '../api/kimitterClient';

export type BotType = 'stock' | 'politics' | 'news';

export interface BotConfig {
  type: BotType;
  client: KimitterClient;
  tags: string[];
}

export interface BaseBot {
  generatePost(): Promise<void>;
  getType(): BotType;
}

interface Post {
  id: number;
  content: string;
  createdAt: string;
}

interface PostsResponse {
  posts: Post[];
}

/**
 * Check if the bot has already posted today (KST timezone)
 */
export async function hasPostedToday(client: KimitterClient): Promise<boolean> {
  try {
    const response = await client.getMyPosts(1, 5);
    const postsData = response as PostsResponse;
    const posts = postsData.posts || [];

    // Get today's date in KST timezone
    const now = new Date();
    const kstOffset = 9 * 60; // KST is UTC+9
    const kstTime = new Date(now.getTime() + kstOffset * 60 * 1000);
    const todayKST = new Date(kstTime.getFullYear(), kstTime.getMonth(), kstTime.getDate());

    // Check if any post was created today (KST)
    for (const post of posts) {
      const postDate = new Date(post.createdAt);
      const postKstTime = new Date(postDate.getTime() + kstOffset * 60 * 1000);
      const postDateKST = new Date(
        postKstTime.getFullYear(),
        postKstTime.getMonth(),
        postKstTime.getDate(),
      );

      if (postDateKST.getTime() === todayKST.getTime()) {
        return true;
      }
    }

    return false;
  } catch (error) {
    // If there's an error checking, assume we haven't posted to be safe
    return false;
  }
}
