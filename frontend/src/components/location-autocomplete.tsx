'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plane, Building2, Loader2, MapPin, Search } from 'lucide-react';
import { searchLocations, Location } from '@/lib/amadeus';
import { cn } from '@/lib/utils';

interface LocationAutocompleteProps {
    value?: string;
    onChange: (location: Location | null) => void;
    onValueChange?: (value: string) => void;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
    type?: 'AIRPORT' | 'CITY' | 'AIRPORT,CITY';
    label?: string;
    error?: string;
}

export function LocationAutocomplete({
    value = '',
    onChange,
    onValueChange,
    placeholder = 'Search airports or cities...',
    className,
    disabled = false,
    type = 'AIRPORT,CITY',
    label,
    error,
}: LocationAutocompleteProps) {
    const [open, setOpen] = useState(false);
    const [inputValue, setInputValue] = useState(value);
    const [locations, setLocations] = useState<Location[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    // Debounced search function
    const debouncedSearch = useCallback((keyword: string) => {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        if (keyword.length < 2) {
            setLocations([]);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        debounceRef.current = setTimeout(async () => {
            try {
                const result = await searchLocations(keyword, type, 8);
                if (result.success) {
                    // Sort: Airports first, then cities, alphabetically
                    const sorted = result.locations.sort((a, b) => {
                        if (a.type === 'AIRPORT' && b.type !== 'AIRPORT') return -1;
                        if (a.type !== 'AIRPORT' && b.type === 'AIRPORT') return 1;
                        return a.name.localeCompare(b.name);
                    });
                    setLocations(sorted);
                } else {
                    setLocations([]);
                }
            } catch (error) {
                console.error('Location search error:', error);
                setLocations([]);
            } finally {
                setIsLoading(false);
            }
        }, 300);
    }, [type]);

    useEffect(() => {
        setInputValue(value);
    }, [value]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setInputValue(newValue);
        onValueChange?.(newValue);
        debouncedSearch(newValue);
        if (newValue.length >= 2) {
            setOpen(true);
        }
    };

    const handleSelect = (location: Location) => {
        const displayValue = `${location.name} (${location.iataCode})`;
        setInputValue(displayValue);
        onValueChange?.(displayValue);
        onChange(location);
        setOpen(false);
        setLocations([]);
    };

    const getLocationIcon = (locationType: string) => {
        if (locationType === 'AIRPORT') {
            return (
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Plane className="h-4 w-4 text-primary" />
                </div>
            );
        }
        return (
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                <Building2 className="h-4 w-4 text-muted-foreground" />
            </div>
        );
    };

    // Group locations by type
    const airports = locations.filter(l => l.type === 'AIRPORT');
    const cities = locations.filter(l => l.type !== 'AIRPORT');

    return (
        <div className="w-full">
            {label && (
                <label className="block text-sm font-medium text-foreground mb-1.5">
                    {label}
                </label>
            )}
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <div className="relative w-full">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        <Input
                            value={inputValue}
                            onChange={handleInputChange}
                            placeholder={placeholder}
                            className={cn(
                                "w-full pl-10 pr-10",
                                error && "border-destructive focus-visible:ring-destructive",
                                className
                            )}
                            disabled={disabled}
                            onFocus={() => {
                                if (inputValue.length >= 2 && locations.length > 0) {
                                    setOpen(true);
                                }
                            }}
                        />
                        {isLoading && (
                            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-primary" />
                        )}
                        {!isLoading && inputValue && (
                            <MapPin className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
                        )}
                    </div>
                </PopoverTrigger>
                <PopoverContent
                    className="w-[var(--radix-popover-trigger-width)] p-0 shadow-lg border-slate-200 dark:border-slate-800"
                    align="start"
                    sideOffset={4}
                >
                    <div className="max-h-[350px] overflow-auto">
                        {isLoading ? (
                            <div className="p-6 text-center">
                                <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
                                <p className="text-sm text-muted-foreground">Searching locations...</p>
                            </div>
                        ) : locations.length === 0 ? (
                            <div className="p-6 text-center">
                                <MapPin className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                                <p className="text-sm text-muted-foreground">
                                    {inputValue.length >= 2
                                        ? 'No locations found matching your search'
                                        : 'Start typing to search airports and cities'}
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                {/* Airports Section */}
                                {airports.length > 0 && (
                                    <div>
                                        <div className="px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                                <Plane className="w-3 h-3" />
                                                Airports
                                            </span>
                                        </div>
                                        {airports.map((location) => (
                                            <button
                                                key={`${location.iataCode}-${location.type}`}
                                                onClick={() => handleSelect(location)}
                                                className="flex w-full items-center gap-3 px-3 py-3 text-left hover:bg-primary/5 transition-colors cursor-pointer group"
                                            >
                                                {getLocationIcon(location.type)}
                                                <div className="flex flex-col min-w-0 flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium truncate group-hover:text-primary transition-colors">
                                                            {location.name}
                                                        </span>
                                                        <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-xs font-bold rounded shrink-0">
                                                            {location.iataCode}
                                                        </span>
                                                    </div>
                                                    <span className="text-xs text-muted-foreground truncate">
                                                        {location.city}{location.country ? `, ${location.country}` : ''}
                                                    </span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Cities Section */}
                                {cities.length > 0 && (
                                    <div>
                                        <div className="px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                                <Building2 className="w-3 h-3" />
                                                Cities
                                            </span>
                                        </div>
                                        {cities.map((location) => (
                                            <button
                                                key={`${location.iataCode}-${location.type}`}
                                                onClick={() => handleSelect(location)}
                                                className="flex w-full items-center gap-3 px-3 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
                                            >
                                                {getLocationIcon(location.type)}
                                                <div className="flex flex-col min-w-0 flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium truncate group-hover:text-foreground transition-colors">
                                                            {location.name}
                                                        </span>
                                                        <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold rounded shrink-0">
                                                            {location.iataCode}
                                                        </span>
                                                    </div>
                                                    <span className="text-xs text-muted-foreground truncate">
                                                        {location.country || 'City'}
                                                    </span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </PopoverContent>
            </Popover>
            {error && (
                <p className="mt-1.5 text-sm text-destructive">{error}</p>
            )}
        </div>
    );
}

export default LocationAutocomplete;
