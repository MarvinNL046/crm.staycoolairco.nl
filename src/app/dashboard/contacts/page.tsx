"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, Search, Mail, Phone, Building2 } from "lucide-react";

interface Contact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  position?: string;
  type: "lead" | "customer" | "supplier" | "partner";
  tags?: string[];
  last_contact?: string;
  created_at: string;
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const supabase = createClient();

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      // Mock data voor demonstratie
      const mockContacts: Contact[] = [
        {
          id: "1",
          name: "Anna van der Berg",
          email: "anna@example.com",
          phone: "+31612345678",
          company: "Tech Solutions BV",
          position: "Directeur",
          type: "customer",
          tags: ["VIP", "Airco installatie"],
          last_contact: new Date(Date.now() - 86400000).toISOString(),
          created_at: new Date().toISOString()
        },
        {
          id: "2",
          name: "Peter de Boer",
          email: "peter@example.com",
          phone: "+31687654321",
          company: "De Boer Installaties",
          position: "Inkoper",
          type: "supplier",
          tags: ["Leverancier", "Onderdelen"],
          last_contact: new Date(Date.now() - 172800000).toISOString(),
          created_at: new Date().toISOString()
        },
        {
          id: "3",
          name: "Linda Jansen",
          email: "linda@example.com",
          phone: "+31634567890",
          company: "Jansen & Co",
          position: "Manager",
          type: "lead",
          tags: ["Nieuwe lead", "Interesse"],
          last_contact: new Date(Date.now() - 3600000).toISOString(),
          created_at: new Date().toISOString()
        },
        {
          id: "4",
          name: "Robert van Dijk",
          email: "robert@example.com",
          company: "Partner Solutions",
          position: "Business Development",
          type: "partner",
          tags: ["Strategisch partner"],
          created_at: new Date().toISOString()
        }
      ];
      setContacts(mockContacts);
    } catch (error) {
      console.error("Error fetching contacts:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = 
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.position?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === "all" || contact.type === filterType;
    
    return matchesSearch && matchesType;
  });

  const getTypeColor = (type: string) => {
    switch (type) {
      case "customer": return "bg-green-500";
      case "lead": return "bg-blue-500";
      case "supplier": return "bg-purple-500";
      case "partner": return "bg-orange-500";
      default: return "bg-gray-500";
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "customer": return "Klant";
      case "lead": return "Lead";
      case "supplier": return "Leverancier";
      case "partner": return "Partner";
      default: return type;
    }
  };

  const getLastContactText = (lastContact?: string) => {
    if (!lastContact) return "Nog geen contact";
    
    const date = new Date(lastContact);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) return "Minder dan een uur geleden";
    if (diffHours < 24) return `${diffHours} uur geleden`;
    if (diffHours < 48) return "Gisteren";
    return `${Math.floor(diffHours / 24)} dagen geleden`;
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Contacten</h1>
          <p className="text-gray-600 mt-2">Beheer al uw zakelijke contacten</p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nieuw Contact
        </Button>
      </div>

      <div className="mb-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Zoek contacten..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          <Button 
            variant={filterType === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterType("all")}
          >
            Alle
          </Button>
          <Button 
            variant={filterType === "customer" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterType("customer")}
          >
            Klanten
          </Button>
          <Button 
            variant={filterType === "lead" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterType("lead")}
          >
            Leads
          </Button>
          <Button 
            variant={filterType === "supplier" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterType("supplier")}
          >
            Leveranciers
          </Button>
          <Button 
            variant={filterType === "partner" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterType("partner")}
          >
            Partners
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredContacts.map((contact) => (
            <Card key={contact.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="bg-gray-100 p-3 rounded-full">
                      <Users className="h-6 w-6 text-gray-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{contact.name}</CardTitle>
                      <CardDescription>{contact.position || "Geen functie"}</CardDescription>
                    </div>
                  </div>
                  <Badge className={getTypeColor(contact.type)}>
                    {getTypeLabel(contact.type)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {contact.company && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Building2 className="h-4 w-4" />
                      <span>{contact.company}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail className="h-4 w-4" />
                    <span>{contact.email}</span>
                  </div>
                  {contact.phone && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="h-4 w-4" />
                      <span>{contact.phone}</span>
                    </div>
                  )}
                  {contact.tags && contact.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-2">
                      {contact.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <div className="pt-3 border-t text-gray-500 text-xs">
                    Laatste contact: {getLastContactText(contact.last_contact)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {filteredContacts.length === 0 && !loading && (
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500">Geen contacten gevonden</p>
        </div>
      )}
    </div>
  );
}