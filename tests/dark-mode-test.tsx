"use client"

import { useState } from 'react'
import { useTheme } from '@/lib/theme/ThemeProvider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form'
import { Skeleton } from '@/components/ui/skeleton'
import { ButtonLoading } from '@/components/ui/button-loading'
import { TableSkeleton } from '@/components/ui/table-skeleton'
import { StatsSkeleton } from '@/components/ui/stats-skeleton'
import { FormSkeleton } from '@/components/ui/form-skeleton'
import { CardSkeleton } from '@/components/ui/card-skeleton'
import { Moon, Sun, Monitor } from 'lucide-react'

export default function DarkModeTest() {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme()
  const [loading, setLoading] = useState(false)
  const [showSkeletons, setShowSkeletons] = useState(false)

  const handleLoadingTest = () => {
    setLoading(true)
    setTimeout(() => setLoading(false), 2000)
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dark Mode Test</h1>
          <p className="mt-1 text-muted-foreground">Test alle componenten in light en dark mode</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setTheme('light')}
            className={theme === 'light' ? 'bg-primary text-primary-foreground' : ''}
          >
            <Sun className="h-4 w-4 mr-2" />
            Light
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setTheme('dark')}
            className={theme === 'dark' ? 'bg-primary text-primary-foreground' : ''}
          >
            <Moon className="h-4 w-4 mr-2" />
            Dark
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setTheme('system')}
            className={theme === 'system' ? 'bg-primary text-primary-foreground' : ''}
          >
            <Monitor className="h-4 w-4 mr-2" />
            System
          </Button>
        </div>
      </div>

      {/* Current Theme Info */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Theme Status</CardTitle>
          <CardDescription>Huidige theme configuratie</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium">Selected Theme</p>
              <p className="text-lg">{theme}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Resolved Theme</p>
              <p className="text-lg">{resolvedTheme}</p>
            </div>
            <div>
              <p className="text-sm font-medium">System Preference</p>
              <p className="text-lg">
                {typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Button Tests */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Button Components</CardTitle>
          <CardDescription>Test alle button variants en states</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button>Primary Button</Button>
            <Button variant="secondary">Secondary Button</Button>
            <Button variant="outline">Outline Button</Button>
            <Button variant="ghost">Ghost Button</Button>
            <Button variant="destructive">Destructive Button</Button>
            <Button disabled>Disabled Button</Button>
            <ButtonLoading loading={loading} onClick={handleLoadingTest}>
              {loading ? 'Loading...' : 'Test Loading'}
            </ButtonLoading>
          </div>
        </CardContent>
      </Card>

      {/* Form Components */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Form Components</CardTitle>
          <CardDescription>Test alle form inputs en controls</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <FormField>
            <FormItem>
              <FormLabel>Text Input</FormLabel>
              <FormControl>
                <Input placeholder="Enter some text..." />
              </FormControl>
              <FormDescription>This is a description for the input field.</FormDescription>
            </FormItem>
          </FormField>

          <FormField>
            <FormItem>
              <FormLabel>Select Dropdown</FormLabel>
              <FormControl>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an option" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="option1">Option 1</SelectItem>
                    <SelectItem value="option2">Option 2</SelectItem>
                    <SelectItem value="option3">Option 3</SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
            </FormItem>
          </FormField>

          <FormField>
            <FormItem>
              <FormLabel>Textarea</FormLabel>
              <FormControl>
                <Textarea placeholder="Enter a longer message..." />
              </FormControl>
            </FormItem>
          </FormField>

          <FormField>
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Accept terms and conditions</FormLabel>
                <FormDescription>
                  You agree to our Terms of Service and Privacy Policy.
                </FormDescription>
              </div>
            </FormItem>
          </FormField>
        </CardContent>
      </Card>

      {/* Skeleton Tests */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Loading States</CardTitle>
          <CardDescription>Test skeleton screens en loading states</CardDescription>
          <Button 
            variant="outline" 
            onClick={() => setShowSkeletons(!showSkeletons)}
          >
            {showSkeletons ? 'Hide Skeletons' : 'Show Skeletons'}
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {showSkeletons ? (
            <>
              <div>
                <h3 className="text-lg font-semibold mb-3">Basic Skeleton</h3>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Stats Skeleton</h3>
                <StatsSkeleton cards={4} />
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Form Skeleton</h3>
                <FormSkeleton fields={5} />
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Card Skeleton</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <CardSkeleton showHeader={true} lines={4} showFooter={true} />
                  <CardSkeleton showHeader={false} lines={3} showFooter={false} />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Table Skeleton</h3>
                <TableSkeleton rows={5} columns={6} />
              </div>
            </>
          ) : (
            <p className="text-muted-foreground">Click "Show Skeletons" to view loading states</p>
          )}
        </CardContent>
      </Card>

      {/* Color Palette */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Color Palette</CardTitle>
          <CardDescription>Test alle theme kleuren en varianten</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">Background</h4>
              <div className="h-8 bg-background border rounded"></div>
              <div className="h-8 bg-muted border rounded"></div>
              <div className="h-8 bg-card border rounded"></div>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Text</h4>
              <div className="h-8 bg-foreground rounded"></div>
              <div className="h-8 bg-muted-foreground rounded"></div>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Primary</h4>
              <div className="h-8 bg-primary rounded"></div>
              <div className="h-8 bg-primary/80 rounded"></div>
              <div className="h-8 bg-primary/60 rounded"></div>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Status</h4>
              <div className="h-8 bg-green-500 rounded"></div>
              <div className="h-8 bg-yellow-500 rounded"></div>
              <div className="h-8 bg-red-500 rounded"></div>
              <div className="h-8 bg-blue-500 rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Colors Test */}
      <Card>
        <CardHeader>
          <CardTitle>Status Indicators</CardTitle>
          <CardDescription>Test status kleuren zoals gebruikt in facturen</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-500/10 text-green-600 dark:text-green-400">
                Betaald
              </span>
            </div>
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
                Verzonden
              </span>
            </div>
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-500/10 text-red-600 dark:text-red-400">
                Verlopen
              </span>
            </div>
            <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-500/10 text-yellow-600 dark:text-yellow-400">
                Concept
              </span>
            </div>
            <div className="p-3 rounded-lg bg-muted border">
              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-muted text-muted-foreground">
                Geannuleerd
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}