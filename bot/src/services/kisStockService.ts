import axios from 'axios';
import { config } from '../config/environment';
import { logger } from '../utils/logger';

export interface StockPrice {
  ticker: string;
  name: string;
  currentPrice: number;
  changeRate: number;
  changeAmount: number;
  volume: number;
}

export interface VolumeRankItem {
  ticker: string;
  name: string;
  currentPrice: number;
  changeRate: number;
  volume: number;
  rank: number;
}

interface OAuthTokenResponse {
  access_token: string;
  access_token_token_expired: string;
  token_type: string;
  expires_in: number;
}

interface StockPriceResponse {
  output: {
    stck_prpr: string;
    prdy_vrss: string;
    prdy_ctrt: string;
    acml_vol: string;
    hts_kor_isnm: string;
  };
}

interface VolumeRankResponse {
  output: Array<{
    hts_kor_isnm: string;
    mksc_shrn_iscd: string;
    stck_prpr: string;
    prdy_ctrt: string;
    acml_vol: string;
  }>;
}

export class KisStockService {
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  async authenticate(): Promise<void> {
    try {
      const response = await axios.post<OAuthTokenResponse>(
        `${config.kis.baseUrl}/oauth2/tokenP`,
        {
          grant_type: 'client_credentials',
          appkey: config.kis.appKey,
          appsecret: config.kis.appSecret,
        },
      );

      this.accessToken = response.data.access_token;

      // Calculate expiry: current time + expires_in seconds
      const expiresInMs = response.data.expires_in * 1000;
      this.tokenExpiry = new Date(Date.now() + expiresInMs);

      logger.info('KIS authentication successful');
    } catch (error) {
      logger.error('KIS authentication failed:', error);
      throw error;
    }
  }

  private async ensureAuthenticated(): Promise<void> {
    if (!this.accessToken || !this.tokenExpiry || new Date() >= this.tokenExpiry) {
      await this.authenticate();
    }
  }

  private getHeaders(trId: string): Record<string, string> {
    return {
      authorization: `Bearer ${this.accessToken}`,
      appkey: config.kis.appKey,
      appsecret: config.kis.appSecret,
      tr_id: trId,
      'Content-Type': 'application/json; charset=utf-8',
    };
  }

  async getStockPrice(ticker: string): Promise<StockPrice | null> {
    try {
      await this.ensureAuthenticated();

      const response = await axios.get<StockPriceResponse>(
        `${config.kis.baseUrl}/uapi/domestic-stock/v1/quotations/inquire-price`,
        {
          headers: this.getHeaders('FHKST01010100'),
          params: {
            FID_COND_MRKT_DIV_CODE: 'J',
            FID_INPUT_ISCD: ticker,
          },
        },
      );

      const output = response.data.output;

      return {
        ticker,
        name: output.hts_kor_isnm,
        currentPrice: parseInt(output.stck_prpr, 10),
        changeRate: parseFloat(output.prdy_ctrt),
        changeAmount: parseInt(output.prdy_vrss, 10),
        volume: parseInt(output.acml_vol, 10),
      };
    } catch (error) {
      logger.error(`Failed to get stock price for ticker "${ticker}":`, error);
      return null;
    }
  }

  async getTrendingStocks(count: number = 10): Promise<VolumeRankItem[]> {
    try {
      await this.ensureAuthenticated();

      const response = await axios.get<VolumeRankResponse>(
        `${config.kis.baseUrl}/uapi/domestic-stock/v1/quotations/volume-rank`,
        {
          headers: this.getHeaders('FHPST01710000'),
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

      return response.data.output.slice(0, count).map((item, index) => ({
        ticker: item.mksc_shrn_iscd,
        name: item.hts_kor_isnm,
        currentPrice: parseInt(item.stck_prpr, 10),
        changeRate: parseFloat(item.prdy_ctrt),
        volume: parseInt(item.acml_vol, 10),
        rank: index + 1,
      }));
    } catch (error) {
      logger.error('Failed to get trending stocks:', error);
      return [];
    }
  }
}
