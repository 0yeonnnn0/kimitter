import axios from 'axios';
import { KisStockService } from './kisStockService';
import { config } from '../config/environment';
import { logger } from '../utils/logger';

jest.mock('axios');
jest.mock('../utils/logger');

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('KisStockService', () => {
  let service: KisStockService;

  beforeEach(() => {
    service = new KisStockService();
    jest.clearAllMocks();
  });

  describe('authenticate', () => {
    it('should send correct OAuth2 request and store token', async () => {
      const mockToken = 'eyJ0eXAiOiJKV1QiLCJhbGc...';
      const mockExpiresIn = 86400;

      mockedAxios.post.mockResolvedValueOnce({
        data: {
          access_token: mockToken,
          access_token_token_expired: '2026-02-14 04:54:57',
          token_type: 'Bearer',
          expires_in: mockExpiresIn,
        },
      });

      await service.authenticate();

      expect(mockedAxios.post).toHaveBeenCalledWith(
        `${config.kis.baseUrl}/oauth2/tokenP`,
        {
          grant_type: 'client_credentials',
          appkey: config.kis.appKey,
          appsecret: config.kis.appSecret,
        },
      );

      expect(logger.info).toHaveBeenCalledWith('KIS authentication successful');
    });

    it('should log error and throw on authentication failure', async () => {
      const mockError = new Error('Network error');

      mockedAxios.post.mockRejectedValueOnce(mockError);

      await expect(service.authenticate()).rejects.toThrow('Network error');

      expect(logger.error).toHaveBeenCalledWith('KIS authentication failed:', mockError);
    });
  });

  describe('getStockPrice', () => {
    beforeEach(async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          access_token: 'test-token',
          access_token_token_expired: '2026-02-14 04:54:57',
          token_type: 'Bearer',
          expires_in: 86400,
        },
      });
      await service.authenticate();
      jest.clearAllMocks();
    });

    it('should send correct headers and params for stock price request', async () => {
      const mockResponse = {
        data: {
          output: {
            stck_prpr: '72000',
            prdy_vrss: '-500',
            prdy_ctrt: '-0.69',
            acml_vol: '12345678',
            hts_kor_isnm: '삼성전자',
          },
        },
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await service.getStockPrice('005930');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        `${config.kis.baseUrl}/uapi/domestic-stock/v1/quotations/inquire-price`,
        {
          headers: expect.objectContaining({
            tr_id: 'FHKST01010100',
            authorization: expect.stringContaining('Bearer'),
            appkey: config.kis.appKey,
            appsecret: config.kis.appSecret,
          }),
          params: {
            FID_COND_MRKT_DIV_CODE: 'J',
            FID_INPUT_ISCD: '005930',
          },
        },
      );

      expect(result).toEqual({
        ticker: '005930',
        name: '삼성전자',
        currentPrice: 72000,
        changeRate: -0.69,
        changeAmount: -500,
        volume: 12345678,
      });
    });

    it('should return null on API failure', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('API error'));

      const result = await service.getStockPrice('005930');

      expect(result).toBeNull();
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to get stock price for ticker "005930":',
        expect.any(Error),
      );
    });

    it('should parse numeric values correctly', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          output: {
            stck_prpr: '50000',
            prdy_vrss: '1000',
            prdy_ctrt: '2.04',
            acml_vol: '5000000',
            hts_kor_isnm: '테스트주식',
          },
        },
      });

      const result = await service.getStockPrice('000001');

      expect(result).toEqual({
        ticker: '000001',
        name: '테스트주식',
        currentPrice: 50000,
        changeRate: 2.04,
        changeAmount: 1000,
        volume: 5000000,
      });
    });
  });

  describe('getTrendingStocks', () => {
    beforeEach(async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          access_token: 'test-token',
          access_token_token_expired: '2026-02-14 04:54:57',
          token_type: 'Bearer',
          expires_in: 86400,
        },
      });
      await service.authenticate();
      jest.clearAllMocks();
    });

    it('should send correct request and return parsed VolumeRankItem array', async () => {
      const mockResponse = {
        data: {
          output: [
            {
              hts_kor_isnm: '삼성전자',
              mksc_shrn_iscd: '005930',
              stck_prpr: '72000',
              prdy_ctrt: '-0.69',
              acml_vol: '12345678',
            },
            {
              hts_kor_isnm: 'SK하이닉스',
              mksc_shrn_iscd: '000660',
              stck_prpr: '180000',
              prdy_ctrt: '1.12',
              acml_vol: '9876543',
            },
          ],
        },
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await service.getTrendingStocks(2);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        `${config.kis.baseUrl}/uapi/domestic-stock/v1/quotations/volume-rank`,
        {
          headers: expect.objectContaining({
            tr_id: 'FHPST01710000',
            authorization: expect.stringContaining('Bearer'),
          }),
          params: {
            FID_COND_MRKT_DIV_CODE: 'J',
            FID_COND_SCR_DIV_CODE: '20174',
            FID_INPUT_ISCD: '0000',
            FID_DIV_CLS_CODE: '0',
            FID_BLNG_CLS_CODE: '0',
            FID_TRGT_CLS_CODE: '111111111',
            FID_TRGT_EXLS_CLS_CODE: '000000',
            FID_INPUT_PRICE_1: '',
            FID_INPUT_PRICE_2: '',
            FID_VOL_CNT: '',
            FID_INPUT_DATE_1: '',
          },
        },
      );

      expect(result).toEqual([
        {
          ticker: '005930',
          name: '삼성전자',
          currentPrice: 72000,
          changeRate: -0.69,
          volume: 12345678,
          rank: 1,
        },
        {
          ticker: '000660',
          name: 'SK하이닉스',
          currentPrice: 180000,
          changeRate: 1.12,
          volume: 9876543,
          rank: 2,
        },
      ]);
    });

    it('should respect count parameter and limit results', async () => {
      const mockResponse = {
        data: {
          output: Array.from({ length: 20 }, (_, i) => ({
            hts_kor_isnm: `Stock${i}`,
            mksc_shrn_iscd: `00000${i}`,
            stck_prpr: '100000',
            prdy_ctrt: '0.5',
            acml_vol: '1000000',
          })),
        },
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await service.getTrendingStocks(5);

      expect(result).toHaveLength(5);
      expect(result[0].rank).toBe(1);
      expect(result[4].rank).toBe(5);
    });

    it('should return empty array on API failure', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('API error'));

      const result = await service.getTrendingStocks();

      expect(result).toEqual([]);
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to get trending stocks:',
        expect.any(Error),
      );
    });

    it('should use default count of 10 when not specified', async () => {
      const mockResponse = {
        data: {
          output: Array.from({ length: 15 }, (_, i) => ({
            hts_kor_isnm: `Stock${i}`,
            mksc_shrn_iscd: `00000${i}`,
            stck_prpr: '100000',
            prdy_ctrt: '0.5',
            acml_vol: '1000000',
          })),
        },
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await service.getTrendingStocks();

      expect(result).toHaveLength(10);
    });
  });

  describe('Token auto-renewal', () => {
    it('should re-authenticate when token is expired', async () => {
      const firstToken = 'first-token';
      const secondToken = 'second-token';

      mockedAxios.post.mockResolvedValueOnce({
        data: {
          access_token: firstToken,
          access_token_token_expired: '2026-02-14 04:54:57',
          token_type: 'Bearer',
          expires_in: 1,
        },
      });

      await service.authenticate();

      jest.clearAllMocks();

      await new Promise((resolve) => setTimeout(resolve, 1100));

      mockedAxios.post.mockResolvedValueOnce({
        data: {
          access_token: secondToken,
          access_token_token_expired: '2026-02-14 05:54:57',
          token_type: 'Bearer',
          expires_in: 86400,
        },
      });

      mockedAxios.get.mockResolvedValueOnce({
        data: {
          output: {
            stck_prpr: '72000',
            prdy_vrss: '-500',
            prdy_ctrt: '-0.69',
            acml_vol: '12345678',
            hts_kor_isnm: '삼성전자',
          },
        },
      });

      await service.getStockPrice('005930');

      expect(mockedAxios.post).toHaveBeenCalledWith(
        `${config.kis.baseUrl}/oauth2/tokenP`,
        expect.any(Object),
      );
    });
  });

  describe('Error handling', () => {
    it('should handle malformed API response gracefully', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          access_token: 'test-token',
          access_token_token_expired: '2026-02-14 04:54:57',
          token_type: 'Bearer',
          expires_in: 86400,
        },
      });

      await service.authenticate();
      jest.clearAllMocks();

      mockedAxios.get.mockRejectedValueOnce(new Error('Invalid response'));

      const result = await service.getStockPrice('005930');

      expect(result).toBeNull();
    });

    it('getTrendingStocks should return empty array on network error', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          access_token: 'test-token',
          access_token_token_expired: '2026-02-14 04:54:57',
          token_type: 'Bearer',
          expires_in: 86400,
        },
      });

      await service.authenticate();
      jest.clearAllMocks();

      mockedAxios.get.mockRejectedValueOnce(new Error('Network timeout'));

      const result = await service.getTrendingStocks();

      expect(result).toEqual([]);
    });
  });
});
