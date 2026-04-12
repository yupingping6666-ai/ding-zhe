import { useState, useRef, useEffect, useMemo } from 'react'
import { ChevronDown, Search } from 'lucide-react'
import { filterCities } from '@/lib/cities'

interface CityPickerProps {
  value: string
  onChange: (city: string) => void
}

export function CityPicker({ value, onChange }: CityPickerProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const filtered = useMemo(() => filterCities(query), [query])

  // Auto-focus search input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => searchRef.current?.focus(), 50)
    } else {
      setQuery('')
    }
  }, [open])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  function handleSelect(city: string) {
    onChange(city === value ? '' : city)
    setOpen(false)
  }

  return (
    <div ref={containerRef}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-5 py-4 text-sm text-left text-foreground hover:bg-accent/30 transition-colors flex items-center justify-between"
      >
        <span>所在城市</span>
        <div className="flex items-center gap-1.5">
          <span className={value ? 'text-foreground' : 'text-muted-foreground'}>
            {value || '选择城市'}
          </span>
          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {open && (
        <div className="px-3 pb-3 animate-fade-in">
          <div className="bg-secondary/50 rounded-2xl p-2.5">
            {/* Search input */}
            <div className="relative mb-2">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="搜索城市..."
                className="w-full pl-8 pr-3 py-2 text-xs bg-card/80 rounded-xl border border-border/30 text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/40 transition-colors"
              />
            </div>

            {/* City grid */}
            <div className="max-h-48 overflow-y-auto">
              {filtered.length > 0 ? (
                <div className="grid grid-cols-4 gap-1.5">
                  {filtered.map((city) => (
                    <button
                      key={city}
                      onClick={() => handleSelect(city)}
                      className={`px-2 py-2 rounded-xl text-xs font-medium transition-all active:scale-95 ${
                        city === value
                          ? 'bg-primary/10 text-primary border border-primary/30 font-semibold'
                          : 'bg-card/60 text-foreground hover:bg-card'
                      }`}
                    >
                      {city}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-4">未找到城市</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
