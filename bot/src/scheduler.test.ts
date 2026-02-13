import cron from 'node-cron';
import { BotScheduler } from './scheduler';
import { KimitterClient } from './api/kimitterClient';

jest.mock('node-cron');
jest.mock('./api/kimitterClient');
jest.mock('./bots/stockBot');
jest.mock('./bots/politicsBot');
jest.mock('./bots/newsBot');
jest.mock('./config/environment', () => ({
  config: {
    kimitter: {
      apiUrl: 'http://localhost:3000/api',
    },
    bots: {
      stock: {
        username: 'stock-bot',
        password: 'test-password',
      },
      politics: {
        username: 'politics-bot',
        password: 'test-password',
      },
      news: {
        username: 'news-bot',
        password: 'test-password',
      },
    },
    bot: {
      enabled: true,
      webhookPort: 4000,
    },
  },
}));

const mockSchedule = jest.fn();
const mockStop = jest.fn();

describe('BotScheduler', () => {
  let scheduler: BotScheduler;
  let mockStockClient: jest.Mocked<KimitterClient>;
  let mockPoliticsClient: jest.Mocked<KimitterClient>;
  let mockNewsClient: jest.Mocked<KimitterClient>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockStockClient = {
      login: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<KimitterClient>;

    mockPoliticsClient = {
      login: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<KimitterClient>;

    mockNewsClient = {
      login: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<KimitterClient>;

    (KimitterClient as jest.MockedClass<typeof KimitterClient>).mockImplementation(
      (config) => {
        if (config.username === 'stock-bot') {
          return mockStockClient;
        } else if (config.username === 'politics-bot') {
          return mockPoliticsClient;
        } else {
          return mockNewsClient;
        }
      },
    );

    mockSchedule.mockReturnValue({
      stop: mockStop,
    } as unknown as cron.ScheduledTask);

    (cron.schedule as jest.Mock) = mockSchedule;

    scheduler = new BotScheduler();
  });

  describe('initialize', () => {
    it('should create and login 3 bot clients', async () => {
      await scheduler.initialize();

      expect(KimitterClient).toHaveBeenCalledTimes(3);
      expect(KimitterClient).toHaveBeenCalledWith({
        apiUrl: 'http://localhost:3000/api',
        username: 'stock-bot',
        password: 'test-password',
      });
      expect(KimitterClient).toHaveBeenCalledWith({
        apiUrl: 'http://localhost:3000/api',
        username: 'politics-bot',
        password: 'test-password',
      });
      expect(KimitterClient).toHaveBeenCalledWith({
        apiUrl: 'http://localhost:3000/api',
        username: 'news-bot',
        password: 'test-password',
      });

      expect(mockStockClient.login).toHaveBeenCalledTimes(1);
      expect(mockPoliticsClient.login).toHaveBeenCalledTimes(1);
      expect(mockNewsClient.login).toHaveBeenCalledTimes(1);
    });
  });

  describe('start', () => {
    beforeEach(async () => {
      await scheduler.initialize();
    });

    it('should register 3 cron jobs with correct expressions', () => {
      scheduler.start();

      expect(mockSchedule).toHaveBeenCalledTimes(3);

      expect(mockSchedule).toHaveBeenCalledWith(
        '0 8 * * *',
        expect.any(Function),
        { timezone: 'Asia/Seoul' },
      );

      expect(mockSchedule).toHaveBeenCalledWith(
        '1 8 * * *',
        expect.any(Function),
        { timezone: 'Asia/Seoul' },
      );

      expect(mockSchedule).toHaveBeenCalledWith(
        '2 8 * * 1',
        expect.any(Function),
        { timezone: 'Asia/Seoul' },
      );

      const tasks = scheduler.getTasks();
      expect(tasks).toHaveLength(3);
      expect(tasks[0].name).toBe('politics-bot');
      expect(tasks[0].cronExpression).toBe('0 8 * * *');
      expect(tasks[1].name).toBe('news-bot');
      expect(tasks[1].cronExpression).toBe('1 8 * * *');
      expect(tasks[2].name).toBe('stock-bot');
      expect(tasks[2].cronExpression).toBe('2 8 * * 1');
    });

    it('should not register jobs when BOT_ENABLED is false', () => {
      jest.resetModules();
      jest.doMock('./config/environment', () => ({
        config: {
          kimitter: {
            apiUrl: 'http://localhost:3000/api',
          },
          bots: {
            stock: {
              username: 'stock-bot',
              password: 'test-password',
            },
            politics: {
              username: 'politics-bot',
              password: 'test-password',
            },
            news: {
              username: 'news-bot',
              password: 'test-password',
            },
          },
          bot: {
            enabled: false,
            webhookPort: 4000,
          },
        },
      }));

      const { BotScheduler: DisabledScheduler } = require('./scheduler');
      const disabledScheduler = new DisabledScheduler();

      disabledScheduler.start();

      expect(mockSchedule).not.toHaveBeenCalled();
      expect(disabledScheduler.getTasks()).toHaveLength(0);
    });
  });

  describe('stop', () => {
    beforeEach(async () => {
      await scheduler.initialize();
      scheduler.start();
    });

    it('should stop all scheduled tasks', () => {
      scheduler.stop();

      expect(mockStop).toHaveBeenCalledTimes(3);
    });
  });

  describe('getTasks', () => {
    beforeEach(async () => {
      await scheduler.initialize();
      scheduler.start();
    });

    it('should return a copy of tasks array', () => {
      const tasks1 = scheduler.getTasks();
      const tasks2 = scheduler.getTasks();

      expect(tasks1).toEqual(tasks2);
      expect(tasks1).not.toBe(tasks2);
    });
  });
});
