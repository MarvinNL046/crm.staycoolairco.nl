"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Plus, Search, Calendar, Euro, Building2, TrendingUp, Clock, CheckCircle2, FileSearch, AlertCircle } from "lucide-react";
import Link from "next/link";

interface Deal {
  id: string;
  title: string;
  company: string;
  contact: string;
  value: number;
  stage: "new" | "qualification" | "proposal" | "negotiation" | "closed_won" | "closed_lost";
  probability: number;
  expectedCloseDate: string;
  createdAt: string;
  lastActivity: string;
  products?: string[];
  notes?: string;
}

interface Quote {
  id: string;
  invoice_number: string;
  customer_name: string;
  customer_company: string;
  total_amount: number;
  quote_valid_until: string;
  status: string;
  created_at: string;
  lead?: any;
  contact?: any;
}

export default function DealsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStage, setFilterStage] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"value" | "date" | "probability">("value");
  const supabase = createClient();

  useEffect(() => {
    fetchDeals();
    fetchQuotes();
  }, []);

  const fetchDeals = async () => {
    try {
      setLoading(true);
      // Mock data voor demonstratie
      const mockDeals: Deal[] = [
        {
          id: "1",
          title: "Airco installatie kantoorpand",
          company: "Tech Solutions BV",
          contact: "Anna van der Berg",
          value: 45000,
          stage: "negotiation",
          probability: 75,
          expectedCloseDate: new Date(Date.now() + 604800000).toISOString(),
          createdAt: new Date(Date.now() - 2592000000).toISOString(),
          lastActivity: new Date(Date.now() - 86400000).toISOString(),
          products: ["Split Unit Systeem", "Installatie", "Onderhoudscontract"],
          notes: "Klant vraagt om aanpassing offerte"
        },
        {
          id: "2",
          title: "Onderhoudscontract 5 jaar",
          company: "De Groot Logistics",
          contact: "Peter de Boer",
          value: 12500,
          stage: "proposal",
          probability: 60,
          expectedCloseDate: new Date(Date.now() + 1209600000).toISOString(),
          createdAt: new Date(Date.now() - 864000000).toISOString(),
          lastActivity: new Date(Date.now() - 172800000).toISOString(),
          products: ["Onderhoudscontract", "24/7 Service"]
        },
        {
          id: "3",
          title: "Complete klimaatsysteem nieuwbouw",
          company: "Bouwbedrijf Jansen",
          contact: "Linda Jansen",
          value: 125000,
          stage: "qualification",
          probability: 30,
          expectedCloseDate: new Date(Date.now() + 5184000000).toISOString(),
          createdAt: new Date(Date.now() - 432000000).toISOString(),
          lastActivity: new Date(Date.now() - 259200000).toISOString(),
          products: ["VRF Systeem", "Ventilatie", "Installatie", "Bediening"]
        },
        {
          id: "4",
          title: "Reparatie bestaand systeem",
          company: "Retail Plaza",
          contact: "Mark Hendriks",
          value: 3500,
          stage: "closed_won",
          probability: 100,
          expectedCloseDate: new Date(Date.now() - 172800000).toISOString(),
          createdAt: new Date(Date.now() - 1728000000).toISOString(),
          lastActivity: new Date(Date.now() - 172800000).toISOString(),
          products: ["Reparatie", "Onderdelen"]
        },
        {
          id: "5",
          title: "Airco upgrade vergaderzalen",
          company: "Business Center Zuid",
          contact: "Sarah van Leeuwen",
          value: 28000,
          stage: "new",
          probability: 20,
          expectedCloseDate: new Date(Date.now() + 2592000000).toISOString(),
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          lastActivity: new Date(Date.now() - 3600000).toISOString(),
          products: ["Multi-split systeem", "Installatie"]
        }
      ];
      setDeals(mockDeals);
    } catch (error) {
      console.error("Error fetching deals:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuotes = async () => {
    try {
      const response = await fetch('/api/invoices/open-quotes');
      if (response.ok) {
        const data = await response.json();
        setQuotes(data);
      }
    } catch (error) {
      console.error("Error fetching quotes:", error);
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case "new": return "bg-gray-500";
      case "qualification": return "bg-blue-500";
      case "proposal": return "bg-yellow-500";
      case "negotiation": return "bg-orange-500";
      case "closed_won": return "bg-green-500";
      case "closed_lost": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const getStageLabel = (stage: string) => {
    switch (stage) {
      case "new": return "Nieuw";
      case "qualification": return "Kwalificatie";
      case "proposal": return "Offerte";
      case "negotiation": return "Onderhandeling";
      case "closed_won": return "Gewonnen";
      case "closed_lost": return "Verloren";
      default: return stage;
    }
  };

  const filteredDeals = deals
    .filter(deal => {
      const matchesSearch = 
        deal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deal.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deal.contact.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStage = filterStage === "all" || deal.stage === filterStage;
      
      return matchesSearch && matchesStage;
    })
    .sort((a, b) => {
      if (sortBy === "value") return b.value - a.value;
      if (sortBy === "date") return new Date(b.expectedCloseDate).getTime() - new Date(a.expectedCloseDate).getTime();
      if (sortBy === "probability") return b.probability - a.probability;
      return 0;
    });

  const totalPipelineValue = deals
    .filter(d => !["closed_won", "closed_lost"].includes(d.stage))
    .reduce((sum, deal) => sum + deal.value, 0);

  const weightedPipelineValue = deals
    .filter(d => !["closed_won", "closed_lost"].includes(d.stage))
    .reduce((sum, deal) => sum + (deal.value * deal.probability / 100), 0);

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Deals</h1>
          <p className="text-gray-600 mt-2">Beheer uw verkoopkansen en pipeline</p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nieuwe Deal
        </Button>
      </div>

      {/* Pipeline Summary */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Totale Pipeline Waarde</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">€{totalPipelineValue.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Gewogen Pipeline Waarde</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">€{Math.round(weightedPipelineValue).toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Aantal Open Deals</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{deals.filter(d => !["closed_won", "closed_lost"].includes(d.stage)).length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="mb-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Zoek deals..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex justify-between items-center gap-4">
          <div className="flex gap-2">
            <Button 
              variant={filterStage === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStage("all")}
            >
              Alle
            </Button>
            <Button 
              variant={filterStage === "new" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStage("new")}
            >
              Nieuw
            </Button>
            <Button 
              variant={filterStage === "qualification" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStage("qualification")}
            >
              Kwalificatie
            </Button>
            <Button 
              variant={filterStage === "proposal" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStage("proposal")}
            >
              Offerte
            </Button>
            <Button 
              variant={filterStage === "negotiation" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStage("negotiation")}
            >
              Onderhandeling
            </Button>
          </div>

          <select 
            className="px-3 py-1 border rounded-md text-sm"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
          >
            <option value="value">Sorteer op waarde</option>
            <option value="date">Sorteer op datum</option>
            <option value="probability">Sorteer op kans</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredDeals.map((deal) => (
            <Card key={deal.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-start gap-4">
                      <div className="bg-gray-100 p-3 rounded-full">
                        <ShoppingCart className="h-6 w-6 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{deal.title}</h3>
                          <Badge className={getStageColor(deal.stage)}>
                            {getStageLabel(deal.stage)}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            <span>{deal.company}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Euro className="h-4 w-4" />
                            <span className="font-semibold">€{deal.value.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" />
                            <span>{deal.probability}% kans</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>{new Date(deal.expectedCloseDate).toLocaleDateString('nl-NL')}</span>
                          </div>
                        </div>

                        {deal.products && deal.products.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-3">
                            {deal.products.map((product, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {product}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {deal.notes && (
                          <p className="text-sm text-gray-500 mt-2">{deal.notes}</p>
                        )}

                        <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Laatste activiteit: {new Date(deal.lastActivity).toLocaleDateString('nl-NL')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right ml-4">
                    <p className="text-sm text-gray-500 mb-1">Gewogen waarde</p>
                    <p className="text-lg font-bold text-green-600">
                      €{Math.round(deal.value * deal.probability / 100).toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {filteredDeals.length === 0 && !loading && (
        <div className="text-center py-12">
          <ShoppingCart className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500">Geen deals gevonden</p>
        </div>
      )}

      {/* Open Quotes Section */}
      {quotes.length > 0 && (
        <div className="mt-12">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Openstaande Offertes</h2>
              <p className="text-gray-600 mt-1">Offertes die kunnen worden omgezet in deals</p>
            </div>
            <Link href="/invoicing/new?type=quote">
              <Button variant="outline" className="flex items-center gap-2">
                <FileSearch className="h-4 w-4" />
                Nieuwe Offerte
              </Button>
            </Link>
          </div>

          <div className="space-y-4">
            {quotes.map((quote) => {
              const daysUntilExpiry = quote.quote_valid_until 
                ? Math.ceil((new Date(quote.quote_valid_until).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                : null;
              const isExpiring = daysUntilExpiry !== null && daysUntilExpiry <= 7 && daysUntilExpiry > 0;
              const isExpired = daysUntilExpiry !== null && daysUntilExpiry <= 0;

              return (
                <Card key={quote.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-start gap-4">
                          <div className="bg-blue-100 p-3 rounded-full">
                            <FileSearch className="h-6 w-6 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold">Offerte {quote.invoice_number}</h3>
                              {isExpired && (
                                <Badge className="bg-red-100 text-red-800">Verlopen</Badge>
                              )}
                              {isExpiring && !isExpired && (
                                <Badge className="bg-orange-100 text-orange-800">
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                  {daysUntilExpiry} {daysUntilExpiry === 1 ? 'dag' : 'dagen'}
                                </Badge>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                              <div className="flex items-center gap-2">
                                <Building2 className="h-4 w-4" />
                                <span>{quote.customer_name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Euro className="h-4 w-4" />
                                <span className="font-semibold">€{quote.total_amount.toLocaleString()}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                <span>Geldig tot: {new Date(quote.quote_valid_until).toLocaleDateString('nl-NL')}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                <span>{new Date(quote.created_at).toLocaleDateString('nl-NL')}</span>
                              </div>
                            </div>

                            {quote.customer_company && (
                              <p className="text-sm text-gray-500 mt-2">{quote.customer_company}</p>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <Link href={`/invoicing/${quote.id}`}>
                          <Button variant="outline" size="sm">
                            Bekijken
                          </Button>
                        </Link>
                        {!isExpired && (
                          <Button 
                            size="sm" 
                            className="bg-green-600 hover:bg-green-700"
                            onClick={async () => {
                              if (confirm('Weet je zeker dat je deze offerte wilt omzetten naar een factuur?')) {
                                try {
                                  const response = await fetch(`/api/invoices/${quote.id}/convert`, {
                                    method: 'POST'
                                  });
                                  if (response.ok) {
                                    alert('Offerte is succesvol omgezet naar factuur!');
                                    fetchQuotes();
                                  }
                                } catch (error) {
                                  alert('Er is een fout opgetreden bij het omzetten van de offerte');
                                }
                              }
                            }}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Omzetten
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}