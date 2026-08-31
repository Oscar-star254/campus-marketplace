// Minimal Daraja (M-Pesa) client: OAuth token fetch + STK Push (Lipa na M-Pesa Online).
// Docs: https://developer.safaricom.co.ke/APIs/MpesaExpressSimulate
//
// Flow used by this app:
//   1. requestStkPush() is called from /api/mpesa/stkpush when a deal needs a
//      commission or deposit payment.
//   2. Safaricom calls back to MPESA_CALLBACK_URL (/api/mpesa/callback) asynchronously —
//      the STK push response here only confirms the *prompt was sent*, not that it succeeded.
//   3. The callback handler is the source of truth for whether payment succeeded.

const BASE_URL =
  process.env.MPESA_ENV === "production"
    ? "https://api.safaricom.co.ke"
    : "https://sandbox.safaricom.co.ke";

async function getAccessToken(): Promise<string> {
  const key = process.env.MPESA_CONSUMER_KEY!;
  const secret = process.env.MPESA_CONSUMER_SECRET!;
  const credentials = Buffer.from(`${key}:${secret}`).toString("base64");

  const res = await fetch(
    `${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`,
    {
      headers: { Authorization: `Basic ${credentials}` },
      // Daraja tokens expire in ~1hr; no need to cache for this scale, refetch each time.
      cache: "no-store",
    }
  );

  if (!res.ok) {
    throw new Error(`Failed to get M-Pesa access token: ${res.status}`);
  }
  const data = await res.json();
  return data.access_token as string;
}

function timestampNow(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    d.getFullYear().toString() +
    pad(d.getMonth() + 1) +
    pad(d.getDate()) +
    pad(d.getHours()) +
    pad(d.getMinutes()) +
    pad(d.getSeconds())
  );
}

export interface StkPushParams {
  phoneNumber: string; // format 2547XXXXXXXX, no leading +
  amount: number;
  accountReference: string; // e.g. deal id — shows on the prompt
  transactionDesc: string; // e.g. "Commission for deal #1234"
}

export interface StkPushResult {
  merchantRequestId: string;
  checkoutRequestId: string;
  responseCode: string;
  responseDescription: string;
}

export async function requestStkPush(
  params: StkPushParams
): Promise<StkPushResult> {
  const shortcode = process.env.MPESA_SHORTCODE!;
  const passkey = process.env.MPESA_PASSKEY!;
  const timestamp = timestampNow();
  const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString(
    "base64"
  );

  const token = await getAccessToken();

  const res = await fetch(`${BASE_URL}/mpesa/stkpush/v1/processrequest`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: Math.round(params.amount), // Daraja expects whole numbers (KES)
      PartyA: params.phoneNumber,
      PartyB: shortcode,
      PhoneNumber: params.phoneNumber,
      CallBackURL: process.env.MPESA_CALLBACK_URL,
      AccountReference: params.accountReference,
      TransactionDesc: params.transactionDesc,
    }),
  });

  const data = await res.json();

  if (!res.ok || data.ResponseCode !== "0") {
    throw new Error(
      `STK push failed: ${data.errorMessage || data.ResponseDescription || res.status}`
    );
  }

  return {
    merchantRequestId: data.MerchantRequestID,
    checkoutRequestId: data.CheckoutRequestID,
    responseCode: data.ResponseCode,
    responseDescription: data.ResponseDescription,
  };
}

// Shape of the callback Safaricom POSTs to MPESA_CALLBACK_URL.
// See app/api/mpesa/callback/route.ts for how this is parsed.
export interface StkCallback {
  Body: {
    stkCallback: {
      MerchantRequestID: string;
      CheckoutRequestID: string;
      ResultCode: number;
      ResultDesc: string;
      CallbackMetadata?: {
        Item: { Name: string; Value: string | number }[];
      };
    };
  };
}
