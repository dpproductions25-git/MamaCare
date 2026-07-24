/**
 * CJ Dropshipping API client.
 * Docs: https://developers.cjdropshipping.com/en/api/overview.html
 */

type TokenCache = { token: string; expiresAt: number };
let tokenCache: TokenCache | null = null;
const CJ_BASE = process.env.CJ_API_BASE || 'https://developers.cjdropshipping.com/api2.0/v1';

async function getAccessToken(): Promise<string> {
  const now = Date.now();
  if (tokenCache && tokenCache.expiresAt > now + 60_000) return tokenCache.token;

  const email = process.env.CJ_API_EMAIL;
  const apiKey = process.env.CJ_API_KEY;
  if (!email || !apiKey) throw new Error('CJ_API_EMAIL and CJ_API_KEY must be set.');

  const res = await fetch(`${CJ_BASE}/authentication/getAccessToken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, apiKey })
  });
  if (!res.ok) throw new Error(`CJ auth failed: ${res.status} ${await res.text()}`);

  const json = (await res.json()) as {
    code: number;
    result: boolean;
    message: string;
    data: { accessToken: string; accessTokenExpiryDate: string };
  };
  if (!json.result) throw new Error(`CJ auth error: ${json.message}`);

  tokenCache = {
    token: json.data.accessToken,
    expiresAt: new Date(json.data.accessTokenExpiryDate).getTime()
  };
  return tokenCache.token;
}

async function cjFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await getAccessToken();
  const res = await fetch(`${CJ_BASE}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', 'CJ-Access-Token': token, ...(init.headers || {}) }
  });
  if (!res.ok) throw new Error(`CJ ${path} failed: ${res.status} ${await res.text()}`);
  const json = (await res.json()) as { code: number; result: boolean; message: string; data: T };
  if (!json.result) throw new Error(`CJ ${path} error: ${json.message}`);
  return json.data;
}

export type CjProduct = {
  pid: string;
  productName: string;
  productNameEn: string;
  productImage: string;
  sellPrice: string;
  productSku: string;
};

export async function searchProducts(query: string, page = 1): Promise<CjProduct[]> {
  const data = await cjFetch<{ list: CjProduct[] }>(
    `/product/list?productName=${encodeURIComponent(query)}&pageNum=${page}&pageSize=20`
  );
  return data.list;
}

export async function getProductDetails(pid: string) {
  return cjFetch<unknown>(`/product/query?pid=${encodeURIComponent(pid)}`);
}

export type CjOrderItem = { vid: string; quantity: number; shippingName?: string };

export async function createOrder(payload: {
  orderNumber: string;
  shippingZip: string;
  shippingCountryCode: string;
  shippingProvince: string;
  shippingCity: string;
  shippingAddress: string;
  shippingCustomerName: string;
  shippingPhone: string;
  remark?: string;
  fromCountryCode?: string;
  logisticName?: string;
  products: CjOrderItem[];
}) {
  return cjFetch<{ orderId: string; orderNum: string }>('/shopping/order/createOrder', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function getOrderStatus(orderId: string) {
  return cjFetch<unknown>(`/shopping/order/query?orderId=${encodeURIComponent(orderId)}`);
}
