'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Download, Archive, TrendingUp } from 'lucide-react'
import { formatSEK } from '@/lib/utils'

type BillingRow = {
  company_id: string
  public_name: string
  billing_method: string | null
  billing_email: string | null
  billing_address: string | null
  favorit_b2c_reads: number
  intresse_b2c_reads: number
  generell_b2c_reads: number
  favorit_b2b_reads: number
  intresse_b2b_reads: number
  generell_b2b_reads: number
  favorit_b2c_amount: number
  intresse_b2c_amount: number
  generell_b2c_amount: number
  favorit_b2b_amount: number
  intresse_b2b_amount: number
  generell_b2b_amount: number
  total_amount: number
}

export default function AdminFakturering() {
  const supabase = createClient()
  const [data, setData]       = useState<BillingRow[]>([])
  const [loading, setLoading] = useState(true)
  const [showArchiveModal, setShowArchiveModal] = useState(false)
  const [archiveLabel, setArchiveLabel] = useState('')

  useEffect(() => {
    supabase
      .from('billing_summary')
      .select('*')
      .gt('total_amount', 0)
      .order('total_amount', { ascending: false })
      .then(({ data }) => {
        if (data) setData(data as BillingRow[])
        setLoading(false)
      })
  }, [])

  const totalSum = data.reduce((acc, r) => acc + Number(r.total_amount), 0)

  function handleExportExcel() {
    // Exportera CSV som kan öppnas i Excel
    const headers = [
      'Företag','Faktureringsmetod',
      'Favorit B2C (antal)','Favorit B2C (kr)',
      'Intresse B2C (antal)','Intresse B2C (kr)',
      'Generell B2C (antal)','Generell B2C (kr)',
      'Favorit B2B (antal)','Favorit B2B (kr)',
      'Intresse B2B (antal)','Intresse B2B (kr)',
      'Generell B2B (antal)','Generell B2B (kr)',
      'TOTALT (kr exkl. moms)',
    ]
    const rows = data.map(r => [
      r.public_name,
      r.billing_method === 'email' ? r.billing_email : r.billing_address,
      r.favorit_b2c_reads,   r.favorit_b2c_amount,
      r.intresse_b2c_reads,  r.intresse_b2c_amount,
      r.generell_b2c_reads,  r.generell_b2c_amount,
      r.favorit_b2b_reads,   r.favorit_b2b_amount,
      r.intresse_b2b_reads,  r.intresse_b2b_amount,
      r.generell_b2b_reads,  r.generell_b2b_amount,
      r.total_amount,
    ])

    const csv = [headers, ...rows].map(r => r.join(';')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url
    a.download = `reklamsidan-fakturering-${new Date().toISOString().slice(0,10)}.csv`
    a.click()
    URL.revokeObjectURL(url)

    setShowArchiveModal(true)
  }

  async function handleArchive() {
    if (!archiveLabel) return
    await supabase.from('billing_archive').insert({
      period_label: archiveLabel,
      data: data,
    })
    // Markera läsningarna som fakturerade
    const adIds = data.map(r => r.company_id)
    if (adIds.length > 0) {
      await supabase.from('ad_reads').update({ is_billed: true })
        .in('ad_id',
          supabase.from('ads').select('id').in('company_id', adIds) as unknown as string[]
        )
    }
    setShowArchiveModal(false)
    setData([])
    alert('Faktureringsunderlaget har arkiverats.')
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fakturering</h1>
          <p className="text-sm text-gray-500">Alla företag med obetalda läsningar</p>
        </div>
        <button onClick={handleExportExcel} disabled={data.length === 0}
          className="btn-primary gap-2">
          <Download className="h-4 w-4" /> Exportera Excel
        </button>
      </div>

      {/* Summary */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-5 w-5 text-primary-600" />
            <div>
              <p className="text-xs text-gray-500">Totalt att fakturera</p>
              <p className="text-xl font-bold text-gray-900">{formatSEK(totalSum)}</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <p className="text-xs text-gray-500">Antal företag</p>
          <p className="text-xl font-bold text-gray-900">{data.length}</p>
        </div>
      </div>

      {loading ? (
        <p className="text-center text-gray-400 py-12">Laddar...</p>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase text-xs">Företag</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-500 uppercase text-xs" colSpan={2}>Favorit B2C</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-500 uppercase text-xs" colSpan={2}>Intresse B2C</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-500 uppercase text-xs" colSpan={2}>Generell B2C</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-500 uppercase text-xs" colSpan={2}>Favorit B2B</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-500 uppercase text-xs" colSpan={2}>Intresse B2B</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-500 uppercase text-xs" colSpan={2}>Generell B2B</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700 uppercase text-xs">Totalt</th>
                </tr>
                <tr className="bg-gray-50 text-xs text-gray-400">
                  <th className="px-4 pb-2" />
                  <th className="px-2 pb-2 text-center">st</th><th className="px-2 pb-2 text-center">kr</th>
                  <th className="px-2 pb-2 text-center">st</th><th className="px-2 pb-2 text-center">kr</th>
                  <th className="px-2 pb-2 text-center">st</th><th className="px-2 pb-2 text-center">kr</th>
                  <th className="px-2 pb-2 text-center">st</th><th className="px-2 pb-2 text-center">kr</th>
                  <th className="px-2 pb-2 text-center">st</th><th className="px-2 pb-2 text-center">kr</th>
                  <th className="px-2 pb-2 text-center">st</th><th className="px-2 pb-2 text-center">kr</th>
                  <th className="px-4 pb-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.map(r => (
                  <tr key={r.company_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{r.public_name}</td>
                    <td className="px-2 py-3 text-center text-gray-600">{r.favorit_b2c_reads}</td>
                    <td className="px-2 py-3 text-center text-gray-600">{r.favorit_b2c_amount}</td>
                    <td className="px-2 py-3 text-center text-gray-600">{r.intresse_b2c_reads}</td>
                    <td className="px-2 py-3 text-center text-gray-600">{r.intresse_b2c_amount}</td>
                    <td className="px-2 py-3 text-center text-gray-600">{r.generell_b2c_reads}</td>
                    <td className="px-2 py-3 text-center text-gray-600">{r.generell_b2c_amount}</td>
                    <td className="px-2 py-3 text-center text-gray-600">{r.favorit_b2b_reads}</td>
                    <td className="px-2 py-3 text-center text-gray-600">{r.favorit_b2b_amount}</td>
                    <td className="px-2 py-3 text-center text-gray-600">{r.intresse_b2b_reads}</td>
                    <td className="px-2 py-3 text-center text-gray-600">{r.intresse_b2b_amount}</td>
                    <td className="px-2 py-3 text-center text-gray-600">{r.generell_b2b_reads}</td>
                    <td className="px-2 py-3 text-center text-gray-600">{r.generell_b2b_amount}</td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">
                      {formatSEK(Number(r.total_amount))}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan={13} className="px-4 py-3 text-right font-bold text-gray-700">Summa:</td>
                  <td className="px-4 py-3 text-right font-bold text-primary-700">{formatSEK(totalSum)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Archive Modal */}
      {showArchiveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
            <Archive className="mb-4 h-10 w-10 text-primary-600" />
            <h2 className="mb-2 text-xl font-bold">Arkivera faktureringsunderlag?</h2>
            <p className="mb-4 text-sm text-gray-500">
              Vill du arkivera den exporterade listan? Datan sparas med datum och de markerade
              läsningarna registreras som fakturerade.
            </p>
            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Periodnamn</label>
              <input type="text" className="input-field" value={archiveLabel}
                onChange={e => setArchiveLabel(e.target.value)}
                placeholder="t.ex. Mars 2026" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowArchiveModal(false)} className="btn-secondary flex-1">
                Nej, stäng
              </button>
              <button onClick={handleArchive} disabled={!archiveLabel} className="btn-primary flex-1">
                <Archive className="h-4 w-4" /> Arkivera
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
