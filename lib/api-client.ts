import { SearchRequest, SearchResponse, ProductDTO } from '@/types/product';
import { TrendData } from '@/types/product';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

class APIClient {
  private async fetch<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(error.message || `API error: ${response.status}`);
    }

    return response.json();
  }

  async search(request: SearchRequest): Promise<SearchResponse> {
    return this.fetch<SearchResponse>('/api/search', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getProductDetail(source: string, sourceId: string): Promise<ProductDTO> {
    return this.fetch<ProductDTO>(`/api/products/${source}/${sourceId}`);
  }

  async getTrend(keyword: string, region?: string, timeframe?: string): Promise<TrendData> {
    const params = new URLSearchParams({
      keyword,
      ...(region && { region }),
      ...(timeframe && { timeframe }),
    });
    return this.fetch<TrendData>(`/api/trends?${params}`);
  }
}

export const apiClient = new APIClient();
