import { useStore } from '../../store/useStore'
import { getTemplatesByCategory, CATEGORY_META, ALL_TEMPLATES } from '../../engine/templates'
import type { TemplateCategory } from '../../types'

const CATEGORIES: TemplateCategory[] = ['single', 'textBoard', 'iconEffect']

export function TemplatePicker() {
  const category = useStore((s) => s.category)
  const selectedTemplate = useStore((s) => s.selectedTemplate)
  const setCategory = useStore((s) => s.setCategory)
  const setTemplate = useStore((s) => s.setTemplate)
  const clearImages = useStore((s) => s.clearUploadedImages)

  const templates = category ? getTemplatesByCategory(category) : []

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Step 1 — Template Category</p>
        <div className="grid grid-cols-3 gap-2">
          {CATEGORIES.map((cat) => {
            const meta = CATEGORY_META[cat]
            const active = category === cat
            return (
              <button
                key={cat}
                onClick={() => { setCategory(cat); clearImages() }}
                className={`p-3 rounded-xl border text-left transition-all ${
                  active
                    ? 'border-accent bg-accent/10 text-white'
                    : 'border-border bg-surface-2 text-gray-400 hover:border-gray-500 hover:text-white'
                }`}
              >
                <div className="text-xl mb-1">{meta.icon}</div>
                <div className="text-sm font-semibold">{meta.label}</div>
                <div className="text-xs text-gray-500 mt-0.5">{meta.description}</div>
              </button>
            )
          })}
        </div>
      </div>

      {category && (
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Step 2 — Pick a Template</p>
          <div className="grid grid-cols-2 gap-2">
            {templates.map((t) => {
              const active = selectedTemplate?.id === t.id
              return (
                <button
                  key={t.id}
                  onClick={() => setTemplate(t)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    active
                      ? 'border-accent bg-accent/10 text-white'
                      : 'border-border bg-surface-2 text-gray-400 hover:border-gray-500 hover:text-white'
                  }`}
                >
                  <div className="text-sm font-bold">{t.name}</div>
                  <div className="text-xs text-gray-500 mt-0.5 leading-snug">{t.description}</div>
                  <div className="mt-2 flex gap-1">
                    <span className="text-xs bg-surface-3 px-1.5 py-0.5 rounded text-gray-400">
                      {t.duration}s
                    </span>
                    {t.defaultLoop && (
                      <span className="text-xs bg-surface-3 px-1.5 py-0.5 rounded text-gray-400">loop</span>
                    )}
                    <span className="text-xs bg-surface-3 px-1.5 py-0.5 rounded text-gray-400">
                      {t.slotCount} img
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {!category && (
        <div className="text-center py-6 text-gray-600 text-sm">
          Pick a category to see animation templates
        </div>
      )}

      {/* Quick reference: all templates count */}
      <p className="text-xs text-gray-600 text-right">
        {ALL_TEMPLATES.length} templates total
      </p>
    </div>
  )
}
