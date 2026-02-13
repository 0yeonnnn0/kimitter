import { Request, Response, NextFunction } from 'express';
import * as scheduleService from '../services/scheduleService';

export const getByMonth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const year = Number(req.query.year);
    const month = Number(req.query.month);
    const schedules = await scheduleService.getByMonth(year, month);
    res.json({ success: true, data: schedules });
  } catch (err) {
    next(err);
  }
};

export const getByDate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const date = req.query.date as string;
    const schedules = await scheduleService.getByDate(date);
    res.json({ success: true, data: schedules });
  } catch (err) {
    next(err);
  }
};

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schedule = await scheduleService.create(req.userId!, req.body);
    res.status(201).json({ success: true, data: schedule });
  } catch (err) {
    next(err);
  }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schedule = await scheduleService.update(
      Number(req.params.id),
      req.userId!,
      req.body,
    );
    res.json({ success: true, data: schedule });
  } catch (err) {
    next(err);
  }
};

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await scheduleService.remove(Number(req.params.id), req.userId!, req.userRole!);
    res.json({ success: true, data: null });
  } catch (err) {
    next(err);
  }
};
