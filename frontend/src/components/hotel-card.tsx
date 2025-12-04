import { Star, MapPin, Wifi, Coffee, Car } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import Link from "next/link"
import Image from "next/image"

interface HotelProps {
    id: number
    name: string
    location: string
    rating: number
    price: number
    image: string
    amenities: string[]
}

export function HotelCard({ id, name, location, rating, price, image, amenities }: HotelProps) {
    return (
        <Card className="group overflow-hidden border-0 bg-white dark:bg-slate-900 shadow-sm hover:shadow-xl transition-all duration-300 rounded-[1.5rem]">
            <div className="flex flex-col md:flex-row">
                {/* Image Section */}
                <div className="w-full md:w-1/3 relative h-64 md:h-auto overflow-hidden">
                    <Image
                        src={image}
                        alt={name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute top-4 left-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-1 text-xs font-bold shadow-sm">
                        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                        {rating}
                    </div>
                </div>

                {/* Content Section */}
                <div className="flex-1 p-6 flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1 group-hover:text-primary transition-colors">
                                    {name}
                                </h3>
                                <div className="flex items-center text-slate-500 text-sm">
                                    <MapPin className="w-4 h-4 mr-1" />
                                    {location}
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-xs text-slate-500 block mb-1">starting from</span>
                                <span className="text-2xl font-bold text-primary">${price}</span>
                                <span className="text-xs text-slate-500">/night</span>
                            </div>
                        </div>

                        {/* Amenities */}
                        <div className="flex gap-4 mt-4 text-slate-500">
                            {amenities.includes("wifi") && (
                                <div className="flex items-center gap-1 text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                                    <Wifi className="w-3 h-3" /> Wifi
                                </div>
                            )}
                            {amenities.includes("breakfast") && (
                                <div className="flex items-center gap-1 text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                                    <Coffee className="w-3 h-3" /> Breakfast
                                </div>
                            )}
                            {amenities.includes("parking") && (
                                <div className="flex items-center gap-1 text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                                    <Car className="w-3 h-3" /> Parking
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-6 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4">
                        <div className="text-sm text-green-600 font-medium flex items-center gap-1">
                            <CheckIcon className="w-4 h-4" />
                            Free cancellation
                        </div>
                        <Link href={`/hotels/${id}`}>
                            <Button className="rounded-xl px-6 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-primary hover:text-white dark:hover:bg-primary dark:hover:text-white transition-colors">
                                View Details
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </Card>
    )
}

function CheckIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <polyline points="20 6 9 17 4 12" />
        </svg>
    )
}
