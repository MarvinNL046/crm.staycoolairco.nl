"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { UserCheck, Users, Building2, TrendingUp, FileText, Receipt } from "lucide-react"

const quickAddItems = [
  {
    title: "Nieuwe Lead",
    description: "Voeg een potentiële klant toe",
    icon: UserCheck,
    href: "/crm/leads?action=new",
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-950",
  },
  {
    title: "Nieuw Contact",
    description: "Voeg een nieuw contactpersoon toe",
    icon: Users,
    href: "/crm/contacts?action=new",
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-50 dark:bg-green-950",
  },
  {
    title: "Nieuw Bedrijf",
    description: "Voeg een nieuw bedrijf toe",
    icon: Building2,
    href: "/crm/companies?action=new",
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-50 dark:bg-purple-950",
  },
  {
    title: "Nieuwe Deal",
    description: "Maak een nieuwe verkoopkans",
    icon: TrendingUp,
    href: "/crm/deals?action=new",
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-50 dark:bg-orange-950",
  },
  {
    title: "Nieuwe Factuur",
    description: "Maak een nieuwe factuur",
    icon: FileText,
    href: "/crm/invoices/new",
    color: "text-indigo-600 dark:text-indigo-400",
    bgColor: "bg-indigo-50 dark:bg-indigo-950",
  },
  {
    title: "Nieuwe Uitgave",
    description: "Registreer een nieuwe uitgave",
    icon: Receipt,
    href: "/crm/expenses?action=new",
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-50 dark:bg-red-950",
  },
]

export default function QuickAddPage() {
  const router = useRouter()
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)

  return (
    <div className="container mx-auto py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Snel Toevoegen</h1>
        <p className="mt-2 text-muted-foreground">
          Maak snel nieuwe records aan in je CRM
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {quickAddItems.map((item) => (
          <Card
            key={item.title}
            className="cursor-pointer transition-all hover:shadow-lg"
            onMouseEnter={() => setHoveredItem(item.title)}
            onMouseLeave={() => setHoveredItem(null)}
            onClick={() => router.push(item.href)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div
                  className={`rounded-lg p-3 ${item.bgColor} ${
                    hoveredItem === item.title ? "scale-110" : ""
                  } transition-transform`}
                >
                  <item.icon className={`h-6 w-6 ${item.color}`} />
                </div>
              </div>
              <CardTitle className="mt-4">{item.title}</CardTitle>
              <CardDescription>{item.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                variant="secondary" 
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation()
                  router.push(item.href)
                }}
              >
                {item.title} maken
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-12">
        <Card>
          <CardHeader>
            <CardTitle>Sneltoetsen</CardTitle>
            <CardDescription>
              Gebruik deze sneltoetsen voor nog snellere toegang
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <span className="text-sm">Nieuwe Lead</span>
                  <kbd className="rounded bg-muted px-2 py-1 text-xs">Ctrl + L</kbd>
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <span className="text-sm">Nieuw Contact</span>
                  <kbd className="rounded bg-muted px-2 py-1 text-xs">Ctrl + C</kbd>
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <span className="text-sm">Nieuwe Deal</span>
                  <kbd className="rounded bg-muted px-2 py-1 text-xs">Ctrl + D</kbd>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <span className="text-sm">Nieuw Bedrijf</span>
                  <kbd className="rounded bg-muted px-2 py-1 text-xs">Ctrl + Shift + C</kbd>
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <span className="text-sm">Nieuwe Factuur</span>
                  <kbd className="rounded bg-muted px-2 py-1 text-xs">Ctrl + I</kbd>
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <span className="text-sm">Nieuwe Uitgave</span>
                  <kbd className="rounded bg-muted px-2 py-1 text-xs">Ctrl + E</kbd>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}