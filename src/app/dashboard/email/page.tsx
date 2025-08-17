"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, Send, Search, Inbox, Archive, Trash2, Clock, Paperclip, Star, Reply, Forward } from "lucide-react";

interface Email {
  id: string;
  from: string;
  fromEmail: string;
  to: string;
  subject: string;
  body: string;
  date: string;
  read: boolean;
  starred: boolean;
  category: "inbox" | "sent" | "draft" | "archived" | "trash";
  attachments?: {
    name: string;
    size: string;
  }[];
  labels?: string[];
}

export default function EmailPage() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("inbox");
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [composing, setComposing] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    fetchEmails();
  }, [selectedCategory]);

  const fetchEmails = async () => {
    try {
      setLoading(true);
      // Mock data voor demonstratie
      const mockEmails: Email[] = [
        {
          id: "1",
          from: "Anna van der Berg",
          fromEmail: "anna@techsolutions.nl",
          to: "info@staycoolairco.nl",
          subject: "Offerte aanvraag airco installatie",
          body: "Beste StayCool team,\n\nWij zijn geïnteresseerd in een complete airco installatie voor ons nieuwe kantoorpand. Kunnen jullie een offerte opstellen?\n\nMet vriendelijke groet,\nAnna van der Berg",
          date: new Date(Date.now() - 3600000).toISOString(),
          read: false,
          starred: true,
          category: "inbox",
          labels: ["Offerte", "Belangrijk"]
        },
        {
          id: "2",
          from: "Service Desk",
          fromEmail: "service@staycoolairco.nl",
          to: "klant@example.com",
          subject: "Onderhoudsafspraak bevestiging",
          body: "Beste klant,\n\nUw onderhoudsafspraak is bevestigd voor maandag 15 juli om 10:00 uur.\n\nMet vriendelijke groet,\nStayCool Service Team",
          date: new Date(Date.now() - 86400000).toISOString(),
          read: true,
          starred: false,
          category: "sent",
          labels: ["Service"]
        },
        {
          id: "3",
          from: "Peter de Boer",
          fromEmail: "peter@deboerinstallaties.nl",
          to: "info@staycoolairco.nl",
          subject: "Technische vraag Split Unit systeem",
          body: "Hallo,\n\nIk heb een technische vraag over het Split Unit systeem model AC-2000. Kunnen jullie mij de specificaties toesturen?\n\nGroeten,\nPeter",
          date: new Date(Date.now() - 172800000).toISOString(),
          read: true,
          starred: false,
          category: "inbox",
          attachments: [
            { name: "technische_tekening.pdf", size: "2.3 MB" }
          ],
          labels: ["Support"]
        },
        {
          id: "4",
          from: "Marketing Team",
          fromEmail: "marketing@staycoolairco.nl",
          to: "all@staycoolairco.nl",
          subject: "Nieuwe zomer campagne 2024",
          body: "Team,\n\nHierbij de details van onze nieuwe zomer campagne...",
          date: new Date(Date.now() - 259200000).toISOString(),
          read: true,
          starred: false,
          category: "archived",
          labels: ["Marketing", "Intern"]
        },
        {
          id: "5",
          from: "Automatisch Systeem",
          fromEmail: "noreply@staycoolairco.nl",
          to: "admin@staycoolairco.nl",
          subject: "[CONCEPT] Maandelijkse nieuwsbrief",
          body: "Dit is een concept van de maandelijkse nieuwsbrief...",
          date: new Date(Date.now() - 7200000).toISOString(),
          read: false,
          starred: false,
          category: "draft",
          labels: ["Nieuwsbrief"]
        }
      ];
      
      setEmails(mockEmails.filter(email => email.category === selectedCategory));
    } catch (error) {
      console.error("Error fetching emails:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEmails = emails.filter(email => 
    email.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    email.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
    email.body.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCategoryCount = (category: string) => {
    // In real app, this would come from the API
    const counts: any = {
      inbox: 12,
      sent: 45,
      draft: 3,
      archived: 128,
      trash: 7
    };
    return counts[category] || 0;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) return "Minder dan een uur geleden";
    if (hours < 24) return `${hours} uur geleden`;
    if (hours < 48) return "Gisteren";
    return date.toLocaleDateString('nl-NL');
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">E-mail</h1>
          <p className="text-gray-600 mt-2">Beheer uw e-mailcommunicatie</p>
        </div>
        <Button 
          className="flex items-center gap-2"
          onClick={() => setComposing(true)}
        >
          <Send className="h-4 w-4" />
          Nieuwe E-mail
        </Button>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Sidebar */}
        <div className="col-span-3">
          <Card>
            <CardContent className="p-4">
              <nav className="space-y-1">
                <Button
                  variant={selectedCategory === "inbox" ? "default" : "ghost"}
                  className="w-full justify-between"
                  onClick={() => setSelectedCategory("inbox")}
                >
                  <span className="flex items-center gap-2">
                    <Inbox className="h-4 w-4" />
                    Inbox
                  </span>
                  <Badge variant="secondary">{getCategoryCount("inbox")}</Badge>
                </Button>
                <Button
                  variant={selectedCategory === "sent" ? "default" : "ghost"}
                  className="w-full justify-between"
                  onClick={() => setSelectedCategory("sent")}
                >
                  <span className="flex items-center gap-2">
                    <Send className="h-4 w-4" />
                    Verzonden
                  </span>
                  <Badge variant="secondary">{getCategoryCount("sent")}</Badge>
                </Button>
                <Button
                  variant={selectedCategory === "draft" ? "default" : "ghost"}
                  className="w-full justify-between"
                  onClick={() => setSelectedCategory("draft")}
                >
                  <span className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Concepten
                  </span>
                  <Badge variant="secondary">{getCategoryCount("draft")}</Badge>
                </Button>
                <Button
                  variant={selectedCategory === "archived" ? "default" : "ghost"}
                  className="w-full justify-between"
                  onClick={() => setSelectedCategory("archived")}
                >
                  <span className="flex items-center gap-2">
                    <Archive className="h-4 w-4" />
                    Archief
                  </span>
                  <Badge variant="secondary">{getCategoryCount("archived")}</Badge>
                </Button>
                <Button
                  variant={selectedCategory === "trash" ? "default" : "ghost"}
                  className="w-full justify-between"
                  onClick={() => setSelectedCategory("trash")}
                >
                  <span className="flex items-center gap-2">
                    <Trash2 className="h-4 w-4" />
                    Prullenbak
                  </span>
                  <Badge variant="secondary">{getCategoryCount("trash")}</Badge>
                </Button>
              </nav>

              <div className="mt-6 pt-6 border-t">
                <p className="text-sm font-semibold mb-2">Labels</p>
                <div className="space-y-1">
                  <Badge variant="outline" className="w-full justify-start">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-2" />
                    Offerte
                  </Badge>
                  <Badge variant="outline" className="w-full justify-start">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                    Service
                  </Badge>
                  <Badge variant="outline" className="w-full justify-start">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mr-2" />
                    Marketing
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Email List */}
        <div className="col-span-9">
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Zoek e-mails..."
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
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {filteredEmails.map((email) => (
                    <div
                      key={email.id}
                      className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                        !email.read ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => setSelectedEmail(email)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <button 
                            className="mt-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Toggle star
                            }}
                          >
                            <Star className={`h-4 w-4 ${email.starred ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`} />
                          </button>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <p className={`${!email.read ? 'font-semibold' : ''}`}>
                                {email.from}
                              </p>
                              <span className="text-sm text-gray-500">{formatDate(email.date)}</span>
                            </div>
                            <p className={`text-sm ${!email.read ? 'font-semibold' : ''} mb-1`}>
                              {email.subject}
                            </p>
                            <p className="text-sm text-gray-600 truncate">
                              {email.body.split('\n')[0]}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              {email.attachments && (
                                <span className="flex items-center gap-1 text-xs text-gray-500">
                                  <Paperclip className="h-3 w-3" />
                                  {email.attachments.length}
                                </span>
                              )}
                              {email.labels?.map((label, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {label}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {filteredEmails.length === 0 && !loading && (
            <div className="text-center py-12">
              <Mail className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500">Geen e-mails gevonden</p>
            </div>
          )}
        </div>
      </div>

      {/* Email Detail Modal */}
      {selectedEmail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-auto">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{selectedEmail.subject}</CardTitle>
                  <CardDescription>
                    Van: {selectedEmail.from} ({selectedEmail.fromEmail})
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedEmail(null)}
                >
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <pre className="whitespace-pre-wrap font-sans">{selectedEmail.body}</pre>
              </div>
              <div className="flex gap-2 mt-6 pt-6 border-t">
                <Button className="flex items-center gap-2">
                  <Reply className="h-4 w-4" />
                  Beantwoorden
                </Button>
                <Button variant="outline" className="flex items-center gap-2">
                  <Forward className="h-4 w-4" />
                  Doorsturen
                </Button>
                <Button variant="outline" className="flex items-center gap-2">
                  <Archive className="h-4 w-4" />
                  Archiveren
                </Button>
                <Button variant="outline" className="flex items-center gap-2 text-red-600 hover:text-red-700">
                  <Trash2 className="h-4 w-4" />
                  Verwijderen
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}