import { generateCommentReply, BotType } from '../services/openaiService';
import { KimitterClient } from '../api/kimitterClient';
import { config } from '../config/environment';
import { logger } from '../utils/logger';

export interface WebhookPayload {
  postId: number;
  commentId: number;
  commentContent: string;
  commentAuthor: {
    id: number;
    username: string;
    role: string;
  };
  parentCommentId: number | null;
}

interface BotPostsResponse {
  posts: Array<{ id: number }>;
}

interface CommentResponse {
  id: number;
  content: string;
  author: {
    nickname: string;
    role: string;
  };
}

export const botClients = new Map<BotType, KimitterClient>();

export async function initializeBotClients(): Promise<void> {
  const botConfigs: Array<{ type: BotType; username: string; password: string }> = [
    { type: 'stock', username: config.bots.stock.username, password: config.bots.stock.password },
    {
      type: 'politics',
      username: config.bots.politics.username,
      password: config.bots.politics.password,
    },
    { type: 'news', username: config.bots.news.username, password: config.bots.news.password },
  ];

  for (const botConfig of botConfigs) {
    const client = new KimitterClient({
      apiUrl: config.kimitter.apiUrl,
      username: botConfig.username,
      password: botConfig.password,
    });

    await client.login();
    botClients.set(botConfig.type, client);
    logger.info(`Initialized bot client: ${botConfig.type}`);
  }
}

export async function getBotTypeByPostId(
  postId: number,
  clients: Map<BotType, KimitterClient> = botClients,
): Promise<{ botType: BotType; client: KimitterClient } | null> {
  for (const [botType, client] of clients.entries()) {
    try {
      const response = (await client.getMyPosts()) as BotPostsResponse;
      const posts = response.posts || [];

      if (posts.some((post) => post.id === postId)) {
        return { botType, client };
      }
    } catch (error) {
      logger.error(`Failed to get posts for bot ${botType}:`, error);
    }
  }

  return null;
}

export async function handleCommentWebhook(
  payload: WebhookPayload,
  getBotFn: typeof getBotTypeByPostId = getBotTypeByPostId,
): Promise<void> {
  try {
    if (payload.commentAuthor.role === 'BOT') {
      logger.info(
        `Ignoring bot comment (commentId: ${payload.commentId}) to prevent BOT→BOT interaction`,
      );
      return;
    }

    const botMatch = await getBotFn(payload.postId);

    if (!botMatch) {
      logger.warn(`Post ${payload.postId} not owned by any bot, skipping reply`);
      return;
    }

    const { botType, client } = botMatch;

    const postContent = '';

    let commentThread: Array<{ nickname: string; content: string; role: string }> = [];
    try {
      const commentsResponse = (await client.getComments(payload.postId)) as {
        comments: CommentResponse[];
      };
      const comments = commentsResponse.comments || [];

      commentThread = comments.map((c) => ({
        nickname: c.author.nickname,
        content: c.content,
        role: c.author.role,
      }));
    } catch (error) {
      logger.warn(`Failed to fetch comment thread for post ${payload.postId}:`, error);
    }

    const replyContent = await generateCommentReply(
      botType,
      postContent,
      commentThread,
      payload.commentContent,
    );

    if (!replyContent) {
      logger.warn(`Failed to generate reply for comment ${payload.commentId}`);
      return;
    }

    if (payload.parentCommentId) {
      await client.createReply(payload.commentId, replyContent);
      logger.info(
        `Bot ${botType} replied to comment ${payload.commentId} (reply to parent ${payload.parentCommentId})`,
      );
    } else {
      await client.createComment(payload.postId, replyContent);
      logger.info(`Bot ${botType} replied to comment ${payload.commentId} on post ${payload.postId}`);
    }
  } catch (error) {
    logger.error('Error handling comment webhook:', error);
  }
}
