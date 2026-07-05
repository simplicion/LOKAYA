"use client"

import * as React from "react"
import { Check, ChevronDown, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { countries, Country } from "@/lib/countries"

export interface CountrySelectorProps {
  value: string // country code
  onChange: (value: string) => void
}

export function CountrySelector({ value, onChange }: CountrySelectorProps) {
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const containerRef = React.useRef<HTMLDivElement>(null)

  const selectedCountry = React.useMemo(
    () => countries.find((c) => c.code === value) || countries.find((c) => c.code === "IN"),
    [value]
  )

  const filteredCountries = React.useMemo(() => {
    return countries.filter(
      (c) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.dialCode.includes(searchQuery)
    )
  }, [searchQuery])

  // Click outside to close
  React.useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleOutsideClick)
    return () => document.removeEventListener("mousedown", handleOutsideClick)
  }, [])

  // Auto-detect country based on locale/timezone if no value provided
  React.useEffect(() => {
    if (!value) {
      try {
        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
        // Very basic heuristic mapping for common timezones to countries.
        // In a real prod app, use a dedicated library or IP-based detection.
        if (timeZone.includes("Calcutta") || timeZone.includes("Kolkata")) onChange("IN")
        else if (timeZone.includes("America/New_York")) onChange("US")
        else if (timeZone.includes("Europe/London")) onChange("GB")
        else onChange("IN") // Fallback
      } catch (e) {
        onChange("IN")
      }
    }
  }, [value, onChange])

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex h-10 items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className="flex items-center gap-2">
          <span className="text-lg leading-none">{selectedCountry?.flag}</span>
          <span>{selectedCountry?.dialCode}</span>
        </span>
        <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
      </button>

      {open && (
        <div className="absolute top-12 z-50 w-[280px] rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in fade-in-0 zoom-in-95">
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <input
              className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Search country..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="max-h-[300px] overflow-y-auto p-1">
            {filteredCountries.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                No country found.
              </div>
            ) : (
              filteredCountries.map((country) => (
                <div
                  key={country.code}
                  className={cn(
                    "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                    value === country.code ? "bg-accent/50" : ""
                  )}
                  onClick={() => {
                    onChange(country.code)
                    setOpen(false)
                    setSearchQuery("")
                  }}
                >
                  <span className="mr-2 text-lg leading-none">{country.flag}</span>
                  <span className="flex-1 truncate">{country.name}</span>
                  <span className="text-muted-foreground">{country.dialCode}</span>
                  {value === country.code && (
                    <Check className="ml-2 h-4 w-4" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
