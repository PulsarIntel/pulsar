import { API_BASE } from "@/lib/constants"
import { getAuthHeaders } from "@/lib/auth"
import type { Position, Transaction } from "@/lib/types"

function headers() {
  return {
    "Content-Type": "application/json",
    ...getAuthHeaders(),
  }
}

export async function fetchPositions(): Promise<Position[]> {
  const res = await fetch(`${API_BASE}/portfolio/positions`, {
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error("Failed to fetch positions")
  return res.json()
}

export async function fetchTransactions(ticker: string): Promise<Transaction[]> {
  const encoded = encodeURIComponent(ticker)
  const res = await fetch(
    `${API_BASE}/portfolio/positions/${encoded}/transactions`,
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
