"use client"

import { Suspense } from "react"
import { motion } from "framer-motion"
import { PublicLayout } from "@/components/layouts/public-layout"
import { SearchWidget } from "@/components/search-widget"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Calendar, Star, Shield, Clock, CreditCard, Umbrella, Mountain, Landmark, Gem, Wallet, Utensils, ArrowRight, User } from "lucide-react"
import { useLanguage } from "@/context/language-context"

export default function Home() {
  const { t, dir } = useLanguage()

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="relative min-h-[900px] flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/40 via-slate-900/20 to-slate-50 dark:to-slate-950 z-10" />
          <img
            src="https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=2074&auto=format&fit=crop"
            alt="Hero Background"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="container mx-auto px-4 relative z-20 pt-20">
          <div className="text-center mb-16 max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-sm font-medium bg-white/20 text-white border-white/20 backdrop-blur-md">
                ✨ {t.hero.badge} • 2025
              </Badge>
              <h1 className="text-6xl md:text-8xl font-bold mb-6 tracking-tight text-white drop-shadow-lg">
                {t.hero.title} <br /> {t.hero.title2}
              </h1>
              <p className="text-xl text-slate-100 max-w-2xl mx-auto mb-12 font-medium drop-shadow-md">
                {t.hero.subtitle}
              </p>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="relative z-30"
          >
            <Suspense fallback={<div className="h-48 bg-white/20 backdrop-blur-xl rounded-[2rem] animate-pulse" />}>
              <SearchWidget />
            </Suspense>
          </motion.div>
        </div>
      </section>

      {/* Plan Your Trip Section */}
      <section className="py-24 bg-slate-50 dark:bg-slate-950">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">

            {/* Travel Style Grid */}
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-10 shadow-xl">
              <div className="mb-8">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mb-4">
                  <MapPin className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-3xl font-bold mb-2 text-slate-900 dark:text-white">{t.home.plan_trip}</h2>
                <p className="text-slate-500">{t.home.plan_trip_desc}</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
                <StyleCard icon={<Umbrella className="w-6 h-6 text-blue-500" />} label={t.travel_styles.beach} />
                <StyleCard icon={<Mountain className="w-6 h-6 text-emerald-500" />} label={t.travel_styles.adventure} />
                <StyleCard icon={<Landmark className="w-6 h-6 text-amber-500" />} label={t.travel_styles.culture} />
                <StyleCard icon={<Gem className="w-6 h-6 text-purple-500" />} label={t.travel_styles.luxury} />
                <StyleCard icon={<Wallet className="w-6 h-6 text-green-500" />} label={t.travel_styles.budget} />
                <StyleCard icon={<Utensils className="w-6 h-6 text-orange-500" />} label={t.travel_styles.food} />
              </div>

              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-sm font-medium mb-2">
                    <span>{t.home.budget}</span>
                    <span>$2000</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full w-2/3 bg-gradient-to-r from-primary to-orange-500 rounded-full" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm font-medium mb-2">
                    <span>{t.home.trip_duration}</span>
                    <span>7 {t.common.days}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full w-1/3 bg-gradient-to-r from-blue-500 to-teal-500 rounded-full" />
                  </div>
                </div>
                <Button className="w-full h-12 text-lg bg-slate-900 text-white hover:bg-slate-800 mt-4">
                  {t.home.find_destinations} <ArrowRight className={`w-4 h-4 ${dir === 'rtl' ? 'mr-2 rotate-180' : 'ml-2'}`} />
                </Button>
              </div>
            </div>

            {/* Explore Destinations Map Placeholder */}
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-10 shadow-xl flex flex-col">
              <div className="mb-8">
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center mb-4">
                  <MapPin className="w-6 h-6 text-indigo-600" />
                </div>
                <h2 className="text-3xl font-bold mb-2 text-slate-900 dark:text-white">{t.home.explore}</h2>
                <p className="text-slate-500">{t.home.explore_desc}</p>
              </div>

              <div className="flex-1 bg-slate-50 dark:bg-slate-800 rounded-2xl relative overflow-hidden border border-slate-100 dark:border-slate-700">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                {/* Fake Map Points */}
                <div className="absolute top-1/3 left-1/4 w-4 h-4 bg-primary rounded-full shadow-lg shadow-primary/40 animate-pulse"></div>
                <div className="absolute top-1/2 left-1/2 w-4 h-4 bg-blue-500 rounded-full shadow-lg shadow-blue-500/40"></div>
                <div className="absolute bottom-1/3 right-1/3 w-4 h-4 bg-teal-500 rounded-full shadow-lg shadow-teal-500/40"></div>

                <div className="absolute bottom-8 left-0 right-0 text-center">
                  <p className="text-sm text-slate-400">{t.home.select_destination}</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Live Deals Section */}
      <section className="py-24 bg-slate-100 dark:bg-slate-900/50">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4 mb-12">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white">{t.home.live_deals}</h2>
              <p className="text-slate-500">{t.home.limited_offers}</p>
            </div>
            <Badge variant="destructive" className="ml-auto animate-pulse">{t.common.live}</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <DealCard
              t={t}
              dir={dir}
              city="Dubai"
              cityAr="دبي"
              price="$589"
              trend="12%"
              date="Dec 15"
              seats={8}
            />
            <DealCard
              t={t}
              dir={dir}
              city="Tokyo"
              cityAr="طوكيو"
              price="$749"
              trend="5%"
              date="Dec 20"
              seats={3}
            />
            <DealCard
              t={t}
              dir={dir}
              city="Paris"
              cityAr="باريس"
              price="$429"
              trend="18%"
              date="Dec 18"
              seats={12}
            />
          </div>
        </div>
      </section>

      {/* Why Choose Voyager */}
      <section className="py-32 bg-slate-50 dark:bg-slate-950">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4 text-slate-900 dark:text-white">{t.home.why_voyager}</h2>
          <p className="text-slate-500 mb-16">{t.home.why_voyager_desc}</p>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <FeatureCard
              icon={<Wallet className="w-8 h-8 text-yellow-500" />}
              title={t.home.best_prices}
              description={t.home.best_prices_desc}
            />
            <FeatureCard
              icon={<Shield className="w-8 h-8 text-emerald-500" />}
              title={t.home.secure}
              description={t.home.secure_desc}
            />
            <FeatureCard
              icon={<MapPin className="w-8 h-8 text-red-500" />}
              title={t.home.personalized}
              description={t.home.personalized_desc}
            />
            <FeatureCard
              icon={<Clock className="w-8 h-8 text-blue-500" />}
              title={t.home.fast_booking}
              description={t.home.fast_booking_desc}
            />
          </div>
        </div>
      </section>

    </PublicLayout>
  )
}

function StyleCard({ icon, label }: { icon: React.ReactNode, label: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-800 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer group">
      <div className="mb-3 transform group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <span className="font-medium text-slate-700 dark:text-slate-300">{label}</span>
    </div>
  )
}

function DealCard({ t, dir, city, cityAr, price, trend, date, seats }: { t: any, dir: string, city: string, cityAr: string, price: string, trend: string, date: string, seats: number }) {
  const displayCity = dir === 'rtl' ? cityAr : city

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
      <div className="flex justify-between items-start mb-6">
        <div>
          <p className="text-sm text-slate-500 mb-1">{t.home.flight_to}</p>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{displayCity}</h3>
        </div>
        <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
          📉 {trend}
        </Badge>
      </div>

      <div className="mb-8">
        <p className="text-4xl font-bold text-slate-900 dark:text-white mb-1">{price}</p>
        <p className="text-sm text-slate-500">{t.common.per_person}</p>
      </div>

      <div className="flex justify-between text-sm text-slate-500 mb-8">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4" />
          {date}
        </div>
        <div className="flex items-center gap-2">
          <User className="w-4 h-4" />
          {seats} {t.common.seats_left}
        </div>
      </div>

      <Button className="w-full h-12 bg-primary hover:bg-primary/90 text-white rounded-xl shadow-lg shadow-primary/25">
        {t.home.lock_price}
      </Button>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-sm hover:shadow-md transition-shadow">
      <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
        {icon}
      </div>
      <h3 className="text-lg font-bold mb-2 text-slate-900 dark:text-white">{title}</h3>
      <p className="text-slate-500 text-sm">{description}</p>
    </div>
  )
}
