import os
import logging
from time import perf_counter
from uuid import uuid4

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO").upper())
logger = logging.getLogger("dynasty_property_os.api")

CORRELATION_HEADER = "X-Correlation-ID"

app = FastAPI(title="Dynasty PropertyOS API", version="0.1.0")


def _parse_origins(value: str | None) -> list[str]:
    if not value:
        return [
            "http://127.0.0.1:3000",
            "http://localhost:3000",
        ]
    return [origin.strip() for origin in value.split(",") if origin.strip()]


app.add_middleware(
    CORSMiddleware,
    allow_origins=_parse_origins(os.getenv("CORS_ALLOW_ORIGINS")),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=[CORRELATION_HEADER],
)


@app.middleware("http")
async def request_trace_middleware(request: Request, call_next):
    correlation_id = request.headers.get(CORRELATION_HEADER) or str(uuid4())
    request.state.correlation_id = correlation_id
    start = perf_counter()

    logger.info(
        "request_started correlation_id=%s method=%s path=%s query=%s",
        correlation_id,
        request.method,
        request.url.path,
        request.url.query,
    )

    try:
        response = await call_next(request)
    except Exception:
        duration_ms = (perf_counter() - start) * 1000
        logger.exception(
            "request_failed correlation_id=%s method=%s path=%s duration_ms=%.2f",
            correlation_id,
            request.method,
            request.url.path,
            duration_ms,
        )
        raise

    duration_ms = (perf_counter() - start) * 1000
    response.headers[CORRELATION_HEADER] = correlation_id
    logger.info(
        "request_completed correlation_id=%s method=%s path=%s status=%s duration_ms=%.2f",
        correlation_id,
        request.method,
        request.url.path,
        response.status_code,
        duration_ms,
    )
    return response

class DealInput(BaseModel):
    purchase_price: float
    repair_budget: float
    arv: float
    closing_costs: float = 0
    holding_costs: float = 0
    selling_costs: float = 0
    target_profit_margin: float = 0.30


class InvestorSnapshot(BaseModel):
    market: str
    median_purchase_price: float
    median_arv: float
    renovation_budget: float
    avg_days_to_exit: int
    target_margin: float
    estimated_total_cost: float
    estimated_profit: float
    estimated_roi: float
    decision: str

@app.get("/")
def root():
    return {"status": "online", "system": "Dynasty PropertyOS"}

@app.get("/health")
def health():
    return {"ok": True}

@app.post("/api/investor/flip-analysis")
def flip_analysis(payload: DealInput):
    total_cost = payload.purchase_price + payload.repair_budget + payload.closing_costs + payload.holding_costs + payload.selling_costs
    profit = payload.arv - total_cost
    roi = profit / total_cost if total_cost else 0
    decision = "GO" if roi >= payload.target_profit_margin else "NO-GO"
    return {
        "total_cost": round(total_cost, 2),
        "profit": round(profit, 2),
        "roi": round(roi, 4),
        "decision": decision
    }


@app.get("/api/investor/market-snapshot", response_model=InvestorSnapshot)
def market_snapshot(market: str = "Atlanta, GA"):
    median_purchase_price = 210000.0
    median_arv = 305000.0
    renovation_budget = 50000.0
    closing_holding_selling = 24000.0
    avg_days_to_exit = 122
    target_margin = 0.30

    estimated_total_cost = median_purchase_price + renovation_budget + closing_holding_selling
    estimated_profit = median_arv - estimated_total_cost
    estimated_roi = estimated_profit / estimated_total_cost if estimated_total_cost else 0
    decision = "GO" if estimated_roi >= target_margin else "NO-GO"

    return InvestorSnapshot(
        market=market,
        median_purchase_price=round(median_purchase_price, 2),
        median_arv=round(median_arv, 2),
        renovation_budget=round(renovation_budget, 2),
        avg_days_to_exit=avg_days_to_exit,
        target_margin=round(target_margin, 2),
        estimated_total_cost=round(estimated_total_cost, 2),
        estimated_profit=round(estimated_profit, 2),
        estimated_roi=round(estimated_roi, 4),
        decision=decision,
    )
