"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, Search, Building2 } from "lucide-react";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  status: "active" | "inactive" | "prospect";
  created_at: string;
  total_deals?: number;
  total_value?: number;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const supabase = createClient();

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      // Voor nu gebruiken we mock data omdat de customers tabel nog niet bestaat
      const mockCustomers: Customer[] = [
        {
          id: "1",
          name: "Jan de Vries",
          email: "jan@example.com",
          phone: "+31612345678",
          company: "De Vries BV",
          status: "active",
          created_at: new Date().toISOString(),
          total_deals: 3,
          total_value: 15000
        },
        {
          id: "2",
          name: "Marie Jansen",
          email: "marie@example.com",
          phone: "+31687654321",
          status: "prospect",
          created_at: new Date().toISOString(),
          total_deals: 0,
          total_value: 0
        }
      ];
      setCustomers(mockCustomers);
    } catch (error) {
      console.error("Error fetching customers:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(customer => 
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.company?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-500";
      case "inactive": return "bg-gray-500";
      case "prospect": return "bg-blue-500";
      default: return "bg-gray-500";
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Klanten</h1>
          <p className="text-gray-600 mt-2">Beheer uw klanten en prospects</p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nieuwe Klant
        </Button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Zoek klanten..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCustomers.map((customer) => (
            <Card key={customer.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="bg-gray-100 p-3 rounded-full">
                      <Users className="h-6 w-6 text-gray-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{customer.name}</CardTitle>
                      <CardDescription>{customer.email}</CardDescription>
                    </div>
                  </div>
                  <Badge className={getStatusColor(customer.status)}>
                    {customer.status === "active" ? "Actief" : 
                     customer.status === "prospect" ? "Prospect" : "Inactief"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {customer.company && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Building2 className="h-4 w-4" />
                      <span>{customer.company}</span>
                    </div>
                  )}
                  {customer.phone && (
                    <div className="text-gray-600">
                      📞 {customer.phone}
                    </div>
                  )}
                  <div className="pt-3 border-t flex justify-between text-gray-600">
                    <span>{customer.total_deals || 0} deals</span>
                    <span className="font-semibold">
                      €{(customer.total_value || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {filteredCustomers.length === 0 && !loading && (
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500">Geen klanten gevonden</p>
        </div>
      )}
    </div>
  );
}