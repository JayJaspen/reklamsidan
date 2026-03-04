'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Search, Download, Users } from 'lucide-react'
import { SWEDISH_COUNTIES, AGE_GROUPS } from '@/lib/utils'

type UserResult = {
  id: string
  user_type: string
  first_name?: string
  last_name?: string
  birth_year?: number
  gender?: string
  county?: string
  company_name?: string
  org_number?: string
}

export default function AdminAnvandare() {
  const supabase = createClient()

  const [filter, setFilter] = useState({
    userType:    'all',
    ageGroup:    '',
    county:      '',
    categoriesB2c: [] as number[],
    categoriesB2b: [] as number[],
  })
  const [results, setResults]   = useState<UserResult[]>([])
  const [searched, setSearched] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [totalCount, setTotalCount] = useState(0)

  async function handleSearch() {
    setLoading(true)
    setSearched(true)

    let query = supabase
      .from('user_profiles')
      .select(`
        id, user_type,
        users_b2c(first_name, last_name, birth_year, gender, county_id),
        users_b2b(company_name, org_number, county_id)
      `)
      .neq('user_type', 'admin')
      .neq('user_type', 'company')

    if (filter.userType !== 'all') {
      query = query.eq('user_type', filter.userType)
    }

    const { data, error } = await query
    if (!error && data) {
      const mapped: UserResult[] = (data as any[]).map(u => ({
        id:           u.id,
        user_type:    u.user_type,
        first_name:   u.users_b2c?.first_name,
        last_name:    u.users_b2c?.last_name,
        birth_year:   u.users_b2c?.birth_year,
        gender:       u.users_b2c?.gender,
        county:       (u.users_b2c?.county_id ? SWEDISH_COUNTIES[u.users_b2c.county_id - 1] : null)
                      ?? (u.users_b2b?.county_id ? SWEDISH_COUNTIES[u.users_b2b.county_id - 1] : null),
        company_name: u.users_b2b?.company_name,
        org_number:   u.users_b2b?.org_number,
      }))
      setResults(mapped)
      setTotalCount(mapped.length)
    }
    setLoading(false)
  }

  function handleExportPDF() {
    alert('PDF-export: Implementeras i nästa omgång med server action + @react-pdf/renderer')
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Registrerade användare</h1>
          <p className="text-sm text-gray-500">Filtrera och sök bland alla B2C- och B2B-användare</p>
        </div>
        {searched && (
          <button onClick={handleExportPDF} className="btn-secondary gap-2">
            <Download className="h-4 w-4" /> Exportera PDF
          </button>
        )}
      </div>

      {/* Filter */}
      <div className="card mb-6 p-6">
        <h2 className="mb-4 text-sm font-semibold text-gray-700 uppercase tracking-wide">Filtrering</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-600">Typ av användare</label>
            <select className="input-field" value={filter.userType}
              onChange={e => setFilter(f => ({ ...f, userType: e.target.value }))}>
              <option value="all">Alla</option>
              <option value="b2c">B2C – Privatpersoner</option>
              <option value="b2b">B2B – Företag</option>
            </select>
          </div>

          {filter.userType !== 'b2b' && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-600">Åldersgrupp</label>
              <select className="input-field" value={filter.ageGroup}
                onChange={e => setFilter(f => ({ ...f, ageGroup: e.target.value }))}>
                <option value="">Alla åldrar</option>
                {AGE_GROUPS.map(ag => (
                  <option key={ag.value} value={ag.value}>{ag.label}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-600">Län</label>
            <select className="input-field" value={filter.county}
              onChange={e => setFilter(f => ({ ...f, county: e.target.value }))}>
              <option value="">Alla län</option>
              {SWEDISH_COUNTIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button onClick={handleSearch} disabled={loading}
              className="btn-primary w-full gap-2">
              <Search className="h-4 w-4" />
              {loading ? 'Söker...' : 'Sök'}
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      {!searched && (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 py-16 text-gray-400">
          <Users className="mb-3 h-12 w-12 opacity-30" />
          <p className="text-sm">Välj filter ovan och tryck på Sök för att se användare</p>
        </div>
      )}

      {searched && (
        <div className="card overflow-hidden">
          <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              {totalCount} användare hittades
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Namn / Företag</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Typ</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Kön</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Födelseår</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Län</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {results.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-400">
                      Inga användare matchar filtreringen
                    </td>
                  </tr>
                ) : (
                  results.map(u => (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {u.first_name ? `${u.first_name} ${u.last_name}` : u.company_name ?? '-'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`rounded-full px-2 py-1 text-xs font-medium ${u.user_type === 'b2c' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'}`}>
                          {u.user_type.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 capitalize">{u.gender ?? '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{u.birth_year ?? '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{u.county ?? '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
