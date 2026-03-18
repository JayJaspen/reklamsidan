'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/Toast'
import { Plus, Pencil, Trash2, Check, X, Loader2 } from 'lucide-react'

type Category = {
  id: number
  name: string
  parent_id: number | null
  sort_order: number
  is_active: boolean
}

export default function AdminKategorier() {
  const supabase = createClient()
  const { toast, confirm } = useToast()
  const [activeTab, setActiveTab] = useState<'b2c' | 'b2b'>('b2c')
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingName, setEditingName] = useState('')
  const [addingMain, setAddingMain] = useState(false)
  const [newMainName, setNewMainName] = useState('')
  const [addingSubFor, setAddingSubFor] = useState<number | null>(null)
  const [newSubName, setNewSubName] = useState('')

  const table = activeTab === 'b2c' ? 'categories_b2c' : 'categories_b2b'

  const loadCategories = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from(table)
      .select('id, name, parent_id, sort_order, is_active')
      .order('sort_order')
    if (data) setCategories(data)
    setLoading(false)
  }, [table])

  useEffect(() => { loadCategories() }, [loadCategories])

  async function saveEdit(id: number) {
    if (!editingName.trim()) return
    setSaving(true)
    await supabase.from(table).update({ name: editingName.trim() }).eq('id', id)
    setEditingId(null)
    await loadCategories()
    setSaving(false)
  }

  async function deleteCategory(id: number) {
    const hasChildren = categories.some(c => c.parent_id === id)
    if (hasChildren) {
      toast('Ta bort underkategorierna först innan du tar bort huvudkategorin.', 'warning')
      return
    }
    if (!await confirm('Är du säker på att du vill ta bort denna kategori?')) return
    await supabase.from(table).delete().eq('id', id)
    await loadCategories()
  }

  async function addMain() {
    if (!newMainName.trim()) return
    setSaving(true)
    const mainCats = categories.filter(c => c.parent_id === null)
    const maxSort = mainCats.length > 0 ? Math.max(...mainCats.map(c => c.sort_order)) : 0
    await supabase.from(table).insert({
      name: newMainName.trim(),
      parent_id: null,
      sort_order: maxSort + 10,
      is_active: true,
    })
    setNewMainName('')
    setAddingMain(false)
    await loadCategories()
    setSaving(false)
  }

  async function addSub(parentId: number) {
    if (!newSubName.trim()) return
    setSaving(true)
    const siblings = categories.filter(c => c.parent_id === parentId)
    const maxSort = siblings.length > 0 ? Math.max(...siblings.map(c => c.sort_order)) : 0
    await supabase.from(table).insert({
      name: newSubName.trim(),
      parent_id: parentId,
      sort_order: maxSort + 10,
      is_active: true,
    })
    setNewSubName('')
    setAddingSubFor(null)
    await loadCategories()
    setSaving(false)
  }

  async function toggleActive(id: number, current: boolean) {
    await supabase.from(table).update({ is_active: !current }).eq('id', id)
    await loadCategories()
  }

  const mainCats = categories.filter(c => c.parent_id === null)
  const subCats = (pid: number) => categories.filter(c => c.parent_id === pid)

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Kategorier</h1>
        <p className="text-sm text-gray-500">Hantera huvud- och underkategorier för B2C och B2B</p>
      </div>

      {/* B2C / B2B tabs */}
      <div className="flex gap-2 mb-6">
        {(['b2c', 'b2b'] as const).map(t => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition ${
              activeTab === t
                ? 'bg-primary-600 text-white shadow-sm'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-primary-400'
            }`}
          >
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-20 text-center text-gray-400">Laddar kategorier...</div>
      ) : (
        <div className="space-y-4">
          {mainCats.map(main => (
            <div key={main.id} className="card p-4">
              {/* Main category row */}
              <div className="flex items-center gap-2 mb-3">
                {editingId === main.id ? (
                  <>
                    <input
                      className="input-field flex-1 py-1.5 text-sm"
                      value={editingName}
                      onChange={e => setEditingName(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') saveEdit(main.id)
                        if (e.key === 'Escape') setEditingId(null)
                      }}
                      autoFocus
                    />
                    <button onClick={() => saveEdit(main.id)} className="text-green-600 hover:text-green-700">
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    </button>
                    <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-600">
                      <X className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <span className={`flex-1 font-semibold text-gray-900 ${!main.is_active ? 'line-through text-gray-400' : ''}`}>
                      {main.name}
                    </span>
                    <button
                      onClick={() => toggleActive(main.id, main.is_active)}
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${main.is_active ? 'text-green-700 bg-green-100' : 'text-gray-500 bg-gray-100'}`}
                    >
                      {main.is_active ? 'Aktiv' : 'Inaktiv'}
                    </button>
                    <button
                      onClick={() => { setEditingId(main.id); setEditingName(main.name) }}
                      className="text-gray-400 hover:text-blue-600 p-1 rounded"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => deleteCategory(main.id)}
                      className="text-gray-400 hover:text-red-600 p-1 rounded"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </>
                )}
              </div>

              {/* Subcategories */}
              <div className="ml-4 space-y-1.5 border-l-2 border-gray-100 pl-3">
                {subCats(main.id).map(sub => (
                  <div key={sub.id} className="flex items-center gap-2">
                    {editingId === sub.id ? (
                      <>
                        <input
                          className="input-field flex-1 py-1 text-sm"
                          value={editingName}
                          onChange={e => setEditingName(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') saveEdit(sub.id)
                            if (e.key === 'Escape') setEditingId(null)
                          }}
                          autoFocus
                        />
                        <button onClick={() => saveEdit(sub.id)} className="text-green-600 hover:text-green-700">
                          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                        </button>
                        <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-600">
                          <X className="h-4 w-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <span className={`flex-1 text-sm text-gray-700 ${!sub.is_active ? 'line-through text-gray-400' : ''}`}>
                          • {sub.name}
                        </span>
                        <button
                          onClick={() => toggleActive(sub.id, sub.is_active)}
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${sub.is_active ? 'text-green-700 bg-green-100' : 'text-gray-500 bg-gray-100'}`}
                        >
                          {sub.is_active ? 'Aktiv' : 'Inaktiv'}
                        </button>
                        <button
                          onClick={() => { setEditingId(sub.id); setEditingName(sub.name) }}
                          className="text-gray-400 hover:text-blue-600 p-1 rounded"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => deleteCategory(sub.id)}
                          className="text-gray-400 hover:text-red-600 p-1 rounded"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                ))}

                {/* Add subcategory inline */}
                {addingSubFor === main.id ? (
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      className="input-field flex-1 py-1 text-sm"
                      placeholder="Underkategorinamn..."
                      value={newSubName}
                      onChange={e => setNewSubName(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') addSub(main.id)
                        if (e.key === 'Escape') setAddingSubFor(null)
                      }}
                      autoFocus
                    />
                    <button onClick={() => addSub(main.id)} disabled={saving} className="text-green-600 hover:text-green-700">
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    </button>
                    <button onClick={() => setAddingSubFor(null)} className="text-gray-400 hover:text-gray-600">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setAddingSubFor(main.id); setNewSubName('') }}
                    className="mt-2 flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-medium"
                  >
                    <Plus className="h-3 w-3" /> Lägg till underkategori
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Add main category */}
          {addingMain ? (
            <div className="card p-4 flex items-center gap-3">
              <input
                className="input-field flex-1"
                placeholder="Namn på ny huvudkategori..."
                value={newMainName}
                onChange={e => setNewMainName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') addMain()
                  if (e.key === 'Escape') setAddingMain(false)
                }}
                autoFocus
              />
              <button onClick={addMain} disabled={saving} className="btn-primary gap-1.5 py-2 px-4">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Spara
              </button>
              <button onClick={() => setAddingMain(false)} className="btn-secondary py-2 px-4">
                Avbryt
              </button>
            </div>
          ) : (
            <button
              onClick={() => { setAddingMain(true); setNewMainName('') }}
              className="btn-secondary w-full gap-2 py-3"
            >
              <Plus className="h-4 w-4" /> Ny huvudkategori
            </button>
          )}
        </div>
      )}
    </div>
  )
}
