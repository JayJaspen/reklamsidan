'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Download, Archive, TrendingUp, ChevronDown, ChevronRight, Briefcase, History, ChevronUp, Home, Users } from 'lucide-react'
import { formatSEK } from '@/lib/utils'

const JOB_PRICE    = 1490
const SEEKER_PRICE = 99

const PROP_B2C_FORSALJNING = 1990
const PROP_B2C_UTHYRNING   =  399
const PROP_B2B_FORSALJNING = 2990
const PROP_B2B_UTHYRNING   = 2490
const B2B_PROPERTY_TYPES   = ['Lagerlokal', 'Butikslokal']

function propPrice(propertyType: string, listingType: string): number {
  const isB2B = B2B_PROPERTY_TYPES.includes(propertyType)
  if (listingType === 'uthyrning') return isB2B ? PROP_B2B_UTHYRNING : PROP_B2C_UTHYRNING
  return isB2B ? PROP_B2B_FORSALJNING : PROP_B2C_FORSALJNING
}

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

type PropertyBillingRow = {
  id: number
  title: string
  property_type: string
  listing_type: string
  created_at: string
  company_id: string
  companies: { public_name: string }[] | null
}

type SeekerPurchaseBillingRow = {
  id: number
  seeker_id: number
  created_at: string
  company_id: string
  property_seekers: { property_type: string; listing_type: string; county: string } | null
}

type ArchiveEntry = {
  id: number
  period_label: string
  created_at: string
  data: BillingRow[]
  jobs_data?: JobBillingRow[] | null
}

export default function AdminFakturering() {
  const supabase = createClient()
  const [data, setData]                         = useState<BillingRow[]>([])
  const [adData, setAdData]                     = useState<AdRow[]>([])
  const [jobBilling, setJobBilling]             = useState<JobBillingRow[]>([])
  const [propertyBilling, setPropertyBilling]   = useState<PropertyBillingRow[]>([])
  const [seekerBilling, setSeekerBilling]       = useState<SeekerPurchaseBillingRow[]>([])
  const [archiveData, setArchiveData]           = useState<ArchiveEntry[]>([])
  const [loading, setLoading]                   = useState(true)
  const [showArchiveModal, setShowArchiveModal]     = useState(false)
  const [archiveLabel, setArchiveLabel]             = useState('')
  const [expandedCompanies, setExpandedCompanies]   = useState<Set<string>>(new Set())
  const [showArchive, setShowArchive]               = useState(false)
  const [expandedArchive, setExpandedArchive]       = useState<Set<number>>(new Set())

  useEffect(() => {
    Promise.all([
      supabase.from('billing_summary').select('*').gt('total_amount', 0).order('total_amount', { ascending: false }),
      supabase.rpc('get_billing_by_ad'),
      supabase
        .from('jobs')
        .select('id, title, created_at, company_id, companies(public_name)')
        .eq('is_billed', false)
        .order('created_at', { ascending: false }),
      supabase
        .from('properties')
        .select('id, title, property_type, listing_type, created_at, company_id, companies(public_name)')
        .eq('is_billed', false)
        .order('created_at', { ascending: false }),
      supabase
        .from('property_seeker_purchases')
        .select('id, seeker_id, created_at, company_id, property_seekers(property_type, listing_type, county)')
        .eq('is_billed', false)
        .order('created_at', { ascending: false }),
      supabase
        .from('billing_archive')
        .select('*')
        .order('created_at', { ascending: false }),
    ]).then(([{ data: summary }, { data: ads }, { data: jobs }, { data: props }, { data: seekers }, { data: archive }]) => {
      if (summary) setData(summary as BillingRow[])
      if (ads)     setAdData(ads as AdRow[])
      if (jobs)    setJobBilling(jobs as JobBillingRow[])
      if (props)   setPropertyBilling(props as unknown as PropertyBillingRow[])
      if (seekers) setSeekerBilling(seekers as unknown as SeekerPurchaseBillingRow[])
      if (archive) setArchiveData(archive as ArchiveEntry[])
      setLoading(false)
    })
  }, [])

  const adsTotal        = data.reduce((acc, r) => acc + Number(r.total_amount), 0)
  const jobsTotal       = jobBilling.length * JOB_PRICE
  const propertiesTotal = propertyBilling.reduce((acc, p) => acc + propPrice(p.property_type, p.listing_type), 0)
  const seekerTotal     = seekerBilling.length * SEEKER_PRICE
  const grandTotal      = adsTotal + jobsTotal + propertiesTotal + seekerTotal

  // Group by company for the expanded view
  const jobsByCompany = jobBilling.reduce<Record<string, JobBillingRow[]>>((acc, j) => {
    if (!acc[j.company_id]) acc[j.company_id] = []
    acc[j.company_id].push(j)
    return acc
  }, {})

  const propertiesByCompany = propertyBilling.reduce<Record<string, PropertyBillingRow[]>>((acc, p) => {
    if (!acc[p.company_id]) acc[p.company_id] = []
    acc[p.company_id].push(p)
    return acc
  }, {})

  const seekersByCompany = seekerBilling.reduce<Record<string, SeekerPurchaseBillingRow[]>>((acc, s) => {
    if (!acc[s.company_id]) acc[s.company_id] = []
    acc[s.company_id].push(s)
    return acc
  }, {})

  // Companies with ONLY non-ad billing (jobs/properties/seekers, not in billing_summary)
  const billedCompanyIds = new Set(data.map(r => r.company_id))
  const nonAdCompanyIds = new Set([
    ...Object.keys(jobsByCompany),
    ...Object.keys(propertiesByCompany),
    ...Object.keys(seekersByCompany),
  ])
  const nonAdOnlyIds = [...nonAdCompanyIds].filter(cid => !billedCompanyIds.has(cid))

  // Resolve company name for non-ad-only companies
  function resolveCompanyName(cid: string): string {
    const job  = jobsByCompany[cid]?.[0]
    const prop = propertiesByCompany[cid]?.[0]
    const seek = seekersByCompany[cid]?.[0]
    return (
      (job?.companies as any)?.[0]?.public_name ??
      (prop?.companies as any)?.[0]?.public_name ??
      'Okänt företag'
    )
  }

  const nonAdOnlyEntries = nonAdOnlyIds.map(cid => {
    const jobs       = jobsByCompany[cid] ?? []
    const props      = propertiesByCompany[cid] ?? []
    const seekers    = seekersByCompany[cid] ?? []
    const totalAmt   = jobs.length * JOB_PRICE
                     + props.reduce((s, p) => s + propPrice(p.property_type, p.listing_type), 0)
                     + seekers.length * SEEKER_PRICE
    return { company_id: cid, public_name: resolveCompanyName(cid), jobs, props, seekers, totalAmt }
  })

  function toggleExpand(companyId: string) {
    setExpandedCompanies(prev => {
      const next = new Set(prev)
      next.has(companyId) ? next.delete(companyId) : next.add(companyId)
      return next
    })
  }

  function toggleArchiveExpand(id: number) {
    setExpandedArchive(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
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

    // Ad billing rows
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
      ;(jobsByCompany[r.company_id] ?? []).forEach(j => {
        const companyName = j.companies?.[0]?.public_name ?? r.public_name
        rows.push([
          'Jobbannons', companyName, j.title,
          '', '', '', '', '', '', '', '', '', '', '', '',
          JOB_PRICE,
        ])
      })
      ;(propertiesByCompany[r.company_id] ?? []).forEach(p => {
        rows.push([
          'Fastighetsannons', r.public_name,
          `${p.title} · ${p.property_type} · ${p.listing_type === 'forsaljning' ? 'Försäljning' : 'Uthyrning'}`,
          '', '', '', '', '', '', '', '', '', '', '', '', propPrice(p.property_type, p.listing_type),
        ])
      })
      ;(seekersByCompany[r.company_id] ?? []).forEach(s => {
        const sk = s.property_seekers
        rows.push([
          'Sökes-kontakt', r.public_name,
          sk ? `${sk.property_type} · ${sk.listing_type === 'forsaljning' ? 'Köpes' : 'Söker hyra'}${sk.county ? ` · ${sk.county}` : ''}` : `Sökes #${s.seeker_id}`,
          '', '', '', '', '', '', '', '', '', '', '', '', SEEKER_PRICE,
        ])
      })
    })

    // Non-ad-only companies (jobs / properties / seekers, no ad reads)
    if (nonAdOnlyEntries.length > 0) {
      rows.push(['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''])
      nonAdOnlyEntries.forEach(e => {
        rows.push(['Företag (ej reklam)', e.public_name, '', '', '', '', '', '', '', '', '', '', '', '', '', e.totalAmt])
        e.jobs.forEach(j => {
          rows.push(['Jobbannons', e.public_name, j.title, '', '', '', '', '', '', '', '', '', '', '', '', JOB_PRICE])
        })
        e.props.forEach(p => {
          rows.push([
            'Fastighetsannons', e.public_name,
            `${p.title} · ${p.property_type} · ${p.listing_type === 'forsaljning' ? 'Försäljning' : 'Uthyrning'}`,
            '', '', '', '', '', '', '', '', '', '', '', '', propPrice(p.property_type, p.listing_type),
          ])
        })
        e.seekers.forEach(s => {
          const sk = s.property_seekers
          rows.push([
            'Sökes-kontakt', e.public_name,
            sk ? `${sk.property_type} · ${sk.listing_type === 'forsaljning' ? 'Köpes' : 'Söker hyra'}${sk.county ? ` · ${sk.county}` : ''}` : `Sökes #${s.seeker_id}`,
            '', '', '', '', '', '', '', '', '', '', '', '', SEEKER_PRICE,
          ])
        })
      })
    }

    if (jobsTotal > 0) {
      rows.push(['Summa jobbannonser', '', '', '', '', '', '', '', '', '', '', '', '', '', '', jobsTotal])
    }
    if (propertiesTotal > 0) {
      rows.push(['Summa fastighetsannonser', '', '', '', '', '', '', '', '', '', '', '', '', '', '', propertiesTotal])
    }
    if (seekerTotal > 0) {
      rows.push(['Summa sökes-kontakter', '', '', '', '', '', '', '', '', '', '', '', '', '', '', seekerTotal])
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
    await supabase.from('billing_archive').insert({
      period_label: archiveLabel,
      data,
      jobs_data: jobBilling,
    })
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

    // Mark properties as billed
    const propIds = propertyBilling.map(p => p.id)
    if (propIds.length > 0) {
      await supabase.from('properties').update({ is_billed: true }).in('id', propIds)
    }

    // Mark seeker purchases as billed
    const seekerIds = seekerBilling.map(s => s.id)
    if (seekerIds.length > 0) {
      await supabase.from('property_seeker_purchases').update({ is_billed: true }).in('id', seekerIds)
    }

    setShowArchiveModal(false)
    setData([])
    setAdData([])
    setJobBilling([])
    setPropertyBilling([])
    setSeekerBilling([])
    alert('Faktureringsunderlaget har arkiverats.')
  }

  // Helper: compute totals for an archive entry
  function archiveAdTotal(entry: ArchiveEntry) {
    return (entry.data ?? []).reduce((s, r) => s + Number(r.total_amount), 0)
  }
  function archiveJobsTotal(entry: ArchiveEntry) {
    return (entry.jobs_data?.length ?? 0) * JOB_PRICE
  }

  // Determine if there's anything in the current period
  const hasCurrentPeriod = data.length > 0 || jobBilling.length > 0 || propertyBilling.length > 0 || seekerBilling.length > 0

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fakturering</h1>
          <p className="text-sm text-gray-500">Klicka på ett företag för att se uppdelning per reklamblad</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowArchive(v => !v)}
            className="btn-secondary gap-2"
          >
            <History className="h-4 w-4" />
            {showArchive ? 'Dölj arkiv' : 'Visa arkiv'}
            {archiveData.length > 0 && (
              <span className="ml-1 rounded-full bg-gray-200 px-1.5 py-0.5 text-xs text-gray-600">
                {archiveData.length}
              </span>
            )}
          </button>
          <button
            onClick={handleExportExcel}
            disabled={!hasCurrentPeriod}
            className="btn-primary gap-2"
          >
            <Download className="h-4 w-4" /> Exportera Excel
          </button>
        </div>
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
          <p className="text-xl font-bold text-gray-900">{data.length + nonAdOnlyEntries.length}</p>
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
          <div className="flex items-center gap-3">
            <Home className="h-5 w-5 text-amber-500" />
            <div>
              <p className="text-xs text-gray-500">Fastigheter + Sökes</p>
              <p className="text-xl font-bold text-gray-900">{propertyBilling.length + seekerBilling.length} st</p>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <p className="text-center text-gray-400 py-12">Laddar...</p>
      ) : (
        <>
          {/* ── Aktuell period ── */}
          {hasCurrentPeriod ? (
            <div className="card overflow-hidden mb-8">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="w-8 px-2 py-3" />
                      <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase text-xs">Företag / Reklamblad / Jobbannons</th>
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
                    {/* Companies with ad billing (may also have jobs) */}
                    {data.map(r => {
                      const ads         = adsForCompany(r.company_id)
                      const compJobs    = jobsByCompany[r.company_id] ?? []
                      const compProps   = propertiesByCompany[r.company_id] ?? []
                      const compSeekers = seekersByCompany[r.company_id] ?? []
                      const isExpanded  = expandedCompanies.has(r.company_id)
                      const compJobsAmt    = compJobs.length * JOB_PRICE
                      const compPropsAmt   = compProps.reduce((s, p) => s + propPrice(p.property_type, p.listing_type), 0)
                      const compSeekersAmt = compSeekers.length * SEEKER_PRICE
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
                              {compProps.length > 0 && (
                                <span className="ml-1 text-xs font-normal text-amber-600">· {compProps.length} fastigheter</span>
                              )}
                              {compSeekers.length > 0 && (
                                <span className="ml-1 text-xs font-normal text-teal-600">· {compSeekers.length} sökes</span>
                              )}
                            </td>
                            {[r.favorit_b2c_reads, r.favorit_b2c_amount, r.intresse_b2c_reads, r.intresse_b2c_amount, r.generell_b2c_reads, r.generell_b2c_amount, r.favorit_b2b_reads, r.favorit_b2b_amount, r.intresse_b2b_reads, r.intresse_b2b_amount, r.generell_b2b_reads, r.generell_b2b_amount].map((v, i) => (
                              <td key={i} className="px-2 py-3 text-center text-gray-600">{v}</td>
                            ))}
                            <td className="px-4 py-3 text-right font-bold text-gray-900">
                              {formatSEK(Number(r.total_amount) + compJobsAmt + compPropsAmt + compSeekersAmt)}
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

                          {/* Per-fastighets-rader */}
                          {isExpanded && compProps.map(p => (
                            <tr key={`prop-${p.id}`} className="bg-amber-50/30">
                              <td className="px-2 py-2" />
                              <td className="px-4 py-2 text-xs text-amber-700 pl-8 flex items-center gap-1">
                                <span className="text-gray-300 mr-1">↳</span>
                                <Home className="h-3 w-3 shrink-0" />
                                {p.title}
                                <span className="text-gray-400 ml-1">· {p.property_type} · {p.listing_type === 'forsaljning' ? 'Försäljning' : 'Uthyrning'}</span>
                                <span className="text-gray-400 ml-1">({new Date(p.created_at).toLocaleDateString('sv-SE')})</span>
                              </td>
                              {Array(12).fill('').map((_, i) => (
                                <td key={i} className="px-2 py-2 text-center text-xs text-gray-300">–</td>
                              ))}
                              <td className="px-4 py-2 text-right text-xs font-medium text-amber-700">{formatSEK(propPrice(p.property_type, p.listing_type))}</td>
                            </tr>
                          ))}

                          {/* Per-sökes-rader */}
                          {isExpanded && compSeekers.map(s => {
                            const sk = s.property_seekers
                            return (
                              <tr key={`seeker-${s.id}`} className="bg-teal-50/30">
                                <td className="px-2 py-2" />
                                <td className="px-4 py-2 text-xs text-teal-700 pl-8 flex items-center gap-1">
                                  <span className="text-gray-300 mr-1">↳</span>
                                  <Users className="h-3 w-3 shrink-0" />
                                  {sk ? `${sk.property_type} · ${sk.listing_type === 'forsaljning' ? 'Köpes' : 'Söker hyra'}${sk.county ? ` · ${sk.county}` : ''}` : `Sökes #${s.seeker_id}`}
                                  <span className="text-gray-400 ml-1">({new Date(s.created_at).toLocaleDateString('sv-SE')})</span>
                                </td>
                                {Array(12).fill('').map((_, i) => (
                                  <td key={i} className="px-2 py-2 text-center text-xs text-gray-300">–</td>
                                ))}
                                <td className="px-4 py-2 text-right text-xs font-medium text-teal-700">{formatSEK(SEEKER_PRICE)}</td>
                              </tr>
                            )
                          })}
                        </>
                      )
                    })}

                    {/* Companies with only non-ad billing (jobs/properties/seekers, no ad reads) */}
                    {nonAdOnlyEntries.map(e => {
                      const isExpanded = expandedCompanies.has(e.company_id)
                      return (
                        <>
                          <tr
                            key={`nonad-${e.company_id}`}
                            className="cursor-pointer hover:bg-primary-50/40 transition"
                            onClick={() => toggleExpand(e.company_id)}
                          >
                            <td className="px-2 py-3 text-gray-400">
                              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </td>
                            <td className="px-4 py-3 font-semibold text-gray-900">
                              {e.public_name}
                              <span className="ml-2 text-xs font-normal text-gray-400">0 reklamblad</span>
                              {e.jobs.length > 0 && (
                                <span className="ml-1 text-xs font-normal text-primary-500">· {e.jobs.length} jobb</span>
                              )}
                              {e.props.length > 0 && (
                                <span className="ml-1 text-xs font-normal text-amber-600">· {e.props.length} fastigheter</span>
                              )}
                              {e.seekers.length > 0 && (
                                <span className="ml-1 text-xs font-normal text-teal-600">· {e.seekers.length} sökes</span>
                              )}
                            </td>
                            {Array(12).fill(0).map((_, i) => (
                              <td key={i} className="px-2 py-3 text-center text-gray-300">–</td>
                            ))}
                            <td className="px-4 py-3 text-right font-bold text-gray-900">
                              {formatSEK(e.totalAmt)}
                            </td>
                          </tr>
                          {isExpanded && e.jobs.map(j => (
                            <tr key={`nonad-job-${j.id}`} className="bg-primary-50/30">
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
                          {isExpanded && e.props.map(p => (
                            <tr key={`nonad-prop-${p.id}`} className="bg-amber-50/30">
                              <td className="px-2 py-2" />
                              <td className="px-4 py-2 text-xs text-amber-700 pl-8 flex items-center gap-1">
                                <span className="text-gray-300 mr-1">↳</span>
                                <Home className="h-3 w-3 shrink-0" />
                                {p.title}
                                <span className="text-gray-400 ml-1">· {p.property_type} · {p.listing_type === 'forsaljning' ? 'Försäljning' : 'Uthyrning'}</span>
                                <span className="text-gray-400 ml-1">({new Date(p.created_at).toLocaleDateString('sv-SE')})</span>
                              </td>
                              {Array(12).fill('').map((_, i) => (
                                <td key={i} className="px-2 py-2 text-center text-xs text-gray-300">–</td>
                              ))}
                              <td className="px-4 py-2 text-right text-xs font-medium text-amber-700">{formatSEK(propPrice(p.property_type, p.listing_type))}</td>
                            </tr>
                          ))}
                          {isExpanded && e.seekers.map(s => {
                            const sk = s.property_seekers
                            return (
                              <tr key={`nonad-seeker-${s.id}`} className="bg-teal-50/30">
                                <td className="px-2 py-2" />
                                <td className="px-4 py-2 text-xs text-teal-700 pl-8 flex items-center gap-1">
                                  <span className="text-gray-300 mr-1">↳</span>
                                  <Users className="h-3 w-3 shrink-0" />
                                  {sk ? `${sk.property_type} · ${sk.listing_type === 'forsaljning' ? 'Köpes' : 'Söker hyra'}${sk.county ? ` · ${sk.county}` : ''}` : `Sökes #${s.seeker_id}`}
                                  <span className="text-gray-400 ml-1">({new Date(s.created_at).toLocaleDateString('sv-SE')})</span>
                                </td>
                                {Array(12).fill('').map((_, i) => (
                                  <td key={i} className="px-2 py-2 text-center text-xs text-gray-300">–</td>
                                ))}
                                <td className="px-4 py-2 text-right text-xs font-medium text-teal-700">{formatSEK(SEEKER_PRICE)}</td>
                              </tr>
                            )
                          })}
                        </>
                      )
                    })}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    {adsTotal > 0 && (
                      <tr>
                        <td colSpan={14} className="px-4 py-3 text-right font-bold text-gray-700">Summa reklamblad:</td>
                        <td className="px-4 py-3 text-right font-bold text-primary-700">{formatSEK(adsTotal)}</td>
                      </tr>
                    )}
                    {jobsTotal > 0 && (
                      <tr>
                        <td colSpan={14} className="px-4 py-3 text-right font-bold text-gray-700">Summa jobbannonser:</td>
                        <td className="px-4 py-3 text-right font-bold text-primary-700">{formatSEK(jobsTotal)}</td>
                      </tr>
                    )}
                    {propertiesTotal > 0 && (
                      <tr>
                        <td colSpan={14} className="px-4 py-3 text-right font-bold text-gray-700">Summa fastighetsannonser:</td>
                        <td className="px-4 py-3 text-right font-bold text-amber-700">{formatSEK(propertiesTotal)}</td>
                      </tr>
                    )}
                    {seekerTotal > 0 && (
                      <tr>
                        <td colSpan={14} className="px-4 py-3 text-right font-bold text-gray-700">Summa sökes-kontakter:</td>
                        <td className="px-4 py-3 text-right font-bold text-teal-700">{formatSEK(seekerTotal)}</td>
                      </tr>
                    )}
                    <tr className="border-t-2 border-gray-200">
                      <td colSpan={14} className="px-4 py-3 text-right font-bold text-gray-900">Totalt att fakturera:</td>
                      <td className="px-4 py-3 text-right font-bold text-primary-800 text-base">{formatSEK(grandTotal)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          ) : (
            <div className="card py-16 text-center text-gray-400 mb-8">
              Inget att fakturera just nu.
            </div>
          )}

          {/* ── Arkiv ── */}
          {showArchive && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Archive className="h-5 w-5 text-gray-400" />
                <h2 className="text-lg font-semibold text-gray-800">Arkiverade perioder</h2>
                <span className="text-sm text-gray-400">({archiveData.length} perioder)</span>
              </div>

              {archiveData.length === 0 ? (
                <div className="card py-10 text-center text-gray-400 text-sm">
                  Inga arkiverade perioder än.
                </div>
              ) : (
                <div className="space-y-3">
                  {archiveData.map(entry => {
                    const adTot   = archiveAdTotal(entry)
                    const jobTot  = archiveJobsTotal(entry)
                    const total   = adTot + jobTot
                    const isOpen  = expandedArchive.has(entry.id)
                    const jobsLen = entry.jobs_data?.length ?? 0
                    return (
                      <div key={entry.id} className="card overflow-hidden">
                        <button
                          className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition text-left"
                          onClick={() => toggleArchiveExpand(entry.id)}
                        >
                          <Archive className="h-4 w-4 text-gray-400 shrink-0" />
                          <div className="flex-1">
                            <span className="font-semibold text-gray-900">{entry.period_label}</span>
                            <span className="ml-3 text-xs text-gray-400">
                              {new Date(entry.created_at).toLocaleDateString('sv-SE')}
                            </span>
                          </div>
                          <div className="text-right mr-4">
                            <p className="font-bold text-gray-900">{formatSEK(total)}</p>
                            <p className="text-xs text-gray-400">
                              {entry.data.length} bolag · {jobsLen} jobb
                            </p>
                          </div>
                          {isOpen ? <ChevronUp className="h-4 w-4 text-gray-400 shrink-0" /> : <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />}
                        </button>

                        {isOpen && (
                          <div className="border-t border-gray-100 overflow-x-auto">
                            <table className="min-w-full text-sm divide-y divide-gray-50">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-4 py-2 text-left text-xs text-gray-400 uppercase">Företag</th>
                                  <th className="px-4 py-2 text-right text-xs text-gray-400 uppercase">Reklam (kr)</th>
                                  <th className="px-4 py-2 text-right text-xs text-gray-400 uppercase">Jobb (kr)</th>
                                  <th className="px-4 py-2 text-right text-xs text-gray-500 uppercase font-semibold">Totalt</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-50">
                                {entry.data.map((r, i) => {
                                  const compJobsInArchive = (entry.jobs_data ?? []).filter(j => j.company_id === r.company_id)
                                  const compJobsAmt = compJobsInArchive.length * JOB_PRICE
                                  return (
                                    <tr key={i} className="hover:bg-gray-50/50">
                                      <td className="px-4 py-2 text-gray-800">{r.public_name}</td>
                                      <td className="px-4 py-2 text-right text-gray-600">{formatSEK(Number(r.total_amount))}</td>
                                      <td className="px-4 py-2 text-right text-gray-600">{compJobsAmt > 0 ? formatSEK(compJobsAmt) : '–'}</td>
                                      <td className="px-4 py-2 text-right font-semibold text-gray-900">{formatSEK(Number(r.total_amount) + compJobsAmt)}</td>
                                    </tr>
                                  )
                                })}
                                {/* Job-only companies in archive */}
                                {(entry.jobs_data ?? [])
                                  .filter(j => !entry.data.find(r => r.company_id === j.company_id))
                                  .reduce<{company_id: string; name: string; count: number}[]>((acc, j) => {
                                    const existing = acc.find(a => a.company_id === j.company_id)
                                    if (existing) { existing.count++; return acc }
                                    return [...acc, { company_id: j.company_id, name: j.companies?.[0]?.public_name ?? 'Okänt', count: 1 }]
                                  }, [])
                                  .map((e, i) => (
                                    <tr key={`jonly-${i}`} className="hover:bg-gray-50/50">
                                      <td className="px-4 py-2 text-gray-800">{e.name}</td>
                                      <td className="px-4 py-2 text-right text-gray-300">–</td>
                                      <td className="px-4 py-2 text-right text-gray-600">{formatSEK(e.count * JOB_PRICE)}</td>
                                      <td className="px-4 py-2 text-right font-semibold text-gray-900">{formatSEK(e.count * JOB_PRICE)}</td>
                                    </tr>
                                  ))
                                }
                              </tbody>
                              <tfoot className="bg-gray-50">
                                <tr>
                                  <td className="px-4 py-2 text-right text-xs font-bold text-gray-500" colSpan={3}>Totalt period:</td>
                                  <td className="px-4 py-2 text-right font-bold text-primary-700">{formatSEK(total)}</td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
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
              Vill du arkivera den exporterade listan? Datan sparas med datum och de markerade läsningarna registreras som fakturerade.
              Jobbannonser ({jobBilling.length} st), fastighetsannonser ({propertyBilling.length} st) och sökes-kontaktköp ({seekerBilling.length} st) markeras också som fakturerade.
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
