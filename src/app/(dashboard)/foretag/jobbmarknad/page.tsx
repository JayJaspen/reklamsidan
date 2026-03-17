'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { JOB_COUNTIES, CITIES_BY_COUNTY } from '@/lib/utils'
import { Loader2, Plus, Pencil, Trash2, CheckCircle, X, Eye, EyeOff, Info } from 'lucide-react'

type JobCategory = { id: number; name: string }

type Job = {
  id: number
  title: string
  description: string
  category_id: number
  county: string | null
  city: string | null
  is_remote: boolean
  salary_min: number | null
  salary_max: number | null
  salary_period: string
  contact_email: string | null
  application_url: string | null
  application_deadline: string | null
  is_active: boolean
  created_at: string
}

const EMPTY_FORM = {
  title: '',
  description: '',
  categoryId: '',
  county: '',
  city: '',
  isRemote: false,
  salaryMin: '',
  salaryMax: '',
  salaryPeriod: 'månad',
  contactEmail: '',
  applicationUrl: '',
  applicationDeadline: '',
}

export default function ForetagJobbmarknad() {
  const supabase = createClient()

  const [companyId, setCompanyId]     = useState<string | null>(null)
  const [companyLogo, setCompanyLogo] = useState<string | null>(null)
  const [categories, setCategories]   = useState<JobCategory[]>([])
  const [jobs, setJobs]               = useState<Job[]>([])
  const [loading, setLoading]         = useState(true)
  const [showForm, setShowForm]       = useState(false)
  const [editId, setEditId]           = useState<number | null>(null)
  const [saving, setSaving]           = useState(false)
  const [saved, setSaved]             = useState(false)
  const [deletingId, setDeletingId]   = useState<number | null>(null)
  const [togglingId, setTogglingId]   = useState<number | null>(null)
  const [form, setForm]               = useState(EMPTY_FORM)
  const [error, setError]             = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      setCompanyId(user.id)

      const [{ data: cats }, { data: jobRows }, { data: company }] = await Promise.all([
        supabase.from('job_categories').select('id,name').order('sort_order'),
        supabase
          .from('jobs')
          .select('*')
          .eq('company_id', user.id)
          .is('deleted_at', null)
          .order('created_at', { ascending: false }),
        supabase.from('companies').select('logo_url').eq('id', user.id).single(),
      ])

      if (cats)            setCategories(cats)
      if (jobRows)         setJobs(jobRows)
      if (company?.logo_url) setCompanyLogo(company.logo_url)
      setLoading(false)
    })
  }, [])

  function openNew() {
    setForm(EMPTY_FORM)
    setEditId(null)
    setError(null)
    setShowForm(true)
  }

  function openEdit(job: Job) {
    setForm({
      title:          job.title,
      description:    job.description,
      categoryId:     String(job.category_id),
      county:         job.is_remote ? '' : (job.county ?? ''),
      city:           job.is_remote ? '' : (job.city ?? ''),
      isRemote:       job.is_remote,
      salaryMin:      job.salary_min != null ? String(job.salary_min) : '',
      salaryMax:      job.salary_max != null ? String(job.salary_max) : '',
      salaryPeriod:   job.salary_period ?? 'månad',
      contactEmail:        job.contact_email ?? '',
      applicationUrl:      job.application_url ?? '',
      applicationDeadline: job.application_deadline ?? '',
    })
    setEditId(job.id)
    setError(null)
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditId(null)
    setError(null)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!companyId) return

    if (!form.title.trim()) { setError('Ange en jobbtitel.'); return }
    if (!form.description.trim()) { setError('Ange en jobbeskrivning.'); return }
    if (!form.categoryId) { setError('Välj en kategori.'); return }
    if (!form.isRemote && !form.county) { setError('Välj ett län eller markera Distans.'); return }
    if (!form.contactEmail.trim() && !form.applicationUrl.trim()) {
      setError('Ange antingen e-postadress eller ansökningslänk.')
      return
    }

    setSaving(true)
    setError(null)

    const rawUrl = form.applicationUrl.trim()
    const normalizedUrl = rawUrl && !rawUrl.match(/^https?:\/\//i)
      ? `https://${rawUrl}`
      : rawUrl || null

    const payload = {
      company_id:      companyId,
      title:           form.title.trim(),
      description:     form.description.trim(),
      category_id:     parseInt(form.categoryId),
      county:          form.isRemote ? null : (form.county || null),
      city:            form.isRemote ? null : (form.city || null),
      is_remote:       form.isRemote,
      salary_min:      form.salaryMin ? parseInt(form.salaryMin) : null,
      salary_max:      form.salaryMax ? parseInt(form.salaryMax) : null,
      salary_period:   form.salaryPeriod,
      contact_email:        form.contactEmail.trim() || null,
      application_url:      normalizedUrl,
      application_deadline: form.applicationDeadline || null,
      is_active:            true,
    }

    if (editId) {
      const { error: err } = await supabase.from('jobs').update(payload).eq('id', editId)
      if (err) { setError('Kunde inte spara: ' + err.message); setSaving(false); return }
      setJobs(prev => prev.map(j => j.id === editId ? { ...j, ...payload } as Job : j))
    } else {
      const { data, error: err } = await supabase.from('jobs').insert(payload).select().single()
      if (err) { setError('Kunde inte spara: ' + err.message); setSaving(false); return }
      if (data) setJobs(prev => [data as Job, ...prev])
    }

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
    closeForm()
  }

  async function handleDelete(id: number) {
    if (!confirm('Är du säker på att du vill ta bort detta jobb?')) return
    setDeletingId(id)
    await supabase.from('jobs').update({ deleted_at: new Date().toISOString() }).eq('id', id)
    setJobs(prev => prev.filter(j => j.id !== id))
    setDeletingId(null)
  }

  async function handleToggleActive(job: Job) {
    setTogglingId(job.id)
    const newActive = !job.is_active
    const { error: err } = await supabase
      .from('jobs')
      .update({ is_active: newActive })
      .eq('id', job.id)
    if (!err) {
      setJobs(prev => prev.map(j => j.id === job.id ? { ...j, is_active: newActive } : j))
    }
    setTogglingId(null)
  }

  const availableCities = form.county ? (CITIES_BY_COUNTY[form.county] ?? []) : []
  const catName = (id: number) => categories.find(c => c.id === id)?.name ?? ''

  if (loading) return <div className="py-20 text-center text-gray-400">Laddar...</div>

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Jobbmarknad</h1>
          <p className="text-sm text-gray-500">Publicera och hantera dina jobbannonser</p>
        </div>
        <div className="flex items-center gap-3">
          {saved && (
            <span className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
              <CheckCircle className="h-4 w-4" /> Sparat!
            </span>
          )}
          <button onClick={openNew} className="btn-primary">
            <Plus className="h-4 w-4" /> Ny annons
          </button>
        </div>
      </div>

      {/* Pricing info */}
      <div className="mb-6 flex items-start gap-3 rounded-xl border border-primary-200 bg-primary-50 px-4 py-3 text-sm text-primary-800">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary-500" />
        <p>
          Varje jobbannons kostar <strong>1 490 kr</strong> (exkl. moms) och debiteras på din nästkommande kvartalsfaktura.
        </p>
      </div>

      {/* Form */}
      {showForm && (
        <div className="mb-6 card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-800">
              {editId ? 'Redigera annons' : 'Ny jobbannons'}
            </h2>
            <button onClick={closeForm} className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            {/* Title */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-600">Jobbtitel *</label>
              <input
                type="text"
                className="input-field"
                placeholder="t.ex. Frontendutvecklare"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              />
            </div>

            {/* Description */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-600">Beskrivning *</label>
              <textarea
                className="input-field min-h-[120px] resize-y"
                placeholder="Beskriv tjänsten, krav och önskemål..."
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              />
            </div>

            {/* Category */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-600">Kategori *</label>
              <select
                className="input-field"
                value={form.categoryId}
                onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}
              >
                <option value="">Välj kategori</option>
                {categories.map(c => (
                  <option key={c.id} value={String(c.id)}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Salary */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-600">Lönespann (valfritt)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  className="input-field"
                  placeholder="Från (kr)"
                  min={0}
                  value={form.salaryMin}
                  onChange={e => setForm(f => ({ ...f, salaryMin: e.target.value }))}
                />
                <span className="text-gray-400 shrink-0">–</span>
                <input
                  type="number"
                  className="input-field"
                  placeholder="Till (kr)"
                  min={0}
                  value={form.salaryMax}
                  onChange={e => setForm(f => ({ ...f, salaryMax: e.target.value }))}
                />
                <select
                  className="input-field w-auto shrink-0"
                  value={form.salaryPeriod}
                  onChange={e => setForm(f => ({ ...f, salaryPeriod: e.target.value }))}
                >
                  <option value="månad">/ mån</option>
                  <option value="år">/ år</option>
                </select>
              </div>
            </div>

            {/* Remote / County / City */}
            <div>
              <label className="mb-2 flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-primary-600"
                  checked={form.isRemote}
                  onChange={e => setForm(f => ({ ...f, isRemote: e.target.checked, county: '', city: '' }))}
                />
                <span className="text-sm font-medium text-gray-600">Distansarbete (inget kontor krävs)</span>
              </label>
            </div>

            {!form.isRemote && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-600">Län *</label>
                  <select
                    className="input-field"
                    value={form.county}
                    onChange={e => setForm(f => ({ ...f, county: e.target.value, city: '' }))}
                  >
                    <option value="">Välj län</option>
                    {JOB_COUNTIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-600">Stad</label>
                  <select
                    className="input-field"
                    value={form.city}
                    onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                    disabled={!form.county}
                  >
                    <option value="">Välj stad</option>
                    {availableCities.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Contact */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-600">Kontakt-e-post</label>
                <input
                  type="email"
                  className="input-field"
                  placeholder="jobb@företag.se"
                  value={form.contactEmail}
                  onChange={e => setForm(f => ({ ...f, contactEmail: e.target.value }))}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-600">Länk till ansökan</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="www.företag.se/jobb"
                  value={form.applicationUrl}
                  onChange={e => setForm(f => ({ ...f, applicationUrl: e.target.value }))}
                />
              </div>
            </div>
            <p className="text-xs text-gray-400">Ange minst ett av ovanstående kontaktalternativ.</p>

            {/* Deadline */}
            <div className="w-1/2 pr-2">
              <label className="mb-1.5 block text-sm font-medium text-gray-600">Sista ansökningsdatum (valfritt)</label>
              <input
                type="date"
                className="input-field"
                value={form.applicationDeadline}
                onChange={e => setForm(f => ({ ...f, applicationDeadline: e.target.value }))}
              />
            </div>

            {error && <p className="text-sm text-red-600 font-medium">{error}</p>}

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {saving ? 'Sparar...' : editId ? 'Spara ändringar' : 'Publicera annons'}
              </button>
              <button type="button" onClick={closeForm} className="btn-secondary">Avbryt</button>
            </div>
          </form>
        </div>
      )}

      {/* Job list */}
      {jobs.length === 0 ? (
        <div className="empty-state">
          <p className="text-4xl mb-3">💼</p>
          <p className="text-base font-semibold text-gray-700">Inga jobbannonser än</p>
          <p className="text-sm text-gray-500 mt-1">Klicka på "Ny annons" för att publicera din första jobbannons.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map(job => (
            <div key={job.id} className={`card p-5 transition ${!job.is_active ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between gap-4">
                {/* Company logo preview */}
                {companyLogo ? (
                  <img
                    src={companyLogo}
                    alt="Logotyp"
                    className="h-12 w-12 rounded-lg object-contain border border-gray-100 bg-white p-1 shrink-0 mt-0.5"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center text-xs text-gray-400 shrink-0 mt-0.5">
                    Logo
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-base font-semibold text-gray-900">{job.title}</span>
                    <span className="badge badge-blue">{catName(job.category_id)}</span>
                    {job.is_remote
                      ? <span className="badge badge-green">Distans</span>
                      : <span className="badge badge-yellow">{job.city ? `${job.city}, ${job.county}` : job.county}</span>
                    }
                    {!job.is_active && (
                      <span className="badge badge-red">Avpublicerad</span>
                    )}
                  </div>
                  {(job.salary_min || job.salary_max) && (
                    <p className="text-sm text-gray-500 mt-0.5">
                      💰 {job.salary_min ? job.salary_min.toLocaleString('sv-SE') : '?'} – {job.salary_max ? job.salary_max.toLocaleString('sv-SE') : '?'} kr/{job.salary_period}
                    </p>
                  )}
                  <p className="text-sm text-gray-500 line-clamp-2 mt-1">{job.description}</p>
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-400">
                    {job.contact_email        && <span>✉️ {job.contact_email}</span>}
                    {job.application_url      && <span>🔗 {job.application_url}</span>}
                    {job.application_deadline && <span>📅 Sista dag: {new Date(job.application_deadline).toLocaleDateString('sv-SE')}</span>}
                    <span>Publicerad: {new Date(job.created_at).toLocaleDateString('sv-SE')}</span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-1 shrink-0">
                  {/* Avpublicera / Återpublicera */}
                  <button
                    onClick={() => handleToggleActive(job)}
                    disabled={togglingId === job.id}
                    className={`p-2 rounded-lg transition disabled:opacity-40 ${
                      job.is_active
                        ? 'text-gray-400 hover:text-orange-600 hover:bg-orange-50'
                        : 'text-orange-500 hover:text-green-600 hover:bg-green-50'
                    }`}
                    title={job.is_active ? 'Avpublicera' : 'Återpublicera'}
                  >
                    {togglingId === job.id
                      ? <Loader2 className="h-4 w-4 animate-spin" />
                      : job.is_active
                        ? <EyeOff className="h-4 w-4" />
                        : <Eye className="h-4 w-4" />
                    }
                  </button>
                  {/* Redigera */}
                  <button
                    onClick={() => openEdit(job)}
                    className="p-2 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition"
                    title="Redigera"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  {/* Ta bort */}
                  <button
                    onClick={() => handleDelete(job.id)}
                    disabled={deletingId === job.id}
                    className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition disabled:opacity-40"
                    title="Ta bort"
                  >
                    {deletingId === job.id
                      ? <Loader2 className="h-4 w-4 animate-spin" />
                      : <Trash2 className="h-4 w-4" />
                    }
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
