"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Sparkles } from "lucide-react"
import { useRouter } from "next/navigation"

export function SearchBar() {
  const [query, setQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!query.trim()) return

    setIsLoading(true)

    try {
      // Store the query in localStorage to use it on the results page
      localStorage.setItem("aimap_query", query)

      // Navigate to the results page
      router.push(`/results?q=${encodeURIComponent(query)}`)
    } catch (error) {
      console.error("Error submitting query:", error)
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative flex items-center">
        <div className="absolute left-3 text-gray-400">
          <Search size={18} />
        </div>

        <Input
          type="text"
          placeholder="Enter your topic or question..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-10 pr-24 py-6 bg-white/10 border-white/10 focus:border-purple-500/50 rounded-full text-white placeholder:text-gray-500"
        />

        <Button
          type="submit"
          disabled={isLoading}
          className="absolute right-1 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 rounded-full px-4 py-2 flex items-center gap-2"
        >
          {isLoading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <Sparkles size={16} />
          )}
          <span>{isLoading ? "Generating..." : "Generate"}</span>
        </Button>
      </div>
    </form>
  )
}
