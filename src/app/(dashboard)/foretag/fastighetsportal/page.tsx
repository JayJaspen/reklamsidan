'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { JOB_COUNTIES, CITIES_BY_COUNTY } from '@/lib/utils'
import {
  Plus, Pencil, Trash2, Eye, EyeOff, Loader2, X,
  CheckCircle, Info, Home, Building2, ImagePlus, XCircle,
  ChevronDown, ChevronUp, Search,
} from 'lucide-react'

// ── Priser ───────────────────────────────────────────────────
const PRICE_B2C_FORSALJNING = 1990  // kr exkl. moms per annons
const PRICE_B2C_UTHYRNING   =  399  // kr exkl. moms per annons
const PRICE_B2B_FORSALJNING = 2990  // kr exkl. moms per annons
const PRICE_B2B_UTHYRNING   = 2490  // kr exkl. moms per annons

function getPrice(propertyType: string, listingType: string): number {
  const isB2B = B2B_TYPES.includes(propertyType as any)
  if (listingType === 'uthyrning') return isB2B ? PRICE_B2B_UTHYRNING : PRICE_B2C_UTHYRNING
  return isB2B ? PRICE_B2B_FORSALJNING : PRICE_B2C_FORSALJNING
}

// ── Fastighetstyper ──────────────────────────────────────────
const B2C_TYPES = ['Lägenhet', 'Villa', 'Radhus', 'Tomt'] as const
const B2B_TYPES = ['Lagerlokal', 'Butikslokal'] as const
const ALL_TYPES = [...B2C_TYPES, ...B2B_TYPES]
const TYPES_WITH_ROOMS = ['Lägenhet', 'Villa', 'Radhus']
const ROOM_OPTIONS = ['1', '1.5', '2', '2.5', '3', '3.5', '4', '4.5', '5', '5.5', '6', '7', '8']
const MAX_IMAGES = 5

type Property = {
  id: number
  property_type: string
  listing_type: string
  title: string
  description: string
  address: string | null
  city: string
  county: string
  price: number | null
  price_period: string | null
  size_sqm: number | null
  rooms: number | null
  build_year: number | null
  image_urls: string[]
  is_active: boolean
  created_at: string
  contact_name:  string | null
  contact_phone: string | null
  contact_email: string | null
}

const EMPTY_FORM = {
  propertyType:  '',
  listingType:   'forsaljning',
  title:         '',
  description:   '',
  address:       '',
  city:          '',
  county:        '',
  price:         '',
  pricePeriod:   'månad',
  monthlyFee:    '',
  sizeSqm:       '',
  rooms:         '',
  buildYear:     '',
  contactName:   '',
  contactPhone:  '',
  contactEmail:  '',
}

export default function ForetagFastighetsportal() {
  const supabase = createClient()

  const [companyId,         setCompanyId]         = useState<string | null>(null)
  const [properties,        setProperties]        = useState<Property[]>([])
  const [loading,           setLoading]           = useState(true)
  const [showForm,          setShowForm]          = useState(false)
  const [editId,            setEditId]            = useState<number | null>(null)
  const [saving,            setSaving]            = useState(false)
  const [saved,             setSaved]             = useState(false)
  const [deletingId,        setDeletingId]        = useState<number | null>(null)
  const [togglingId,        setTogglingId]        = useState<number | null>(null)
  const [form,              setForm]              = useState(EMPTY_FORM)
  const [error,             setError]             = useState<string | null>(null)
  const [customCity,        setCustomCity]        = useState(false)

  // Sökes-annonser (users looking for properties)
  const [seekers,           setSeekers]           = useState<any[]>([])
  const [purchasedIds,      setPurchasedIds]      = useState<Set<number>>(new Set())
  const [purchasingId,      setPurchasingId]      = useState<number | null>(null)
  const [expandedSeekerId,  setExpandedSeekerId]  = useState<number | null>(null)

  // Bildhantering
  const [existingImages,  setExistingImages]  = useState<string[]>([])
  const [newImageFiles,   setNewImageFiles]   = useState<File[]>([])
  const [newPreviews,     setNewPreviews]     = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      setCompanyId(user.id)
      const [{ data: propData }, { data: seekerData }, { data: purchaseData }] = await Promise.all([
        supabase.from('properties').select('*').eq('company_id', user.id).is('deleted_at', null).order('created_at', { ascending: false }),
        supabase.from('property_seekers').select('*').eq('is_active', true).order('created_at', { ascending: false }),
        supabase.from('property_seeker_purchases').select('seeker_id').eq('company_id', user.id),
      ])
      if (propData)    setProperties(propData as Property[])
      if (seekerData)  setSeekers(seekerData)
      if (purchaseData) setPurchasedIds(new Set(purchaseData.map((p: any) => p.seeker_id as number)))
      setLoading(false)
    })
  }, [])

  function openNew() {
    setForm(EMPTY_FORM)
    setEditId(null)
    setExistingImages([])
    setNewImageFiles([])
    setNewPreviews([])
    setError(null)
    setCustomCity(false)
    setShowForm(true)
  }

  function openEdit(p: Property) {
    const countyList = p.county ? (CITIES_BY_COUNTY[p.county] ?? []) : []
    setCustomCity(!!p.city && !countyList.includes(p.city))
    setForm({
      propertyType: p.property_type,
      listingType:  p.listing_type,
      title:        p.title,
      description:  p.description,
      address:      p.address ?? '',
      city:         p.city,
      county:       p.county,
      price:        p.price != null ? String(p.price) : '',
      pricePeriod:  p.price_period ?? 'månad',
      monthlyFee:   (p as any).monthly_fee != null ? String((p as any).monthly_fee) : '',
      sizeSqm:      p.size_sqm != null ? String(p.size_sqm) : '',
      rooms:        p.rooms != null ? String(p.rooms) : '',
      buildYear:    p.build_year != null ? String(p.build_year) : '',
      contactName:  p.contact_name ?? '',
      contactPhone: p.contact_phone ?? '',
      contactEmail: p.contact_email ?? '',
    })
    setExistingImages(p.image_urls ?? [])
    setNewImageFiles([])
    setNewPreviews([])
    setEditId(p.id)
    setError(null)
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditId(null)
    newPreviews.forEach(url => URL.revokeObjectURL(url))
    setNewPreviews([])
    setNewImageFiles([])
    setExistingImages([])
    setError(null)
  }

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    const currentCount = existingImages.length + newImageFiles.length
    const remaining = MAX_IMAGES - currentCount
    if (remaining <= 0) return
    const selected = files.slice(0, remaining)
    setNewImageFiles(prev => [...prev, ...selected])
    setNewPreviews(prev => [...prev, ...selected.map(f => URL.createObjectURL(f))])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function removeExistingImage(url: string) {
    setExistingImages(prev => prev.filter(u => u !== url))
  }

  function removeNewImage(index: number) {
    URL.revokeObjectURL(newPreviews[index])
    setNewImageFiles(prev => prev.filter((_, i) => i !== index))
    setNewPreviews(prev => prev.filter((_, i) => i !== index))
  }

  async function uploadImages(files: File[], cid: string): Promise<string[]> {
    const urls: string[] = []
    for (const file of files) {
      const ext  = file.name.split('.').pop() ?? 'jpg'
      const path = `${cid}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error: uploadErr } = await supabase.storage
        .from('property-images')
        .upload(path, file, { upsert: true })
      if (!uploadErr) {
        const { data: { publicUrl } } = supabase.storage
          .from('property-images')
          .getPublicUrl(path)
        urls.push(publicUrl)
      }
    }
    return urls
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!companyId) return

    if (!form.propertyType)      { setError('Välj en fastighetstyp.'); return }
    if (!form.title.trim())      { setError('Ange en rubrik.'); return }
    if (!form.description.trim()){ setError('Ange en beskrivning.'); return }
    if (!form.city.trim())       { setError('Ange en stad.'); return }
    if (!form.county)            { setError('Välj ett län.'); return }

    setSaving(true)
    setError(null)

    // Ladda upp nya bilder
    const uploadedUrls = newImageFiles.length > 0
      ? await uploadImages(newImageFiles, companyId)
      : []

    const allImageUrls = [...existingImages, ...uploadedUrls]

    const payload = {
      company_id:    companyId,
      property_type: form.propertyType,
      listing_type:  form.listingType,
      title:         form.title.trim(),
      description:   form.description.trim(),
      address:       form.address.trim() || null,
      city:          form.city.trim(),
      county:        form.county,
      price:         form.price ? parseInt(form.price) : null,
      price_period:  form.listingType === 'uthyrning' ? form.pricePeriod : null,
      monthly_fee:   (form.propertyType === 'Lägenhet' && form.monthlyFee) ? parseInt(form.monthlyFee) : null,
      size_sqm:      form.sizeSqm ? parseFloat(form.sizeSqm) : null,
      rooms:         (TYPES_WITH_ROOMS.includes(form.propertyType) && form.rooms)
                       ? parseFloat(form.rooms) : null,
      build_year:    form.buildYear ? parseInt(form.buildYear) : null,
      image_urls:    allImageUrls,
      is_active:     true,
      contact_name:  form.contactName.trim() || null,
      contact_phone: form.contactPhone.trim() || null,
      contact_email: form.contactEmail.trim() || null,
    }

    if (editId) {
      const { error: err } = await supabase.from('properties').update(payload).eq('id', editId)
      if (err) { setError('Kunde inte spara: ' + err.message); setSaving(false); return }
      setProperties(prev => prev.map(p => p.id === editId ? { ...p, ...payload } as Property : p))
    } else {
      const { data, error: err } = await supabase.from('properties').insert(payload).select().single()
      if (err) { setError('Kunde inte spara: ' + err.message); setSaving(false); return }
      if (data) setProperties(prev => [data as Property, ...prev])
    }

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
    closeForm()
  }

  async function handleBuyContact(seekerId: number) {
    if (!companyId) return
    setPurchasingId(seekerId)
    await supabase.from('property_seeker_purchases').insert({ company_id: companyId, seeker_id: seekerId })
    setPurchasedIds(prev => new Set(prev).add(seekerId))
    setPurchasingId(null)
  }

  async function handleDelete(id: number) {
    if (!confirm('Är du säker på att du vill ta bort denna annons?')) return
    setDeletingId(id)
    await supabase.from('properties').update({ deleted_at: new Date().toISOString() }).eq('id', id)
    setProperties(prev => prev.filter(p => p.id !== id))
    setDeletingId(null)
  }

  async function handleToggleActive(p: Property) {
    setTogglingId(p.id)
    const next = !p.is_active
    const { error: err } = await supabase.from('properties').update({ is_active: next }).eq('id', p.id)
    if (!err) setProperties(prev => prev.map(x => x.id === p.id ? { ...x, is_active: next } : x))
    setTogglingId(null)
  }

  const totalImages = existingImages.length + newImageFiles.length
  const canAddMore  = totalImages < MAX_IMAGES

  if (loading) return <div className="py-20 text-center text-gray-400">Laddar...</div>

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fastighetsportal</h1>
          <p className="text-sm text-gray-500">Publicera fastigheter till försäljning eller uthyrning</p>
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

      {/* Prisinformation */}
      <div className="mb-6 flex items-start gap-3 rounded-xl border border-primary-200 bg-primary-50 px-4 py-3 text-sm text-primary-800">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary-500" />
        <div>
          <p className="font-medium mb-1">Priser per annons (exkl. moms) – debiteras på nästkommande kvartalsfaktura</p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-0.5 text-xs">
            <span>Bostäder – försäljning: <strong>{PRICE_B2C_FORSALJNING.toLocaleString('sv-SE')} kr</strong></span>
            <span>Bostäder – uthyrning: <strong>{PRICE_B2C_UTHYRNING.toLocaleString('sv-SE')} kr</strong></span>
            <span>Lokaler – försäljning: <strong>{PRICE_B2B_FORSALJNING.toLocaleString('sv-SE')} kr</strong></span>
            <span>Lokaler – uthyrning: <strong>{PRICE_B2B_UTHYRNING.toLocaleString('sv-SE')} kr</strong></span>
          </div>
        </div>
      </div>

      {/* ── Formulär ── */}
      {showForm && (
        <div className="mb-6 card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-800">
              {editId ? 'Redigera annons' : 'Ny fastighetsannons'}
            </h2>
            <button onClick={closeForm} className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            {/* Fastighetstyp + Annonstyp */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-600">Fastighetstyp *</label>
                <select
                  className="input-field"
                  value={form.propertyType}
                  onChange={e => setForm(f => ({ ...f, propertyType: e.target.value, rooms: '' }))}
                >
                  <option value="">Välj typ</option>
                  <optgroup label="Bostäder (B2C)">
                    {B2C_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </optgroup>
                  <optgroup label="Lokaler (B2B)">
                    {B2B_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </optgroup>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-600">Annonstyp *</label>
                <select
                  className="input-field"
                  value={form.listingType}
                  onChange={e => setForm(f => ({ ...f, listingType: e.target.value }))}
                >
                  <option value="forsaljning">Till försäljning</option>
                  <option value="uthyrning">Uthyrning</option>
                </select>
              </div>
            </div>

            {/* Rubrik */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-600">Rubrik *</label>
              <input
                type="text"
                className="input-field"
                placeholder="t.ex. Ljus 3-rumslägenhet med balkong"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              />
            </div>

            {/* Beskrivning */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-600">Beskrivning *</label>
              <textarea
                className="input-field min-h-[100px] resize-y"
                placeholder="Beskriv fastigheten..."
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              />
            </div>

            {/* Adress, län, stad */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-600">Gatuadress</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="t.ex. Storgatan 1"
                  value={form.address}
                  onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-600">Län *</label>
                <select
                  className="input-field"
                  value={form.county}
                  onChange={e => setForm(f => ({ ...f, county: e.target.value, city: '' }))}
                >
                  <option value="">Välj län</option>
                  {JOB_COUNTIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-600">Stad *</label>
                {customCity ? (
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Ange stad..."
                      value={form.city}
                      onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                    />
                    <button
                      type="button"
                      className="shrink-0 text-xs text-gray-400 hover:text-gray-600 px-2"
                      onClick={() => { setCustomCity(false); setForm(f => ({ ...f, city: '' })) }}
                      title="Välj från lista"
                    >↩</button>
                  </div>
                ) : form.county && CITIES_BY_COUNTY[form.county] ? (
                  <select
                    className="input-field"
                    value={form.city}
                    onChange={e => {
                      if (e.target.value === '__custom__') {
                        setCustomCity(true)
                        setForm(f => ({ ...f, city: '' }))
                      } else {
                        setForm(f => ({ ...f, city: e.target.value }))
                      }
                    }}
                  >
                    <option value="">Välj stad</option>
                    {CITIES_BY_COUNTY[form.county].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                    <option value="__custom__">Annan ort (skriv in)…</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Välj län först"
                    value={form.city}
                    onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                    disabled={!form.county}
                  />
                )}
              </div>
            </div>

            {/* Pris */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-600">
                  {form.listingType === 'forsaljning' ? 'Pris (kr)' : 'Hyra (kr)'}
                </label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="0"
                  min={0}
                  value={form.price}
                  onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                />
              </div>
              {form.listingType === 'uthyrning' && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-600">Period</label>
                  <select
                    className="input-field"
                    value={form.pricePeriod}
                    onChange={e => setForm(f => ({ ...f, pricePeriod: e.target.value }))}
                  >
                    <option value="månad">/ månad</option>
                    <option value="år">/ år</option>
                  </select>
                </div>
              )}
            </div>

            {/* Månadsavgift – visas för Lägenhet */}
            {form.propertyType === 'Lägenhet' && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-600">
                  Månadsavgift (kr/mån)
                  <span className="ml-1 text-xs text-gray-400">– bostadsrättsavgift</span>
                </label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="t.ex. 3500"
                  min={0}
                  value={form.monthlyFee}
                  onChange={e => setForm(f => ({ ...f, monthlyFee: e.target.value }))}
                />
              </div>
            )}

            {/* Storlek, rum, byggnadsår */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-600">
                  {form.propertyType === 'Tomt' ? 'Areal (kvm)' : 'Boarea (kvm)'}
                </label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="0"
                  min={0}
                  value={form.sizeSqm}
                  onChange={e => setForm(f => ({ ...f, sizeSqm: e.target.value }))}
                />
              </div>
              {TYPES_WITH_ROOMS.includes(form.propertyType) && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-600">Antal rum</label>
                  <select
                    className="input-field"
                    value={form.rooms}
                    onChange={e => setForm(f => ({ ...f, rooms: e.target.value }))}
                  >
                    <option value="">Välj</option>
                    {ROOM_OPTIONS.map(r => (
                      <option key={r} value={r}>{r} rum</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-600">Byggnadsår</label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="t.ex. 1985"
                  min={1800}
                  max={new Date().getFullYear()}
                  value={form.buildYear}
                  onChange={e => setForm(f => ({ ...f, buildYear: e.target.value }))}
                />
              </div>
            </div>

            {/* Kontaktuppgifter */}
            <div>
              <p className="mb-2 text-sm font-medium text-gray-600">Kontaktuppgifter <span className="font-normal text-gray-400">(visas för intresserade)</span></p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs text-gray-500">Namn</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="t.ex. Anna Svensson"
                    value={form.contactName}
                    onChange={e => setForm(f => ({ ...f, contactName: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs text-gray-500">Telefon</label>
                  <input
                    type="tel"
                    className="input-field"
                    placeholder="t.ex. 070-123 45 67"
                    value={form.contactPhone}
                    onChange={e => setForm(f => ({ ...f, contactPhone: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs text-gray-500">E-post</label>
                  <input
                    type="email"
                    className="input-field"
                    placeholder="t.ex. anna@foretag.se"
                    value={form.contactEmail}
                    onChange={e => setForm(f => ({ ...f, contactEmail: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {/* Bilduppladdning */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-600">
                Bilder (max {MAX_IMAGES})
              </label>
              {/* Befintliga bilder */}
              {existingImages.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {existingImages.map((url, i) => (
                    <div key={i} className="relative h-20 w-20 rounded-lg overflow-hidden border border-gray-200">
                      <img src={url} alt="" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeExistingImage(url)}
                        className="absolute top-0.5 right-0.5 rounded-full bg-black/60 p-0.5 text-white hover:bg-red-600 transition"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {/* Nya förhandsgranskningar */}
              {newPreviews.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {newPreviews.map((url, i) => (
                    <div key={i} className="relative h-20 w-20 rounded-lg overflow-hidden border border-primary-200">
                      <img src={url} alt="" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeNewImage(i)}
                        className="absolute top-0.5 right-0.5 rounded-full bg-black/60 p-0.5 text-white hover:bg-red-600 transition"
                      >
                        <X className="h-3 w-3" />
                      </button>
                      <span className="absolute bottom-0.5 left-0.5 rounded bg-primary-600/80 px-1 text-[9px] text-white">NY</span>
                    </div>
                  ))}
                </div>
              )}
              {canAddMore && (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleImageSelect}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 rounded-lg border-2 border-dashed border-gray-300 px-4 py-2.5 text-sm text-gray-500 hover:border-primary-400 hover:text-primary-600 transition"
                  >
                    <ImagePlus className="h-4 w-4" />
                    Lägg till bilder ({totalImages}/{MAX_IMAGES})
                  </button>
                </div>
              )}
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

      {/* ── Annonslistning ── */}
      {properties.length === 0 && !showForm ? (
        <div className="empty-state">
          <p className="text-4xl mb-3">🏠</p>
          <p className="text-base font-semibold text-gray-700">Inga fastighetsannonser än</p>
          <p className="text-sm text-gray-500 mt-1">Klicka på "Ny annons" för att publicera din första fastighet.</p>
        </div>
      ) : properties.length > 0 ? (
        <div className="space-y-3">
          {properties.map(p => (
            <div key={p.id} className={`card overflow-hidden transition ${!p.is_active ? 'opacity-60' : ''}`}>
              <div className="flex gap-4 p-4">
                {/* Thumbnail */}
                <div className="shrink-0 h-20 w-24 rounded-lg overflow-hidden bg-gray-100 border border-gray-100">
                  {p.image_urls.length > 0 ? (
                    <img
                      src={p.image_urls[0]}
                      alt={p.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      {B2B_TYPES.includes(p.property_type as any)
                        ? <Building2 className="h-8 w-8 text-gray-300" />
                        : <Home className="h-8 w-8 text-gray-300" />
                      }
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-900">{p.title}</span>
                    <span className="badge badge-blue">{p.property_type}</span>
                    <span className={`badge ${p.listing_type === 'forsaljning' ? 'badge-green' : 'badge-yellow'}`}>
                      {p.listing_type === 'forsaljning' ? 'Försäljning' : 'Uthyrning'}
                    </span>
                    {!p.is_active && <span className="badge badge-red">Avpublicerad</span>}
                  </div>
                  <p className="text-sm text-gray-500">
                    {p.city}, {p.county}
                    {p.size_sqm && <span className="ml-2">· {p.size_sqm} kvm</span>}
                    {p.rooms    && <span className="ml-2">· {p.rooms} rum</span>}
                    {p.build_year && <span className="ml-2">· Byggd {p.build_year}</span>}
                  </p>
                  {p.price && (
                    <p className="text-sm font-semibold text-gray-900 mt-0.5">
                      {p.price.toLocaleString('sv-SE')} kr
                      {p.price_period ? ` / ${p.price_period}` : ''}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    Publicerad: {new Date(p.created_at).toLocaleDateString('sv-SE')}
                    {p.image_urls.length > 0 && <span className="ml-2">· {p.image_urls.length} bild{p.image_urls.length !== 1 ? 'er' : ''}</span>}
                  </p>
                </div>

                {/* Knappar */}
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => handleToggleActive(p)}
                    disabled={togglingId === p.id}
                    className={`p-2 rounded-lg transition disabled:opacity-40 ${
                      p.is_active
                        ? 'text-gray-400 hover:text-orange-600 hover:bg-orange-50'
                        : 'text-orange-500 hover:text-green-600 hover:bg-green-50'
                    }`}
                    title={p.is_active ? 'Avpublicera' : 'Återpublicera'}
                  >
                    {togglingId === p.id
                      ? <Loader2 className="h-4 w-4 animate-spin" />
                      : p.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />
                    }
                  </button>
                  <button
                    onClick={() => openEdit(p)}
                    className="p-2 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition"
                    title="Redigera"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    disabled={deletingId === p.id}
                    className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition disabled:opacity-40"
                    title="Ta bort"
                  >
                    {deletingId === p.id
                      ? <Loader2 className="h-4 w-4 animate-spin" />
                      : <Trash2 className="h-4 w-4" />
                    }
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {/* ── Sökes-annonser ── */}
      <div className="mt-10">
        <div className="mb-4 flex items-center gap-2">
          <Search className="h-5 w-5 text-primary-500" />
          <h2 className="text-lg font-bold text-gray-900">Sökes-annonser</h2>
          <span className="rounded-full bg-primary-100 px-2 py-0.5 text-xs font-semibold text-primary-700">{seekers.length}</span>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Privatpersoner och företag som aktivt söker en fastighet. Köp kontaktuppgifter för att nå dem direkt – 99 kr exkl. moms per sökes-annons.
        </p>

        {seekers.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-gray-200 py-10 text-center text-sm text-gray-400">
            Inga aktiva sökes-annonser just nu
          </div>
        ) : (
          <div className="space-y-3">
            {seekers.map((s: any) => {
              const purchased = purchasedIds.has(s.id)
              const isOpen    = expandedSeekerId === s.id
              return (
                <div key={s.id} className="card overflow-hidden">
                  <button
                    onClick={() => setExpandedSeekerId(isOpen ? null : s.id)}
                    className="w-full text-left flex items-start gap-4 p-4 hover:bg-gray-50 transition"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="badge badge-blue">{s.property_type}</span>
                        <span className={`badge ${s.listing_type === 'forsaljning' ? 'badge-green' : 'badge-yellow'}`}>
                          {s.listing_type === 'forsaljning' ? 'Köpes' : 'Söker hyra'}
                        </span>
                        {s.county && <span className="text-xs text-gray-500">{s.city ? `${s.city}, ` : ''}{s.county}</span>}
                        <span className="text-xs text-gray-300">·</span>
                        <span className="text-xs text-gray-400">{new Date(s.created_at).toLocaleDateString('sv-SE')}</span>
                      </div>
                    </div>
                    <div className="shrink-0 self-center">
                      {isOpen
                        ? <ChevronUp className="h-5 w-5 text-gray-400" />
                        : <ChevronDown className="h-5 w-5 text-gray-400" />
                      }
                    </div>
                  </button>

                  {isOpen && (
                    <div className="border-t border-gray-100 px-4 pb-4 pt-3">
                      {s.description && (
                        <p className="text-sm text-gray-700 whitespace-pre-line mb-4">{s.description}</p>
                      )}
                      {purchased ? (
                        <div className="rounded-xl bg-green-50 border border-green-200 p-4 text-sm">
                          <p className="font-semibold text-green-800 mb-2">✓ Kontaktuppgifter upplåsta</p>
                          <div className="space-y-1 text-gray-700">
                            {s.contact_name  && <p><span className="text-gray-400">Namn:</span> {s.contact_name}</p>}
                            {s.contact_phone && <p><span className="text-gray-400">Telefon:</span> <a href={`tel:${s.contact_phone}`} className="text-primary-600 hover:underline">{s.contact_phone}</a></p>}
                            {s.contact_email && <p><span className="text-gray-400">E-post:</span> <a href={`mailto:${s.contact_email}`} className="text-primary-600 hover:underline">{s.contact_email}</a></p>}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-4 rounded-xl bg-gray-50 border border-gray-200 px-4 py-3">
                          <div>
                            <p className="text-sm font-medium text-gray-800">Kontaktuppgifter är dolda</p>
                            <p className="text-xs text-gray-400">Köp för att se namn, telefon och e-post – debiteras på nästkommande kvartalsfaktura</p>
                          </div>
                          <button
                            onClick={() => handleBuyContact(s.id)}
                            disabled={purchasingId === s.id}
                            className="btn-primary shrink-0 text-sm"
                          >
                            {purchasingId === s.id
                              ? <Loader2 className="h-4 w-4 animate-spin" />
                              : 'Köp kontaktuppgifter – 99 kr'
                            }
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
