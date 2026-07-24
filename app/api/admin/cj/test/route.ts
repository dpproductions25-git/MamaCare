import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/cj/test
 * Diagnoses CJ API connectivity. Shows exactly where auth fails.
 */
export async function GET() {
  const email = process.env.CJ_API_EMAIL || '';
  const apiKey = process.env.CJ_API_KEY || '';

  const result: Record<string, any> = {
    env_vars_set: { email: !!email, apiKey: !!apiKey },
    email_value: email ? `${email.slice(0, 4)}***` : '(not set)',
    apiKey_value: apiKey ? `${apiKey.slice(0, 6)}***` : '(not set)',
  };

  if (!email || !apiKey) {
    return NextResponse.json({ ...result, status: 'MISSING_ENV_VARS' });
  }

  // Try auth
  try {
    const res = await fetch(
      'https://developers.cjdropshipping.com/api2.0/v1/authentication/getAccessToken',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, apiKey }),
        signal: AbortSignal.timeout(10_000),
      }
    );
    const text = await res.text();
    result.auth_http_status = res.status;

    if (!res.ok) {
      result.status = 'AUTH_HTTP_ERROR';
      result.auth_response = text.slice(0, 300);
      return NextResponse.json(result);
    }

    let json: any;
    try { json = JSON.parse(text); } catch {
      result.status = 'AUTH_INVALID_JSON';
      result.auth_response = text.slice(0, 300);
      return NextResponse.json(result);
    }

    result.auth_result = json.result;
    result.auth_message = json.message;

    if (!json.result) {
      result.status = 'AUTH_REJECTED';
      return NextResponse.json(result);
    }

    result.status = 'AUTH_OK';
    result.token_prefix = json.data?.accessToken?.slice(0, 8) + '***';

    // Now test a product query with the test PID
    const token = json.data.accessToken;
    const pid = '2503121732161610000';
    const pRes = await fetch(
      `https://developers.cjdropshipping.com/api2.0/v1/product/query?pid=${pid}`,
      {
        headers: { 'Content-Type': 'application/json', 'CJ-Access-Token': token },
        signal: AbortSignal.timeout(10_000),
      }
    );
    const pText = await pRes.text();
    result.product_query_status = pRes.status;

    if (!pRes.ok) {
      result.status = 'PRODUCT_QUERY_HTTP_ERROR';
      result.product_response = pText.slice(0, 300);
      return NextResponse.json(result);
    }

    let pJson: any;
    try { pJson = JSON.parse(pText); } catch {
      result.status = 'PRODUCT_INVALID_JSON';
      return NextResponse.json(result);
    }

    result.product_result = pJson.result;
    result.product_message = pJson.message;
    result.product_data_keys = pJson.data ? Object.keys(pJson.data) : null;
    result.product_image = pJson.data?.productImage?.slice(0, 60);
    result.status = pJson.result ? 'FULL_SUCCESS' : 'PRODUCT_QUERY_FAILED';

    return NextResponse.json(result);
  } catch (e: any) {
    result.status = 'EXCEPTION';
    result.error = e.message;
    return NextResponse.json(result);
  }
}
