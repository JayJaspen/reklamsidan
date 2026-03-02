'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Search, Download, Building2 } from 'lucide-react'
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
}

export default function AdminForetag() {
  const supabase = createClient()

  const [filter, setFilter] = useState({
    county:   '',
    category: '',
  })
  const [results, setResults]     = useState<CompanyResult[]>([])
  const [searched, setSearched]   = useState(false)
  const [loading, setLoading]     = useState(false)

  async function handleSearch() {
    setLoading(true)
    setSearched(true)

    const { data, error } = await supabase
      .from('companies')
      .select('id, public_name, registered_name, org_number, contact_person, contact_email, contact_phone, website, is_active')
      .order('public_name')

    if (!error && data) setResults(data)
    setLoading(false)
  }

  async function toggleActive(id: string, current: boolean) {
    await supabase.from('companies').update({ is_active: !current }).eq('id', id)
    setResults(r => r.map(c => c.id === id ? { ...c, is_active: !current } : c))
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
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900">{c.public_name}</p>
                      <p className="text-xs text-gray-400">{c.registered_name}</p>
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
                        onClick={() => toggleActive(c.id, c.is_active)}
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
    </div>
  )
}
