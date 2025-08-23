"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ThemeToggleSimple } from "@/components/theme/theme-toggle"
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Calendar,
  UserCheck,
  Building2,
  FileText,
  Phone,
  Mail,
  Plus,
  Clock,
  Check,
  X,
  AlertCircle
} from "lucide-react"

export default function ThemeTestPage() {
  const colors = [
    { name: "Primary", class: "bg-primary text-primary-foreground", var: "primary" },
    { name: "Secondary", class: "bg-secondary text-secondary-foreground", var: "secondary" },
    { name: "Accent", class: "bg-accent text-accent-foreground", var: "accent" },
    { name: "Muted", class: "bg-muted text-muted-foreground", var: "muted" },
    { name: "Card", class: "bg-card text-card-foreground border", var: "card" },
    { name: "Destructive", class: "bg-destructive text-white", var: "destructive" }
  ]

  const iconColors = [
    { icon: Users, color: "blue", bg: "bg-blue-100 dark:bg-blue-900/20", text: "text-blue-600 dark:text-blue-400" },
    { icon: TrendingUp, color: "green", bg: "bg-green-100 dark:bg-green-900/20", text: "text-green-600 dark:text-green-400" },
    { icon: DollarSign, color: "amber", bg: "bg-amber-100 dark:bg-amber-900/20", text: "text-amber-600 dark:text-amber-400" },
    { icon: Calendar, color: "purple", bg: "bg-purple-100 dark:bg-purple-900/20", text: "text-purple-600 dark:text-purple-400" }
  ]

  return (
    <div className="space-y-8 p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Theme Test Page</h1>
          <p className="text-muted-foreground">
            Test alle kleuren en componenten in light en dark mode
          </p>
        </div>
        <ThemeToggleSimple />
      </div>

      {/* Color Palette */}
      <Card>
        <CardHeader>
          <CardTitle>Color Palette</CardTitle>
          <CardDescription>Alle theme kleuren</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {colors.map((color) => (
              <div key={color.name} className="space-y-2">
                <div className={`h-20 rounded-lg ${color.class} flex items-center justify-center font-medium`}>
                  {color.name}
                </div>
                <p className="text-xs text-muted-foreground text-center">var(--{color.var})</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Icon Colors */}
      <Card>
        <CardHeader>
          <CardTitle>Icon Colors</CardTitle>
          <CardDescription>Gekleurde iconen met achtergronden</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {iconColors.map((item, index) => (
              <div key={index} className="flex flex-col items-center space-y-2">
                <div className={`p-4 rounded-lg ${item.bg}`}>
                  <item.icon className={`h-8 w-8 ${item.text}`} />
                </div>
                <span className="text-sm text-muted-foreground">{item.color}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Buttons</CardTitle>
          <CardDescription>Verschillende button varianten</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <Button>Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
        </CardContent>
      </Card>

      {/* Badges */}
      <Card>
        <CardHeader>
          <CardTitle>Badges</CardTitle>
          <CardDescription>Status en label badges</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="destructive">Destructive</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
            Success
          </Badge>
          <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400">
            Warning
          </Badge>
        </CardContent>
      </Card>

      {/* Cards with Hover */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Hover Card</CardTitle>
              <Check className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Deze kaart heeft een hover effect
            </p>
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Colored Card</CardTitle>
              <AlertCircle className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Kaart met primary kleur accent
            </p>
          </CardContent>
        </Card>

        <Card className="border-destructive/20 bg-destructive/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Alert Card</CardTitle>
              <X className="h-4 w-4 text-destructive" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Kaart met destructive kleur
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Form Elements */}
      <Card>
        <CardHeader>
          <CardTitle>Form Elements</CardTitle>
          <CardDescription>Input velden en labels</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" placeholder="john@example.com" />
          </div>
          <div className="space-y-2">
            <Label>Password</Label>
            <Input type="password" placeholder="••••••••" />
          </div>
          <div className="space-y-2">
            <Label>Disabled Input</Label>
            <Input disabled placeholder="Dit veld is uitgeschakeld" />
          </div>
        </CardContent>
      </Card>

      {/* Gradients */}
      <Card className="overflow-hidden">
        <div className="h-32 gradient-background" />
        <CardHeader>
          <CardTitle>Gradient Background</CardTitle>
          <CardDescription>Subtiele gradient voor headers</CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}