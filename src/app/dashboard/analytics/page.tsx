"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Users, Euro, ShoppingCart, Calendar, BarChart3, PieChart, Activity, Target } from "lucide-react";

interface AnalyticsData {
  revenue: {
    current: number;
    previous: number;
    growth: number;
  };
  customers: {
    total: number;
    new: number;
    growth: number;
  };
  deals: {
    total: number;
    won: number;
    lost: number;
    pending: number;
    averageValue: number;
  };
  leads: {
    total: number;
    converted: number;
    conversionRate: number;
  };
  monthlyRevenue: {
    month: string;
    revenue: number;
  }[];
  topProducts: {
    name: string;
    sales: number;
    revenue: number;
  }[];
}

export default function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("month");
  const supabase = createClient();

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      // Mock data voor demonstratie
      const mockData: AnalyticsData = {
        revenue: {
          current: 125000,
          previous: 98000,
          growth: 27.55
        },
        customers: {
          total: 342,
          new: 28,
          growth: 8.9
        },
        deals: {
          total: 156,
          won: 89,
          lost: 32,
          pending: 35,
          averageValue: 3400
        },
        leads: {
          total: 234,
          converted: 89,
          conversionRate: 38.03
        },
        monthlyRevenue: [
          { month: "Jan", revenue: 82000 },
          { month: "Feb", revenue: 91000 },
          { month: "Mrt", revenue: 98000 },
          { month: "Apr", revenue: 105000 },
          { month: "Mei", revenue: 118000 },
          { month: "Jun", revenue: 125000 }
        ],
        topProducts: [
          { name: "Airco Installatie Compleet", sales: 45, revenue: 67500 },
          { name: "Onderhoud Contract", sales: 120, revenue: 24000 },
          { name: "Reparatie Service", sales: 89, revenue: 13350 },
          { name: "Split Unit Systeem", sales: 34, revenue: 23800 },
          { name: "Ventilatie Upgrade", sales: 28, revenue: 16800 }
        ]
      };
      setAnalyticsData(mockData);
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!analyticsData) {
    return <div className="text-center py-12">Geen data beschikbaar</div>;
  }

  const StatCard = ({ title, value, change, icon: Icon, prefix = "" }: any) => (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardDescription>{title}</CardDescription>
          <Icon className="h-4 w-4 text-gray-600" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline justify-between">
          <h2 className="text-2xl font-bold">
            {prefix}{typeof value === 'number' ? value.toLocaleString() : value}
          </h2>
          {change !== undefined && (
            <div className={`flex items-center gap-1 text-sm ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {change >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              <span>{Math.abs(change)}%</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-2">Overzicht van uw bedrijfsprestaties</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant={dateRange === "week" ? "default" : "outline"}
            size="sm"
            onClick={() => setDateRange("week")}
          >
            Week
          </Button>
          <Button 
            variant={dateRange === "month" ? "default" : "outline"}
            size="sm"
            onClick={() => setDateRange("month")}
          >
            Maand
          </Button>
          <Button 
            variant={dateRange === "quarter" ? "default" : "outline"}
            size="sm"
            onClick={() => setDateRange("quarter")}
          >
            Kwartaal
          </Button>
          <Button 
            variant={dateRange === "year" ? "default" : "outline"}
            size="sm"
            onClick={() => setDateRange("year")}
          >
            Jaar
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard 
          title="Totale Omzet" 
          value={analyticsData.revenue.current} 
          change={analyticsData.revenue.growth} 
          icon={Euro}
          prefix="€"
        />
        <StatCard 
          title="Totaal Klanten" 
          value={analyticsData.customers.total} 
          change={analyticsData.customers.growth} 
          icon={Users}
        />
        <StatCard 
          title="Conversie Ratio" 
          value={`${analyticsData.leads.conversionRate.toFixed(1)}%`} 
          icon={Target}
        />
        <StatCard 
          title="Gem. Deal Waarde" 
          value={analyticsData.deals.averageValue} 
          icon={ShoppingCart}
          prefix="€"
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2 mb-8">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Maandelijkse Omzet
            </CardTitle>
            <CardDescription>Omzet ontwikkeling per maand</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-end justify-between gap-2">
              {analyticsData.monthlyRevenue.map((month, index) => {
                const height = (month.revenue / 125000) * 100;
                return (
                  <div key={index} className="flex-1 flex flex-col items-center gap-2">
                    <div 
                      className="w-full bg-blue-500 rounded-t transition-all duration-300 hover:bg-blue-600"
                      style={{ height: `${height}%` }}
                    />
                    <span className="text-xs text-gray-600">{month.month}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Deal Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Deal Status
            </CardTitle>
            <CardDescription>Verdeling van deals</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full" />
                  <span className="text-sm">Gewonnen</span>
                </div>
                <span className="font-semibold">{analyticsData.deals.won}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                  <span className="text-sm">In behandeling</span>
                </div>
                <span className="font-semibold">{analyticsData.deals.pending}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full" />
                  <span className="text-sm">Verloren</span>
                </div>
                <span className="font-semibold">{analyticsData.deals.lost}</span>
              </div>
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">Totaal</span>
                  <span className="font-bold">{analyticsData.deals.total}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Products */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Top Producten/Diensten
          </CardTitle>
          <CardDescription>Best verkopende producten deze periode</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analyticsData.topProducts.map((product, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-semibold text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-gray-500">{product.sales} verkocht</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">€{product.revenue.toLocaleString()}</p>
                  <p className="text-sm text-gray-500">
                    {((product.revenue / analyticsData.revenue.current) * 100).toFixed(1)}% van omzet
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}