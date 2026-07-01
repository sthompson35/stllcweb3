export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:8000';
export const CORRELATION_HEADER = 'X-Correlation-ID';

export type InvestorSnapshot = {
  market: string;
  median_purchase_price: number;
  median_arv: number;
  renovation_budget: number;
  avg_days_to_exit: number;
  target_margin: number;
  estimated_total_cost: number;
  estimated_profit: number;
  estimated_roi: number;
  decision: string;
};

export type InvestorSnapshotResult = {
  snapshot: InvestorSnapshot | null;
  requestCorrelationId: string;
  responseCorrelationId: string | null;
  status: number | null;
};

function createCorrelationId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `corr-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
}

export async function fetchInvestorSnapshot(correlationId?: string): Promise<InvestorSnapshotResult> {
  const requestCorrelationId = correlationId ?? createCorrelationId();

  try {
    const response = await fetch(`${API_BASE_URL}/api/investor/market-snapshot`, {
      cache: 'no-store',
      headers: {
        [CORRELATION_HEADER]: requestCorrelationId
      }
    });

    const responseCorrelationId = response.headers.get(CORRELATION_HEADER);
    console.info(
      `[API] /api/investor/market-snapshot status=${response.status} requestCorrelationId=${requestCorrelationId} responseCorrelationId=${responseCorrelationId ?? 'missing'}`
    );

    if (!response.ok) {
      return {
        snapshot: null,
        requestCorrelationId,
        responseCorrelationId,
        status: response.status
      };
    }

    return {
      snapshot: (await response.json()) as InvestorSnapshot,
      requestCorrelationId,
      responseCorrelationId,
      status: response.status
    };
  } catch (error) {
    console.error(
      `[API] /api/investor/market-snapshot failed requestCorrelationId=${requestCorrelationId}`,
      error
    );
    return {
      snapshot: null,
      requestCorrelationId,
      responseCorrelationId: null,
      status: null
    };
  }
}
