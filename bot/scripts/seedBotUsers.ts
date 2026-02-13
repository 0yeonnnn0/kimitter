import axios from 'axios';
import crypto from 'crypto';
import { config } from '../src/config/environment';

interface BotUser {
  username: string;
  password: string;
  nickname: string;
  role: string;
}

function generatePassword(): string {
  return crypto.randomBytes(32).toString('hex');
}

const botUsers: BotUser[] = [
  {
    username: 'stock-bot',
    password: generatePassword(),
    nickname: '📊 주식봇',
    role: 'BOT',
  },
  {
    username: 'politics-bot',
    password: generatePassword(),
    nickname: '🏛️ 정치봇',
    role: 'BOT',
  },
  {
    username: 'news-bot',
    password: generatePassword(),
    nickname: '📰 뉴스봇',
    role: 'BOT',
  },
];

async function seedBotUsers(): Promise<void> {
  console.log('=== Kimitter Bot User Seed Script ===\n');
  console.log('This script generates bot user credentials.');
  console.log('You need to manually create these users via the Kimitter API.\n');

  console.log('IMPORTANT: Save these credentials to your .env file:\n');

  for (const bot of botUsers) {
    console.log(`# ${bot.nickname}`);
    console.log(`BOT_${bot.username.replace('-bot', '').toUpperCase()}_USERNAME=${bot.username}`);
    console.log(`BOT_${bot.username.replace('-bot', '').toUpperCase()}_PASSWORD=${bot.password}`);
    console.log('');
  }

  console.log('\n=== Manual Registration Steps ===\n');
  console.log('1. Get an invitation code from an admin user');
  console.log('2. For each bot, make a POST request to /auth/register:');
  console.log('');

  for (const bot of botUsers) {
    console.log(`curl -X POST ${config.kimitter.apiUrl}/auth/register \\`);
    console.log(`  -H "Content-Type: application/json" \\`);
    console.log(`  -d '{`);
    console.log(`    "invitationCode": "YOUR_INVITATION_CODE",`);
    console.log(`    "username": "${bot.username}",`);
    console.log(`    "password": "${bot.password}",`);
    console.log(`    "nickname": "${bot.nickname}"`);
    console.log(`  }'\n`);
  }

  console.log('3. After registration, update the user role to BOT via database:');
  console.log('   UPDATE "User" SET role = \'BOT\' WHERE username IN (\'stock-bot\', \'politics-bot\', \'news-bot\');\n');

  console.log('=== Alternative: Admin API (if available) ===\n');
  console.log('If your Kimitter API has an admin endpoint for creating users,');
  console.log('you can modify this script to automatically create the bot users.\n');

  const adminToken = process.env.ADMIN_TOKEN;
  if (adminToken) {
    console.log('ADMIN_TOKEN detected. Attempting automatic registration...\n');

    for (const bot of botUsers) {
      try {
        const response = await axios.post(
          `${config.kimitter.apiUrl}/admin/users`,
          {
            username: bot.username,
            password: bot.password,
            nickname: bot.nickname,
            role: 'BOT',
          },
          {
            headers: {
              Authorization: `Bearer ${adminToken}`,
            },
          },
        );

        console.log(`✓ Created ${bot.nickname} (${bot.username})`);
      } catch (error) {
        if (axios.isAxiosError(error)) {
          if (error.response?.status === 409) {
            console.log(`⚠ ${bot.nickname} (${bot.username}) already exists`);
          } else {
            console.error(`✗ Failed to create ${bot.nickname}: ${error.message}`);
          }
        } else {
          console.error(`✗ Failed to create ${bot.nickname}:`, error);
        }
      }
    }
  }
}

seedBotUsers().catch((error) => {
  console.error('Seed script failed:', error);
  process.exit(1);
});
