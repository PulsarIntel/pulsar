import { API_BASE } from "@/lib/constants"
import { getAuthHeaders } from "@/lib/auth"
import type { Position, Transaction, PortfolioMeta } from "@/lib/types"

function headers() {
  return {
    "Content-Type": "application/json",
    ...getAuthHeaders(),
  }
}

// ---------------------------------------------------------------------------
// Portfolio CRUD
// ---------------------------------------------------------------------------

export async function fetchPortfolios(): Promise<PortfolioMeta[]> {
  const res = await fetch(`${API_BASE}/portfolio/portfolios`, {
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error("Failed to fetch portfolios")
  return res.json()
}

export async function createPortfolio(name: string): Promise<PortfolioMeta> {
  const res = await fetch(`${API_BASE}/portfolio/portfolios`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ name }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.detail || "Failed to create portfolio")
  }
  return res.json()
}

export async function renamePortfolio(id: string, name: string): Promise<PortfolioMeta> {
  const res = await fetch(`${API_BASE}/portfolio/portfolios/${id}`, {
    method: "PUT",
    headers: headers(),
    body: JSON.stringify({ name }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.detail || "Failed to rename portfolio")
  }
  return res.json()
}

export async function deletePortfolio(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/portfolio/portfolios/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.detail || "Failed to delete portfolio")
  }
}

// ---------------------------------------------------------------------------
// Positions & Transactions
// ---------------------------------------------------------------------------

export async function fetchPositions(portfolioId?: string): Promise<Position[]> {
  const params = portfolioId ? `?portfolio_id=${portfolioId}` : ""
  const res = await fetch(`${API_BASE}/portfolio/positions${params}`, {
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error("Failed to fetch positions")
  return res.json()
}

export async function fetchTransactions(ticker: string, portfolioId?: string): Promise<Transaction[]> {
  const encoded = encodeURIComponent(ticker)
  const params = portfolioId ? `?portfolio_id=${portfolioId}` : ""
  const res = await fetch(
    `${API_BASE}/portfolio/positions/${encoded}/transactions${params}`,
    { headers: getAuthHeaders() },
  )
  if (!res.ok) throw new Error("Failed to fetch transactions")
  return res.json()
}

export interface TransactionInput {
  ticker: string
  type: "buy" | "sell"
  shares: number
  price_per_share: number
  date: string
  currency?: string
  fee?: number
  notes?: string
  portfolio_id?: string
}

export async function addTransaction(body: TransactionInput): Promise<Transaction> {
  const res = await fetch(`${API_BASE}/portfolio/transactions`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || data.detail || "Failed to add transaction")
  }
  return res.json()
}

export interface TransactionUpdateInput {
  type?: "buy" | "sell"
  shares?: number
  price_per_share?: number
  date?: string
  fee?: number
  notes?: string
}

export async function updateTransaction(
  id: string,
  body: TransactionUpdateInput,
): Promise<Transaction> {
  const res = await fetch(`${API_BASE}/portfolio/transactions/${id}`, {
    method: "PUT",
    headers: headers(),
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || data.detail || "Failed to update transaction")
  }
  return res.json()
}

export async function deleteTransaction(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/portfolio/transactions/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error("Failed to delete transaction")
}

export async function migrateHoldings(): Promise<{ migrated: number }> {
  const res = await fetch(`${API_BASE}/portfolio/migrate`, {
    method: "POST",
    headers: headers(),
  })
  if (!res.ok) throw new Error("Failed to migrate")
  return res.json()
}
