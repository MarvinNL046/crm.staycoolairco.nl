'use client';

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  CreditCard, 
  Users, 
  Target, 
  Calendar,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Crown,
  Zap,
  Building
} from "lucide-react";

interface Tenant {
  id: string;
  name: string;
  subscription_plan: string;
  subscription_status: string;
  monthly_price: number;
  max_users: number;
  max_leads: number;
  subscription_started_at: string;
  subscription_ends_at: string;
  updated_at: string;
}

interface SubscriptionClientProps {
  tenant: Tenant;
  currentUsers: number;
  currentLeads: number;
}

const planDetails = {
  free: {
    name: "Free",
    price: 0,
    icon: Building,
    color: "bg-gray-100 text-gray-800",
    description: "Perfect voor kleine bedrijven"
  },
  starter: {
    name: "Starter",
    price: 19.99,
    icon: Zap,
    color: "bg-blue-100 text-blue-800",
    description: "Ideaal voor groeiende teams"
  },
  professional: {
    name: "Professional",
    price: 49.99,
    icon: Crown,
    color: "bg-purple-100 text-purple-800",
    description: "Voor professionele organisaties"
  },
  enterprise: {
    name: "Enterprise",
    price: 99.99,
    icon: Building,
    color: "bg-gold-100 text-gold-800",
    description: "Voor grote ondernemingen"
  }
};

const statusColors = {
  active: "bg-green-100 text-green-800",
  trial: "bg-yellow-100 text-yellow-800",
  cancelled: "bg-red-100 text-red-800",
  expired: "bg-gray-100 text-gray-800",
  suspended: "bg-orange-100 text-orange-800"
};

const statusIcons = {
  active: CheckCircle,
  trial: Calendar,
  cancelled: XCircle,
  expired: AlertTriangle,
  suspended: AlertTriangle
};

export function SubscriptionClient({ tenant, currentUsers, currentLeads }: SubscriptionClientProps) {
  const [isLoading, setIsLoading] = useState(false);

  const plan = planDetails[tenant.subscription_plan as keyof typeof planDetails];
  const StatusIcon = statusIcons[tenant.subscription_status as keyof typeof statusIcons];
  
  const userUsagePercentage = (currentUsers / tenant.max_users) * 100;
  const leadUsagePercentage = (currentLeads / tenant.max_leads) * 100;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('nl-NL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const daysUntilExpiry = tenant.subscription_ends_at 
    ? Math.ceil((new Date(tenant.subscription_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="space-y-6">
      {/* Current Plan Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <plan.icon className="h-5 w-5" />
                {plan.name} Plan
              </CardTitle>
              <CardDescription>{plan.description}</CardDescription>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">€{tenant.monthly_price}</div>
              <div className="text-sm text-muted-foreground">per maand</div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Badge className={statusColors[tenant.subscription_status as keyof typeof statusColors]}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {tenant.subscription_status.charAt(0).toUpperCase() + tenant.subscription_status.slice(1)}
            </Badge>
            {daysUntilExpiry && (
              <div className="text-sm text-muted-foreground">
                {daysUntilExpiry > 0 
                  ? `Verloopt over ${daysUntilExpiry} dagen`
                  : 'Abonnement verlopen'
                }
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-sm font-medium">Gestart op</div>
              <div className="text-sm text-muted-foreground">
                {formatDate(tenant.subscription_started_at)}
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium">Verloopt op</div>
              <div className="text-sm text-muted-foreground">
                {tenant.subscription_ends_at ? formatDate(tenant.subscription_ends_at) : 'Onbeperkt'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gebruikers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentUsers} / {tenant.max_users}</div>
            <Progress value={userUsagePercentage} className="mt-2" />
            <div className="text-xs text-muted-foreground mt-1">
              {userUsagePercentage.toFixed(1)}% gebruikt
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leads</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentLeads} / {tenant.max_leads}</div>
            <Progress value={leadUsagePercentage} className="mt-2" />
            <div className="text-xs text-muted-foreground mt-1">
              {leadUsagePercentage.toFixed(1)}% gebruikt
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Available Plans */}
      <Card>
        <CardHeader>
          <CardTitle>Beschikbare Plannen</CardTitle>
          <CardDescription>
            Upgrade of downgrade je abonnement op elk moment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(planDetails).map(([key, planData]) => {
              const PlanIcon = planData.icon;
              const isCurrent = key === tenant.subscription_plan;
              
              return (
                <div key={key} className={`border rounded-lg p-4 ${isCurrent ? 'border-primary bg-primary/5' : 'border-border'}`}>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <PlanIcon className="h-5 w-5" />
                      {isCurrent && <Badge variant="secondary">Huidig</Badge>}
                    </div>
                    
                    <div>
                      <div className="font-semibold">{planData.name}</div>
                      <div className="text-2xl font-bold">€{planData.price}</div>
                      <div className="text-xs text-muted-foreground">per maand</div>
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      {planData.description}
                    </div>
                    
                    {!isCurrent && (
                      <Button 
                        variant={planData.price > tenant.monthly_price ? "default" : "outline"} 
                        size="sm" 
                        className="w-full"
                        disabled={isLoading}
                      >
                        {planData.price > tenant.monthly_price ? "Upgrade" : "Downgrade"}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Usage Warnings */}
      {(userUsagePercentage > 80 || leadUsagePercentage > 80) && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <AlertTriangle className="h-5 w-5" />
              Gebruik Waarschuwing
            </CardTitle>
          </CardHeader>
          <CardContent className="text-yellow-700">
            <div className="space-y-2">
              {userUsagePercentage > 80 && (
                <div>Je gebruikt {userUsagePercentage.toFixed(1)}% van je gebruikerslimiet.</div>
              )}
              {leadUsagePercentage > 80 && (
                <div>Je gebruikt {leadUsagePercentage.toFixed(1)}% van je leadslimiet.</div>
              )}
              <div className="text-sm">Overweeg een upgrade om meer capaciteit te krijgen.</div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Billing History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Facturatiegeschiedenis
          </CardTitle>
          <CardDescription>
            Bekijk je betalingsgeschiedenis en facturen
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <div>Geen facturatiegeschiedenis beschikbaar</div>
            <div className="text-sm">Facturen verschijnen hier zodra ze beschikbaar zijn</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}