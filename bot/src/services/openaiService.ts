import OpenAI from 'openai';
import { config } from '../config/environment';
import { prompts } from '../config/prompts';
import { logger } from '../utils/logger';

export type BotType = 'stock' | 'politics' | 'news';

let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: config.openai.apiKey,
    });
  }
  return openaiClient;
}

export function resetOpenAIClient(): void {
  openaiClient = null;
}

export async function generatePostContent(
  type: BotType,
  rawData: string,
): Promise<string | null> {
  try {
    const client = getOpenAIClient();

    const promptMap: Record<BotType, string> = {
      stock: prompts.stockPost,
      politics: prompts.politicsPost,
      news: prompts.newsPost,
    };

    const systemPrompt = promptMap[type];

    const response = await client.chat.completions.create({
      model: config.openai.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: rawData },
      ],
      temperature: 0.7,
      max_tokens: 1500,
    });

    const content = response.choices[0]?.message?.content ?? null;

    if (response.usage) {
      logger.info(
        `OpenAI token usage for ${type} post: prompt=${response.usage.prompt_tokens}, completion=${response.usage.completion_tokens}, total=${response.usage.total_tokens}`,
      );
    }

    return content;
  } catch (error) {
    logger.error(`Failed to generate ${type} post content:`, error);
    return null;
  }
}

export async function generateCommentReply(
  botType: BotType,
  postContent: string,
  commentThread: Array<{ nickname: string; content: string; role: string }>,
  userComment: string,
): Promise<string | null> {
  try {
    const client = getOpenAIClient();

    const replyPromptMap: Record<BotType, string> = {
      stock: prompts.stockReply,
      politics: prompts.politicsReply,
      news: prompts.newsReply,
    };

    const systemPrompt = replyPromptMap[botType];

    const threadContext = commentThread
      .map((c) => `[${c.role}] ${c.nickname}: ${c.content}`)
      .join('\n');

    const userMessage = `게시물 내용:
${postContent}

댓글 맥락:
${threadContext}

새 댓글: ${userComment}`;

    const response = await client.chat.completions.create({
      model: config.openai.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const content = response.choices[0]?.message?.content ?? null;

    if (response.usage) {
      logger.info(
        `OpenAI token usage for ${botType} reply: prompt=${response.usage.prompt_tokens}, completion=${response.usage.completion_tokens}, total=${response.usage.total_tokens}`,
      );
    }

    return content;
  } catch (error) {
    logger.error(`Failed to generate ${botType} comment reply:`, error);
    return null;
  }
}
