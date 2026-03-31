"use client"

import { useState, useEffect, useCallback } from "react"
import { IconLoader2 } from "@tabler/icons-react"

import { TransactionRow } from "@/components/portfolio/transaction-row"
import { EditTransactionDialog } from "@/components/portfolio/edit-transaction-dialog"
import { fetchTransactions, deleteTransaction } from "@/lib/api/portfolio"
import type { Transaction } from "@/lib/types"

interface TransactionListProps {
  ticker: string
  onChanged: () => void
}

function TransactionList({ ticker, onChanged }: TransactionListProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [editing, setEditing] = useState<Transaction | null>(null)

  const load = useCallback(async () => {
    try {
      const data = await fetchTransactions(ticker)
      setTransactions(data)
    } catch {
    } finally {
      setLoading(false)
    }
  }, [ticker])

  useEffect(() => { load() }, [load])

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      await deleteTransaction(id)
      setTransactions((t) => t.filter((x) => x.id !== id))
      onChanged()
    } catch {
    } finally {
      setDeletingId(null)
    }
  }

  function handleUpdated() {
    load()
    onChanged()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <IconLoader2 className="size-4 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (transactions.length === 0) {
    return (
      <div className="py-3 text-center text-xs text-muted-foreground">
        No transactions recorded
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col gap-1.5">
        {transactions.map((txn) => (
          <TransactionRow
            key={txn.id}
            transaction={txn}
            onEdit={setEditing}
            onDelete={handleDelete}
            deleting={deletingId === txn.id}
          />
        ))}
      </div>
      {editing && (
        <EditTransactionDialog
          transaction={editing}
          onClose={() => setEditing(null)}
          onUpdated={handleUpdated}
        />
      )}
    </>
  )
}

export { TransactionList }
