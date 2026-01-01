import type {
  FacilitatorConfig,
  PaymentPayload,
  PaymentRequirements,
  VerifyResponse,
  SettleResponse,
  SupportedResponse,
} from './types.js';
import {
  FacilitatorError,
  NetworkError,
  VerificationError,
  SettlementError,
  ConfigurationError,
} from './errors.js';
import { buildUrl, normalizeUrl } from './utils.js';

const DEFAULT_TIMEOUT = 30000;

export class OpenFacilitator {
  private readonly baseUrl: string;
  private readonly timeout: number;
  private readonly headers: Record<string, string>;

  constructor(config: FacilitatorConfig) {
    if (!config.url) {
      throw new ConfigurationError('Facilitator URL is required');
    }

    this.baseUrl = normalizeUrl(config.url);
    this.timeout = config.timeout ?? DEFAULT_TIMEOUT;
    this.headers = {
      'Content-Type': 'application/json',
      ...config.headers,
    };
  }

  /**
   * Get the facilitator URL
   */
  get url(): string {
    return this.baseUrl;
  }

  /**
   * Verify a payment is valid
   * @param payment - The payment payload
   * @param requirements - Payment requirements for validation
   */
  async verify(
    payment: PaymentPayload,
    requirements: PaymentRequirements
  ): Promise<VerifyResponse> {
    try {
      const body = {
        x402Version: payment.x402Version,
        paymentPayload: payment,
        paymentRequirements: requirements,
      };

      const response = await this.request<VerifyResponse>('/verify', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      return response;
    } catch (error) {
      if (error instanceof FacilitatorError) throw error;
      throw new VerificationError(
        `Verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error
      );
    }
  }

  /**
   * Settle/broadcast a payment transaction
   * @param payment - The payment payload
   * @param requirements - Payment requirements for validation
   */
  async settle(
    payment: PaymentPayload,
    requirements: PaymentRequirements
  ): Promise<SettleResponse> {
    try {
      const body = {
        x402Version: payment.x402Version,
        paymentPayload: payment,
        paymentRequirements: requirements,
      };

      const response = await this.request<SettleResponse>('/settle', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      return response;
    } catch (error) {
      if (error instanceof FacilitatorError) throw error;
      throw new SettlementError(
        `Settlement failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error
      );
    }
  }

  /**
   * Get supported networks and payment kinds
   */
  async supported(): Promise<SupportedResponse> {
    try {
      const response = await this.request<SupportedResponse>('/supported', {
        method: 'GET',
      });

      return response;
    } catch (error) {
      if (error instanceof FacilitatorError) throw error;
      throw new NetworkError(
        `Failed to fetch supported networks: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error
      );
    }
  }

  /**
   * Health check - verify facilitator is reachable
   */
  async health(): Promise<boolean> {
    try {
      await this.supported();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Internal request helper
   */
  private async request<T>(path: string, init: RequestInit): Promise<T> {
    const url = buildUrl(this.baseUrl, path);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...init,
        headers: {
          ...this.headers,
          ...(init.headers as Record<string, string>),
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorBody = await response.json();
          errorMessage = errorBody.error || errorBody.message || errorMessage;
        } catch {
          // Ignore JSON parse errors
        }

        throw new FacilitatorError(errorMessage, 'HTTP_ERROR', response.status);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof FacilitatorError) throw error;

      if (error instanceof Error && error.name === 'AbortError') {
        throw new NetworkError(`Request timeout after ${this.timeout}ms`);
      }

      throw new NetworkError(
        `Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error
      );
    }
  }
}

/**
 * Create a facilitator client with default OpenFacilitator URL
 */
export function createDefaultFacilitator(): OpenFacilitator {
  return new OpenFacilitator({
    url: 'https://pay.openfacilitator.io',
  });
}
