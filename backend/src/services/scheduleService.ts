import { prisma } from '../config/database';
import { ForbiddenError, NotFoundError } from '../utils/errors';

const scheduleInclude = {
  user: { select: { id: true, username: true, nickname: true, profileImageUrl: true, calendarColor: true } },
};

export const getByMonth = async (year: number, month: number) => {
  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0);

  return prisma.schedule.findMany({
    where: {
      startDate: { lte: endOfMonth },
      endDate: { gte: startOfMonth },
    },
    include: scheduleInclude,
    orderBy: { startDate: 'asc' },
  });
};

export const getByDate = async (date: string) => {
  const target = new Date(date);

  return prisma.schedule.findMany({
    where: {
      startDate: { lte: target },
      endDate: { gte: target },
    },
    include: scheduleInclude,
    orderBy: { startDate: 'asc' },
  });
};

export const create = async (
  userId: number,
  data: { title: string; startDate: string; endDate: string; memo?: string; color?: string },
) => {
  return prisma.schedule.create({
    data: {
      userId,
      title: data.title,
      memo: data.memo ?? null,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      color: data.color ?? '#4A90D9',
    },
    include: scheduleInclude,
  });
};

export const update = async (
  scheduleId: number,
  userId: number,
  data: { title?: string; startDate?: string; endDate?: string; memo?: string; color?: string },
) => {
  const schedule = await prisma.schedule.findUnique({ where: { id: scheduleId } });
  if (!schedule) throw new NotFoundError('Schedule');
  if (schedule.userId !== userId) throw new ForbiddenError('Only the creator can edit this schedule');

  return prisma.schedule.update({
    where: { id: scheduleId },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.memo !== undefined && { memo: data.memo || null }),
      ...(data.startDate !== undefined && { startDate: new Date(data.startDate) }),
      ...(data.endDate !== undefined && { endDate: new Date(data.endDate) }),
      ...(data.color !== undefined && { color: data.color }),
    },
    include: scheduleInclude,
  });
};

export const remove = async (scheduleId: number, userId: number, role: string) => {
  const schedule = await prisma.schedule.findUnique({ where: { id: scheduleId } });
  if (!schedule) throw new NotFoundError('Schedule');
  if (schedule.userId !== userId && role !== 'ADMIN') {
    throw new ForbiddenError('Only the creator or admin can delete this schedule');
  }

  await prisma.schedule.delete({ where: { id: scheduleId } });
};
