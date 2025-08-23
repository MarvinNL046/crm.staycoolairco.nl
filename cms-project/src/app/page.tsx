import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, TrendingUp, FileText } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Building2 className="h-12 w-12 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">StayCool CRM</h1>
          </div>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Complete Customer Relationship Management system voor airconditioningbedrijven
          </p>
          <Link href="/crm">
            <Button size="lg" className="text-lg px-8 py-3">
              Open CRM Dashboard
            </Button>
          </Link>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card>
            <CardHeader>
              <Users className="h-8 w-8 text-blue-600 mb-2" />
              <CardTitle>Lead Management</CardTitle>
              <CardDescription>
                Track en beheer prospects van eerste contact tot deal
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader>
              <TrendingUp className="h-8 w-8 text-green-600 mb-2" />
              <CardTitle>Sales Pipeline</CardTitle>
              <CardDescription>
                Visualiseer en optimaliseer je verkoopproces
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader>
              <FileText className="h-8 w-8 text-purple-600 mb-2" />
              <CardTitle>Invoicing</CardTitle>
              <CardDescription>
                Automatische offertes en factuur generatie
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader>
              <Building2 className="h-8 w-8 text-orange-600 mb-2" />
              <CardTitle>Analytics</CardTitle>
              <CardDescription>
                Inzicht in prestaties en groei mogelijkheden
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="text-center">
          <div className="flex gap-4 items-center justify-center">
            <Link href="/auth/login">
              <Button variant="outline">
                Login to CRM
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
