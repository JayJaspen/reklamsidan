'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Download, Archive, TrendingUp, ChevronDown, ChevronRight, Briefcase } from 'lucide-react'
import { formatSEK } from '@/lib/utils'

const JOB_PRICE = 1490

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

type AdRow = {
  company_id: string
  ad_id: string
  ad_name: string
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

type JobBillingRow = {
  id: number
  title: string
  created_at: string
  company_id: string
  companies: { public_name: string }[] | null
}

export default function AdminFakturering() {
  const supabase = createClient()
  const [data, setData]               = useState<BillingRow[]>([])
  const [adData, setAdData]           = useState<AdRow[]>([])
  const [jobBilling, setJobBilling]   = useState<JobBillingRow[]>([])
  const [loading, setLoading]         = useState(true)
  const [showArchiveModal, setShowArchiveModal]     = useState(false)
  const [archiveLabel, setArchiveLabel]             = useState('')
  const [expandedCompanies, setExpandedCompanies]   = useState<Set<string>>(new Set())

  useEffect(() => {
    Promise.all([
      supabase.from('billing_summary').select('*').gt('total_amount', 0).order('total_amount', { ascending: false }),
      supabase.rpc('get_billing_by_ad'),
      supabase
        .from('jobs')
        .select('id, title, created_at, company_id, companies(public_name)')
        .eq('is_billed', false)
        .order('created_at', { ascending: false }),
    ]).then(([{ data: summary }, { data: ads }, { data: jobs }]) => {
      if (summary) setData(summary as BillingRow[])
      if (ads)     setAdData(ads as AdRow[])
      if (jobs)    setJobBilling(jobs as JobBillingRow[])
      setLoading(false)
    })
  }, [])

  const adsTotal  = data.reduce((acc, r) => acc + Number(r.total_amount), 0)
  const jobsTotal = jobBilling.length * JOB_PRICE
  const grandTotal = adsTotal + jobsTotal

  // Group job listings by company for the expanded view
  const jobsByCompany = jobBilling.reduce<Record<string, JobBillingRow[]>>((acc, j) => {
    if (!acc[j.company_id]) acc[j.company_id] = []
    acc[j.company_id].push(j)
    return acc
  }, {})

  function toggleExpand(companyId: string) {
    setExpandedCompanies(prev => {
      const next = new Set(prev)
      next.has(companyId) ? next.delete(companyId) : next.add(companyId)
      return next
    })
  }

  function adsForCompany(companyId: string) {
    return adData.filter(a => a.company_id === companyId)
  }

  function handleExportExcel() {
    const headers = [
      'Typ', 'Företag', 'Reklamblad / Jobbannons',
      'Favorit B2C (st)', 'Favorit B2C (kr)',
      'Intresse B2C (st)', 'Intresse B2C (kr)',
      'Generell B2C (st)', 'Generell B2C (kr)',
      'Favorit B2B (st)', 'Favorit B2B (kr)',
      'Intresse B2B (st)', 'Intresse B2B (kr)',
      'Generell B2B (st)', 'Generell B2B (kr)',
      'TOTALT (kr exkl. moms)',
    ]

    const rows: (string | number)[][] = []

    // Ad billing rows (existing)
    data.forEach(r => {
      rows.push([
        'Företag', r.public_name, '',
        r.favorit_b2c_reads,  r.favorit_b2c_amount,
        r.intresse_b2c_reads, r.intresse_b2c_amount,
        r.generell_b2c_reads, r.generell_b2c_amount,
        r.favorit_b2b_reads,  r.favorit_b2b_amount,
        r.intresse_b2b_reads, r.intresse_b2b_amount,
        r.generell_b2b_reads, r.generell_b2b_amount,
        r.total_amount,
      ])
      adsForCompany(r.company_id).forEach(a => {
        rows.push([
          'Reklamblad', r.public_name, a.ad_name,
          a.favorit_b2c_reads,  a.favorit_b2c_amount,
          a.intresse_b2c_reads, a.intresse_b2c_amount,
          a.generell_b2c_reads, a.generell_b2c_amount,
          a.favorit_b2b_reads,  a.favorit_b2b_amount,
          a.intresse_b2b_reads, a.intresse_b2b_amount,
          a.generell_b2b_reads, a.generell_b2b_amount,
          a.total_amount,
        ])
      })
    })

    // Job billing rows — one row per job listing
    if (jobBilling.length > 0) {
      rows.push(['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']) // spacer
      rows.push(['--- JOBBANNONSER ---', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''])
      jobBilling.forEach(j => {
        const companyName = j.companies?.[0]?.public_name ?? ''
        rows.push([
          'Jobbannons', companyName, j.title,
          '', '', '', '', '', '', '', '', '', '', '', '',
          JOB_PRICE,
        ])
      })
      rows.push(['Summa jobbannonser', '', '', '', '', '', '', '', '', '', '', '', '', '', '', jobsTotal])
    }

    const csv = [headers, ...rows]
      .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';'))
      .join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url
    a.download = `reklamsidan-fakturering-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    setShowArchiveModal(true)
  }

  async function handleArchive() {
    if (!archiveLabel) return

    // Archive ad billing
    await supabase.from('billing_archive').insert({ period_label: archiveLabel, data })
    const companyIds = data.map(r => r.company_id)
    if (companyIds.length > 0) {
      const { data: adRows } = await supabase.from('ads').select('id').in('company_id', companyIds)
      const adIds = (adRows ?? []).map(r => r.id)
      if (adIds.length > 0) {
        await supabase.from('ad_reads').update({ is_billed: true }).in('ad_id', adIds)
      }
    }

    // Mark job listings as billed
    const jobIds = jobBilling.map(j => j.id)
    if (jobIds.length > 0) {
      await supabase.from('jobs').update({ is_billed: true }).in('id', jobIds)
    }

    setShowArchiveModal(false)
    setData([])
    setAdData([])
    setJobBilling([])
    alert('Faktureringsunderlaget har arkiverats.')
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fakturering</h1>
          <p className="text-sm text-gray-500">Klicka på ett företag för att se uppdelning per reklamblad</p>
        </div>
        <button
          onClick={handleExportExcel}
          disabled={data.length === 0 && jobBilling.length === 0}
          className="btn-primary gap-2"
        >
          <Download className="h-4 w-4" /> Exportera Excel
        </button>
      </div>

      {/* Stat cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-5 w-5 text-primary-600" />
            <div>
              <p className="text-xs text-gray-500">Totalt att fakturera</p>
              <p className="text-xl font-bold text-gray-900">{formatSEK(grandTotal)}</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <p className="text-xs text-gray-500">Antal företag</p>
          <p className="text-xl font-bold text-gray-900">{data.length}</p>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <Briefcase className="h-5 w-5 text-primary-400" />
            <div>
              <p className="text-xs text-gray-500">Jobbannonser</p>
              <p className="text-xl font-bold text-gray-900">{jobBilling.length} st</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <p className="text-xs text-gray-500">Jobbannonser totalt</p>
          <p className="text-xl font-bold text-gray-900">{formatSEK(jobsTotal)}</p>
        </div>
      </div>

      {loading ? (
        <p className="text-center text-gray-400 py-12">Laddar...</p>
      ) : (
        <>
          {/* ── Reklamblad-fakturering ── */}
          {data.length > 0 && (
            <div className="card overflow-hidden mb-8">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="w-8 px-2 py-3" />
                      <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase text-xs">Företag / Reklamblad</th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-500 uppercase text-xs" colSpan={2}>Favorit B2C</th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-500 uppercase text-xs" colSpan={2}>Intresse B2C</th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-500 uppercase text-xs" colSpan={2}>Generell B2C</th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-500 uppercase text-xs" colSpan={2}>Favorit B2B</th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-500 uppercase text-xs" colSpan={2}>Intresse B2B</th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-500 uppercase text-xs" colSpan={2}>Generell B2B</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-700 uppercase text-xs">Totalt</th>
                    </tr>
                    <tr className="bg-gray-50 text-xs text-gray-400">
                      <th className="px-2 pb-2" /><th className="px-4 pb-2" />
                      {['st','kr','st','kr','st','kr','st','kr','st','kr','st','kr'].map((h, i) => (
                        <th key={i} className="px-2 pb-2 text-center">{h}</th>
                      ))}
                      <th className="px-4 pb-2" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.map(r => {
                      const ads        = adsForCompany(r.company_id)
                      const compJobs   = jobsByCompany[r.company_id] ?? []
                      const isExpanded = expandedCompanies.has(r.company_id)
                      const companyJobsAmount = compJobs.length * JOB_PRICE
                      return (
                        <>
                          {/* Företagsrad */}
                          <tr
                            key={r.company_id}
                            className="cursor-pointer hover:bg-primary-50/40 transition"
                            onClick={() => toggleExpand(r.company_id)}
                          >
                            <td className="px-2 py-3 text-gray-400">
                              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </td>
                            <td className="px-4 py-3 font-semibold text-gray-900">
                              {r.public_name}
                              <span className="ml-2 text-xs font-normal text-gray-400">{ads.length} reklamblad</span>
                              {compJobs.length > 0 && (
                                <span className="ml-1 text-xs font-normal text-primary-500">· {compJobs.length} jobb</span>
                              )}
                            </td>
                            {[r.favorit_b2c_reads, r.favorit_b2c_amount, r.intresse_b2c_reads, r.intresse_b2c_amount, r.generell_b2c_reads, r.generell_b2c_amount, r.favorit_b2b_reads, r.favorit_b2b_amount, r.intresse_b2b_reads, r.intresse_b2b_amount, r.generell_b2b_reads, r.generell_b2b_amount].map((v, i) => (
                              <td key={i} className="px-2 py-3 text-center text-gray-600">{v}</td>
                            ))}
                            <td className="px-4 py-3 text-right font-bold text-gray-900">
                              {formatSEK(Number(r.total_amount) + companyJobsAmount)}
                            </td>
                          </tr>

                          {/* Per-annons-rader */}
                          {isExpanded && ads.map(a => (
                            <tr key={a.ad_id} className="bg-blue-50/30">
                              <td className="px-2 py-2" />
                              <td className="px-4 py-2 text-xs text-gray-500 pl-8">
                                <span className="text-gray-300 mr-1">↳</span>{a.ad_name}
                              </td>
                              {[a.favorit_b2c_reads, a.favorit_b2c_amount, a.intresse_b2c_reads, a.intresse_b2c_amount, a.generell_b2c_reads, a.generell_b2c_amount, a.favorit_b2b_reads, a.favorit_b2b_amount, a.intresse_b2b_reads, a.intresse_b2b_amount, a.generell_b2b_reads, a.generell_b2b_amount].map((v, i) => (
                                <td key={i} className="px-2 py-2 text-center text-xs text-gray-500">{v}</td>
                              ))}
                              <td className="px-4 py-2 text-right text-xs font-medium text-gray-700">{formatSEK(Number(a.total_amount))}</td>
                            </tr>
                          ))}

                          {/* Per-jobb-rader */}
                          {isExpanded && compJobs.map(j => (
                            <tr key={`job-${j.id}`} className="bg-primary-50/30">
                              <td className="px-2 py-2" />
                              <td className="px-4 py-2 text-xs text-primary-700 pl-8 flex items-center gap-1">
                                <span className="text-gray-300 mr-1">↳</span>
                                <Briefcase className="h-3 w-3 shrink-0" />
                                {j.title}
                                <span className="text-gray-400 ml-1">({new Date(j.created_at).toLocaleDateString('sv-SE')})</span>
                              </td>
                              {Array(12).fill('').map((_, i) => (
                                <td key={i} className="px-2 py-2 text-center text-xs text-gray-300">–</td>
                              ))}
                              <td className="px-4 py-2 text-right text-xs font-medium text-primary-700">{formatSEK(JOB_PRICE)}</td>
                            </tr>
                          ))}
                        </>
                      )
                    })}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan={14} className="px-4 py-3 text-right font-bold text-gray-700">Summa reklamblad:</td>
                      <td className="px-4 py-3 text-right font-bold text-primary-700">{formatSEK(adsTotal)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* ── Jobbannonser-fakturering ── */}
          {jobBilling.length > 0 && (
            <div className="card overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary-500" />
                <h2 className="font-semibold text-gray-900">Jobbannonser</h2>
                <span className="ml-auto text-xs text-gray-400">{JOB_PRICE.toLocaleString('sv-SE')} kr/st</span>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase text-xs">Företag</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase text-xs">Jobbannons (rubrik)</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase text-xs">Publicerad</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-700 uppercase text-xs">Kostnad</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {jobBilling.map(j => (
                      <tr key={j.id} className="hover:bg-gray-50/60">
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {j.companies?.[0]?.public_name ?? '—'}
                        </td>
                        <td className="px-4 py-3 text-gray-700">{j.title}</td>
                        <td className="px-4 py-3 text-gray-400 text-xs">
                          {new Date(j.created_at).toLocaleDateString('sv-SE')}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-gray-900">
                          {formatSEK(JOB_PRICE)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan={3} className="px-4 py-3 text-right font-bold text-gray-700">Summa jobbannonser:</td>
                      <td className="px-4 py-3 text-right font-bold text-primary-700">{formatSEK(jobsTotal)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {data.length === 0 && jobBilling.length === 0 && (
            <div className="card py-16 text-center text-gray-400">
              Inget att fakturera just nu.
            </div>
          )}
        </>
      )}

      {/* Archive modal */}
      {showArchiveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
            <Archive className="mb-4 h-10 w-10 text-primary-600" />
            <h2 className="mb-2 text-xl font-bold">Arkivera faktureringsunderlag?</h2>
            <p className="mb-4 text-sm text-gray-500">
              Vill du arkivera den exporterade listan? Datan sparas med datum och de markerade
              läsningarna registreras som fakturerade. Jobbannonser ({jobBilling.length} st) markeras också som fakturerade.
            </p>
            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Periodnamn</label>
              <input type="text" className="input-field" value={archiveLabel}
                onChange={e => setArchiveLabel(e.target.value)}
                placeholder="t.ex. Mars 2026" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowArchiveModal(false)} className="btn-secondary flex-1">Nej, stäng</button>
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
