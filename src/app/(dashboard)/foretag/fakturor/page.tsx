'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatSEK } from '@/lib/utils'
import { TrendingUp, Calendar, Receipt, Briefcase, Info } from 'lucide-react'

const JOB_PRICE = 1490

/** Returns the next quarterly invoice due date: 31/3, 30/6, 30/9, 31/12 */
function getNextInvoiceDate(): Date {
  const now   = new Date()
  const year  = now.getFullYear()
  const month = now.getMonth() + 1 // 1–12
  if (month <= 3)  return new Date(year, 2, 31)  // 31 mars
  if (month <= 6)  return new Date(year, 5, 30)  // 30 juni
  if (month <= 9)  return new Date(year, 8, 30)  // 30 september
  return new Date(year, 11, 31)                  // 31 december
}

type CurrentBilling = {
  total_amount:          number
  favorit_b2c_amount:    number
  intresse_b2c_amount:   number
  generell_b2c_amount:   number
  favorit_b2b_amount:    number
  intresse_b2b_amount:   number
  generell_b2b_amount:   number
}

type HistoryRow = {
  period_label: string
  total_amount: number
  archived_at:  string
}

type UnbilledJob = {
  id:         number
  title:      string
  created_at: string
}

export default function ForetagFakturor() {
  const supabase = createClient()
  const [loading, setLoading]           = useState(true)
  const [current, setCurrent]           = useState<CurrentBilling | null>(null)
  const [unbilledJobs, setUnbilledJobs] = useState<UnbilledJob[]>([])
  const [history, setHistory]           = useState<HistoryRow[]>([])
  const nextInvoice = getNextInvoiceDate()

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return

      const [{ data: billing }, { data: jobs }, { data: hist }] = await Promise.all([
        supabase.rpc('get_my_billing_current').maybeSingle(),
        supabase
          .from('jobs')
          .select('id, title, created_at')
          .eq('company_id', user.id)
          .eq('is_billed', false)
          .order('created_at', { ascending: false }),
        supabase.rpc('get_my_billing_history'),
      ])

      if (billing) setCurrent(billing as CurrentBilling)
      if (jobs)    setUnbilledJobs(jobs as UnbilledJob[])
      if (hist)    setHistory(hist as HistoryRow[])
      setLoading(false)
    })
  }, [])

  const adsTotal    = current ? Number(current.total_amount) : 0
  const jobsTotal   = unbilledJobs.length * JOB_PRICE
  const periodTotal = adsTotal + jobsTotal

  const readBreakdown: [string, number][] = current
    ? [
        ['Favorit B2C',   current.favorit_b2c_amount],
        ['Intresse B2C',  current.intresse_b2c_amount],
        ['Generell B2C',  current.generell_b2c_amount],
        ['Favorit B2B',   current.favorit_b2b_amount],
        ['Intresse B2B',  current.intresse_b2b_amount],
        ['Generell B2B',  current.generell_b2b_amount],
      ].filter(([, v]) => Number(v) > 0) as [string, number][]
    : []

  if (loading) return <div className="py-20 text-center text-gray-400">Laddar...</div>

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mina fakturor</h1>
        <p className="text-sm text-gray-500">Pågående period och fakturahistorik</p>
      </div>

      {/* Info banner */}
      <div className="mb-6 flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-400" />
        <p>
          Fakturor skickas kvartalsvis: <strong>31 mars, 30 juni, 30 september</strong> och <strong>31 december</strong>.
          Alla belopp är exklusive moms.
        </p>
      </div>

      {/* Current period card */}
      <div className="card p-6 mb-6 border-l-4 border-primary-500">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <Calendar className="h-5 w-5 text-primary-500" />
              <h2 className="font-semibold text-gray-900">Nästa faktura</h2>
            </div>
            <p className="text-xs text-gray-400">
              Förfallodatum:{' '}
              {nextInvoice.toLocaleDateString('sv-SE', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-gray-900">{formatSEK(periodTotal)}</p>
            <p className="text-xs text-gray-400 mt-0.5">exkl. moms</p>
          </div>
        </div>

        {/* Line items */}
        {periodTotal === 0 ? (
          <p className="text-sm text-gray-400 text-center py-2 border-t border-gray-100 pt-4">
            Ingen fakturering denna period ännu.
          </p>
        ) : (
          <div className="border-t border-gray-100 pt-4 space-y-2">
            {adsTotal > 0 && (
              <div className="flex justify-between text-sm text-gray-700">
                <span>Reklamläsningar</span>
                <span className="font-medium">{formatSEK(adsTotal)}</span>
              </div>
            )}
            {unbilledJobs.length > 0 && (
              <div>
                <div className="flex justify-between text-sm text-gray-700">
                  <span>💼 Jobbannonser ({unbilledJobs.length} st × {JOB_PRICE.toLocaleString('sv-SE')} kr)</span>
                  <span className="font-medium">{formatSEK(jobsTotal)}</span>
                </div>
                <div className="mt-1.5 space-y-1 pl-4">
                  {unbilledJobs.map(j => (
                    <div key={j.id} className="flex items-center justify-between text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Briefcase className="h-3 w-3" />
                        {j.title}
                        <span className="text-gray-300 ml-1">
                          ({new Date(j.created_at).toLocaleDateString('sv-SE')})
                        </span>
                      </span>
                      <span>{formatSEK(JOB_PRICE)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold text-gray-900 border-t border-gray-200 pt-2 mt-1">
              <span>Totalt denna period</span>
              <span>{formatSEK(periodTotal)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Reklam breakdown card */}
      {readBreakdown.length > 0 && (
        <div className="card p-5 mb-6">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2 text-sm">
            <TrendingUp className="h-4 w-4 text-primary-500" />
            Uppdelning reklamläsningar (pågående period)
          </h3>
          <div className="space-y-1.5">
            {readBreakdown.map(([label, val]) => (
              <div key={label} className="flex justify-between text-sm text-gray-600">
                <span>{label}</span>
                <span className="font-medium">{formatSEK(Number(val))}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invoice history */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <Receipt className="h-5 w-5 text-gray-400" />
          <h2 className="font-semibold text-gray-900">Fakturahistorik</h2>
        </div>

        {history.length === 0 ? (
          <div className="py-10 text-center text-sm text-gray-400">
            Inga tidigare fakturor ännu.
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Period</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Fakturadatum</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Belopp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {history.map((h, i) => (
                <tr key={i} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-medium text-gray-900">{h.period_label}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {new Date(h.archived_at).toLocaleDateString('sv-SE')}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">
                    {formatSEK(Number(h.total_amount))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
