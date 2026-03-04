'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Search, Download, Building2, X, Globe, Mail, Phone, MapPin, FileText } from 'lucide-react'
import { SWEDISH_COUNTIES } from '@/lib/utils'

type CompanyResult = {
  id: string
  public_name: string
  registered_name: string
  org_number: string
  contact_person: string
  contact_email: string
  contact_phone: string
  website: string
  is_active: boolean
  company_description: string | null
  counties: string[] | null
  sends_b2b: boolean
  logo_url: string | null
  billing_method: string | null
  billing_address: string | null
  billing_postal_code: string | null
  billing_city: string | null
  billing_email: string | null
}

export default function AdminForetag() {
  const supabase = createClient()

  const [filter, setFilter] = useState({ county: '', category: '' })
  const [results, setResults]     = useState<CompanyResult[]>([])
  const [searched, setSearched]   = useState(false)
  const [loading, setLoading]     = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [selected, setSelected]   = useState<CompanyResult | null>(null)

  async function handleSearch() {
    setLoading(true)
    setSearched(true)
    setFetchError(null)

    const { data, error } = await supabase
      .from('companies')
      .select(`
        id, public_name, registered_name, org_number,
        contact_person, contact_email, contact_phone, website, is_active,
        company_description, counties, sends_b2b, logo_url,
        billing_method, billing_address, billing_postal_code, billing_city, billing_email
      `)
      .order('public_name')

    if (error) {
      console.error('Supabase error:', error)
      setFetchError(`Databasfel: ${error.message} (code: ${error.code})`)
    } else {
      setResults((data ?? []) as CompanyResult[])
    }
    setLoading(false)
  }

  async function toggleActive(id: string, current: boolean) {
    await supabase.from('companies').update({ is_active: !current }).eq('id', id)
    setResults(r => r.map(c => c.id === id ? { ...c, is_active: !current } : c))
    if (selected?.id === id) setSelected(s => s ? { ...s, is_active: !current } : s)
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Registrerade annonsörföretag</h1>
          <p className="text-sm text-gray-500">Sök och hantera företag som skickar reklam</p>
        </div>
        {searched && (
          <button className="btn-secondary gap-2">
            <Download className="h-4 w-4" /> Exportera PDF
          </button>
        )}
      </div>

      {/* Filter */}
      <div className="card mb-6 p-6">
        <h2 className="mb-4 text-sm font-semibold text-gray-700 uppercase tracking-wide">Filtrering</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-600">Hemmahörande län</label>
            <select className="input-field" value={filter.county}
              onChange={e => setFilter(f => ({ ...f, county: e.target.value }))}>
              <option value="">Alla län</option>
              {SWEDISH_COUNTIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-600">Kategori</label>
            <select className="input-field" value={filter.category}
              onChange={e => setFilter(f => ({ ...f, category: e.target.value }))}>
              <option value="">Alla kategorier</option>
            </select>
          </div>
          <div className="flex items-end">
            <button onClick={handleSearch} disabled={loading} className="btn-primary w-full gap-2">
              <Search className="h-4 w-4" />
              {loading ? 'Söker...' : 'Sök'}
            </button>
          </div>
        </div>
      </div>

      {fetchError && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {fetchError}
        </div>
      )}

      {!searched ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 py-16 text-gray-400">
          <Building2 className="mb-3 h-12 w-12 opacity-30" />
          <p className="text-sm">Välj filter och tryck på Sök</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="border-b border-gray-100 px-6 py-4">
            <span className="text-sm font-medium text-gray-700">{results.length} företag hittades</span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Publikt namn</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Org.nr</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Kontaktperson</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">E-post</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {results.map(c => (
                  <tr
                    key={c.id}
                    className="cursor-pointer hover:bg-primary-50/40 transition"
                    onClick={() => setSelected(c)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {c.logo_url && (
                          <img src={c.logo_url} alt="" className="h-8 w-8 rounded object-contain border border-gray-100" />
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-900">{c.public_name}</p>
                          <p className="text-xs text-gray-400">{c.registered_name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{c.org_number}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{c.contact_person}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{c.contact_email}</td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-2 py-1 text-xs font-medium ${c.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {c.is_active ? 'Aktiv' : 'Inaktiv'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={ev => { ev.stopPropagation(); toggleActive(c.id, c.is_active) }}
                        className="text-xs text-primary-600 hover:text-primary-800 font-medium"
                      >
                        {c.is_active ? 'Inaktivera' : 'Aktivera'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4 z-10">
              <div className="flex items-center gap-3">
                {selected.logo_url && (
                  <img src={selected.logo_url} alt="" className="h-10 w-10 rounded-lg object-contain border border-gray-100" />
                )}
                <div>
                  <h2 className="font-bold text-gray-900">{selected.public_name}</h2>
                  <p className="text-xs text-gray-400">{selected.registered_name}</p>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Status + aktivera */}
              <div className="flex items-center gap-3">
                <span className={`rounded-full px-3 py-1 text-sm font-medium ${selected.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {selected.is_active ? 'Aktiv' : 'Inaktiv'}
                </span>
                <button
                  onClick={() => toggleActive(selected.id, selected.is_active)}
                  className="btn-secondary text-sm py-1 px-3"
                >
                  {selected.is_active ? 'Inaktivera konto' : 'Aktivera konto'}
                </button>
              </div>

              {/* Basinfo */}
              <div>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Registreringsuppgifter</h3>
                <dl className="grid gap-2 sm:grid-cols-2">
                  <div>
                    <dt className="text-xs text-gray-400">Org.nummer</dt>
                    <dd className="text-sm font-medium text-gray-900">{selected.org_number || '-'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-400">Skickar B2B-reklam</dt>
                    <dd className="text-sm font-medium text-gray-900">{selected.sends_b2b ? 'Ja' : 'Nej'}</dd>
                  </div>
                </dl>
              </div>

              {/* Kontakt */}
              <div>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Kontaktuppgifter</h3>
                <div className="space-y-2">
                  {[
                    { icon: Phone, label: selected.contact_person, sub: 'Kontaktperson' },
                    { icon: Mail,  label: selected.contact_email,  sub: 'E-post' },
                    { icon: Phone, label: selected.contact_phone,  sub: 'Telefon' },
                    { icon: Globe, label: selected.website,        sub: 'Webbplats' },
                  ].map(({ icon: Icon, label, sub }) => label ? (
                    <div key={sub} className="flex items-start gap-3">
                      <Icon className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-900">{label}</p>
                        <p className="text-xs text-gray-400">{sub}</p>
                      </div>
                    </div>
                  ) : null)}
                </div>
              </div>

              {/* Beskrivning */}
              {selected.company_description && (
                <div>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Beskrivning</h3>
                  <p className="text-sm text-gray-700 leading-relaxed">{selected.company_description}</p>
                </div>
              )}

              {/* Län */}
              {selected.counties && selected.counties.length > 0 && (
                <div>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Verksamma Län</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {selected.counties.map(c => (
                      <span key={c} className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600">{c}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Fakturering */}
              <div>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Fakturering</h3>
                {selected.billing_method === 'email' ? (
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Mail className="h-4 w-4 text-gray-400" /> {selected.billing_email || '-'}
                  </div>
                ) : (
                  <div className="flex items-start gap-2 text-sm text-gray-700">
                    <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                    <div>
                      <p>{selected.billing_address || '-'}</p>
                      <p>{selected.billing_postal_code} {selected.billing_city}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
