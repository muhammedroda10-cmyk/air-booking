"use client"

import { useState, useEffect, useCallback } from "react"

export interface RecentSearch {
    id: string
    from: string
    fromCity: string
    to: string
    toCity: string
    date: string
    returnDate?: string
    tripType: string
    passengers: {
        adults: number
        children: number
        infants: number
    }
    timestamp: number
}

const STORAGE_KEY = "voyager_recent_searches"
const MAX_SEARCHES = 5

export function useRecentSearches() {
    const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([])

    // Load from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY)
            if (stored) {
                const parsed = JSON.parse(stored)
                setRecentSearches(Array.isArray(parsed) ? parsed : [])
            }
        } catch (error) {
            console.error("Failed to load recent searches", error)
        }
    }, [])

    // Save a new search
    const addSearch = useCallback((search: Omit<RecentSearch, "id" | "timestamp">) => {
        setRecentSearches(prev => {
            // Create unique ID
            const newSearch: RecentSearch = {
                ...search,
                id: `${search.from}-${search.to}-${search.date}-${Date.now()}`,
                timestamp: Date.now()
            }

            // Remove duplicates (same route and date)
            const filtered = prev.filter(
                s => !(s.from === search.from && s.to === search.to && s.date === search.date)
            )

            // Add new search at the beginning and limit to MAX_SEARCHES
            const updated = [newSearch, ...filtered].slice(0, MAX_SEARCHES)

            // Save to localStorage
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
            } catch (error) {
                console.error("Failed to save recent searches", error)
            }

            return updated
        })
    }, [])

    // Remove a specific search
    const removeSearch = useCallback((id: string) => {
        setRecentSearches(prev => {
            const updated = prev.filter(s => s.id !== id)
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
            } catch (error) {
                console.error("Failed to update recent searches", error)
            }
            return updated
        })
    }, [])

    // Clear all searches
    const clearSearches = useCallback(() => {
        setRecentSearches([])
        try {
            localStorage.removeItem(STORAGE_KEY)
        } catch (error) {
            console.error("Failed to clear recent searches", error)
        }
    }, [])

    return {
        recentSearches,
        addSearch,
        removeSearch,
        clearSearches
    }
}
