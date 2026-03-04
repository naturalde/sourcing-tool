import { ProductDTO } from "@/types/product";

export type ExportFormat = 'csv' | 'json';
export type ExportMode = 'basic' | 'detailed';

interface DetailedProductData extends ProductDTO {
  detailedInfo?: {
    seller: {
      name: string;
      location: string;
      rating?: number;
    };
    sales_volume?: number;
    moq?: number;
    description?: string;
  };
}

export function convertToCSV(products: DetailedProductData[], mode: ExportMode): string {
  if (products.length === 0) return '';

  // Define headers based on mode
  const basicHeaders = [
    'ID',
    'Title',
    'Price',
    'Currency',
    'Platform',
    'URL',
    'Image URL'
  ];

  const detailedHeaders = [
    ...basicHeaders,
    'Seller Name',
    'Seller Location',
    'Seller Rating',
    'Sales Volume',
    'MOQ',
    'Description'
  ];

  const headers = mode === 'detailed' ? detailedHeaders : basicHeaders;

  // Create CSV rows
  const rows = products.map(product => {
    const basicData = [
      product.id,
      `"${product.title.replace(/"/g, '""')}"`, // Escape quotes
      product.price.current,
      product.price.currency,
      product.source,
      product.url,
      product.image_urls[0] || ''
    ];

    if (mode === 'detailed') {
      const detailed = product.detailedInfo;
      return [
        ...basicData,
        detailed?.seller?.name || '',
        detailed?.seller?.location || '',
        detailed?.seller?.rating || '',
        detailed?.sales_volume || '',
        detailed?.moq || '',
        `"${(detailed?.description || '').replace(/"/g, '""')}"`
      ].join(',');
    }

    return basicData.join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

export function convertToJSON(products: DetailedProductData[], mode: ExportMode): string {
  if (mode === 'basic') {
    // Export only basic fields
    const basicProducts = products.map(p => ({
      id: p.id,
      title: p.title,
      price: p.price,
      platform: p.source,
      url: p.url,
      image_url: p.image_urls[0] || null
    }));
    return JSON.stringify(basicProducts, null, 2);
  } else {
    // Export full data including detailed info
    return JSON.stringify(products, null, 2);
  }
}

export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function fetchDetailedProductInfo(productId: string): Promise<any> {
  try {
    const response = await fetch(`/api/product-details?productId=${productId}`);
    if (!response.ok) {
      console.error(`Failed to fetch details for product ${productId}`);
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching details for product ${productId}:`, error);
    return null;
  }
}
