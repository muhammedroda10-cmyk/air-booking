import { Navbar } from "@/components/ui/navbar"
import { Footer } from "@/components/ui/footer"

interface PublicLayoutProps {
    children: React.ReactNode
}

export function PublicLayout({ children }: PublicLayoutProps) {
    return (
        <div className="min-h-screen flex flex-col bg-background font-sans antialiased">
            <Navbar />
            <main className="flex-1 pt-16">
                {children}
            </main>
            <Footer />
        </div>
    )
}
