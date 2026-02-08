import { PrismaClient } from '@prisma/client';
import { config } from './environment';

export const prisma = new PrismaClient({
  log: config.nodeEnv === 'development' ? ['query', 'warn', 'error'] : ['error'],
});
