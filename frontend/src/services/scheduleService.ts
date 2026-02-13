import api from './api';
import type { ApiResponse } from '../types/api';
import type { Schedule } from '../types/models';

export interface CreateScheduleBody {
  title: string;
  startDate: string;
  endDate: string;
  memo?: string;
  color?: string;
}

export interface UpdateScheduleBody {
  title?: string;
  startDate?: string;
  endDate?: string;
  memo?: string;
  color?: string;
}

export const getSchedulesByMonth = (year: number, month: number) =>
  api.get<ApiResponse<Schedule[]>>('/schedules', { params: { year, month } });

export const getSchedulesByDate = (date: string) =>
  api.get<ApiResponse<Schedule[]>>('/schedules/date', { params: { date } });

export const createSchedule = (body: CreateScheduleBody) =>
  api.post<ApiResponse<Schedule>>('/schedules', body);

export const updateSchedule = (id: number, body: UpdateScheduleBody) =>
  api.put<ApiResponse<Schedule>>(`/schedules/${id}`, body);

export const deleteSchedule = (id: number) =>
  api.delete(`/schedules/${id}`);
