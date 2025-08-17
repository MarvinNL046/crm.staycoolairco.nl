"use client"

import * as React from "react"
import { Line, Bar, Pie, Area, LineChart, BarChart, PieChart, AreaChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts"
import { cn } from "@/lib/utils"

interface ChartContainerProps {
  children: React.ReactElement
  className?: string
}

export function ChartContainer({
  children,
  className,
}: ChartContainerProps) {
  return (
    <div className={cn("h-[350px] w-full", className)}>
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  )
}

interface ChartTooltipProps {
  active?: boolean
  payload?: any[]
  label?: string
}

export function ChartTooltip({
  active,
  payload,
  label,
}: ChartTooltipProps) {
  if (!active || !payload) return null

  return (
    <div className="rounded-lg border bg-background p-2 shadow-sm">
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col">
          <span className="text-[0.70rem] uppercase text-muted-foreground">
            {label}
          </span>
          <span className="font-bold text-muted-foreground">
            {payload[0]?.value}
          </span>
        </div>
      </div>
    </div>
  )
}

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "hsl(var(--chart-1))",
  },
  mobile: {
    label: "Mobile",
    color: "hsl(var(--chart-2))",
  },
} satisfies Record<string, { label: string; color: string }>

export {
  Line,
  Bar,
  Pie,
  Area,
  LineChart,
  BarChart,
  PieChart,
  AreaChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  chartConfig,
}