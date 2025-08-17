"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Send, Search, Phone, Users, Clock, CheckCheck, Check, MoreVertical, Smile } from "lucide-react";

interface Conversation {
  id: string;
  contact: {
    name: string;
    phone: string;
    avatar?: string;
  };
  lastMessage: {
    text: string;
    timestamp: string;
    isRead: boolean;
    isSent: boolean;
  };
  unreadCount: number;
  type: "sms" | "whatsapp";
}

interface Message {
  id: string;
  text: string;
  timestamp: string;
  isSent: boolean;
  isDelivered?: boolean;
  isRead?: boolean;
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [messageText, setMessageText] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const supabase = createClient();

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      // Mock data voor demonstratie
      const mockConversations: Conversation[] = [
        {
          id: "1",
          contact: {
            name: "Anna van der Berg",
            phone: "+31612345678"
          },
          lastMessage: {
            text: "Bedankt voor de snelle service!",
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            isRead: false,
            isSent: false
          },
          unreadCount: 2,
          type: "whatsapp"
        },
        {
          id: "2",
          contact: {
            name: "Peter de Boer",
            phone: "+31687654321"
          },
          lastMessage: {
            text: "De monteur komt morgen om 10:00",
            timestamp: new Date(Date.now() - 7200000).toISOString(),
            isRead: true,
            isSent: true
          },
          unreadCount: 0,
          type: "sms"
        },
        {
          id: "3",
          contact: {
            name: "Linda Jansen",
            phone: "+31634567890"
          },
          lastMessage: {
            text: "Is er nog een afspraak mogelijk deze week?",
            timestamp: new Date(Date.now() - 86400000).toISOString(),
            isRead: true,
            isSent: false
          },
          unreadCount: 0,
          type: "whatsapp"
        },
        {
          id: "4",
          contact: {
            name: "Mark Hendriks",
            phone: "+31623456789"
          },
          lastMessage: {
            text: "Offerte ontvangen, ziet er goed uit",
            timestamp: new Date(Date.now() - 172800000).toISOString(),
            isRead: true,
            isSent: false
          },
          unreadCount: 0,
          type: "sms"
        },
        {
          id: "5",
          contact: {
            name: "Sarah van Leeuwen",
            phone: "+31656789012"
          },
          lastMessage: {
            text: "Kunnen jullie ook op zaterdag?",
            timestamp: new Date(Date.now() - 1800000).toISOString(),
            isRead: false,
            isSent: false
          },
          unreadCount: 1,
          type: "whatsapp"
        }
      ];
      setConversations(mockConversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    // Mock messages voor demonstratie
    const mockMessages: Message[] = [
      {
        id: "1",
        text: "Goedemiddag, ik heb een vraag over airco onderhoud",
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        isSent: false
      },
      {
        id: "2",
        text: "Goedemiddag! Natuurlijk, waar kan ik u mee helpen?",
        timestamp: new Date(Date.now() - 7000000).toISOString(),
        isSent: true,
        isDelivered: true,
        isRead: true
      },
      {
        id: "3",
        text: "Mijn airco maakt een vreemd geluid",
        timestamp: new Date(Date.now() - 6800000).toISOString(),
        isSent: false
      },
      {
        id: "4",
        text: "Dat klinkt als een probleem met de ventilator. We kunnen een monteur langssturen om dit te bekijken.",
        timestamp: new Date(Date.now() - 6600000).toISOString(),
        isSent: true,
        isDelivered: true,
        isRead: true
      },
      {
        id: "5",
        text: "Wanneer zou dat kunnen?",
        timestamp: new Date(Date.now() - 6400000).toISOString(),
        isSent: false
      },
      {
        id: "6",
        text: "We hebben morgen om 10:00 of 14:00 nog ruimte. Wat past u het beste?",
        timestamp: new Date(Date.now() - 6200000).toISOString(),
        isSent: true,
        isDelivered: true,
        isRead: false
      }
    ];
    setMessages(mockMessages);
  };

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = 
      conv.contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.contact.phone.includes(searchTerm);
    
    const matchesType = filterType === "all" || conv.type === filterType;
    
    return matchesSearch && matchesType;
  });

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}u`;
    if (days === 1) return "Gisteren";
    if (days < 7) return `${days}d`;
    return date.toLocaleDateString('nl-NL');
  };

  const sendMessage = () => {
    if (!messageText.trim()) return;
    
    const newMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      timestamp: new Date().toISOString(),
      isSent: true,
      isDelivered: false,
      isRead: false
    };
    
    setMessages([...messages, newMessage]);
    setMessageText("");
    
    // Simulate delivery after 1 second
    setTimeout(() => {
      setMessages(prev => prev.map(msg => 
        msg.id === newMessage.id 
          ? { ...msg, isDelivered: true }
          : msg
      ));
    }, 1000);
  };

  return (
    <div className="container mx-auto py-8 h-[calc(100vh-100px)]">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Berichten</h1>
          <p className="text-gray-600 mt-2">SMS en WhatsApp communicatie</p>
        </div>
        <Button className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Nieuw Bericht
        </Button>
      </div>

      <div className="grid grid-cols-12 gap-4 h-[calc(100%-120px)]">
        {/* Conversations List */}
        <div className="col-span-4 flex flex-col h-full">
          <div className="space-y-3 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Zoek gesprekken..."
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
                variant={filterType === "sms" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType("sms")}
              >
                SMS
              </Button>
              <Button 
                variant={filterType === "whatsapp" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType("whatsapp")}
              >
                WhatsApp
              </Button>
            </div>
          </div>

          <Card className="flex-1 overflow-hidden">
            <CardContent className="p-0 h-full overflow-y-auto">
              {loading ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredConversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                        selectedConversation?.id === conversation.id ? 'bg-blue-50' : ''
                      } ${conversation.unreadCount > 0 ? 'bg-blue-50/50' : ''}`}
                      onClick={() => setSelectedConversation(conversation)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="bg-gray-200 rounded-full p-3">
                          <Users className="h-6 w-6 text-gray-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className={`font-medium truncate ${
                              conversation.unreadCount > 0 ? 'font-semibold' : ''
                            }`}>
                              {conversation.contact.name}
                            </p>
                            <span className="text-xs text-gray-500">
                              {formatTimestamp(conversation.lastMessage.timestamp)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <p className={`text-sm text-gray-600 truncate ${
                              conversation.unreadCount > 0 ? 'font-semibold text-gray-900' : ''
                            }`}>
                              {conversation.lastMessage.isSent && (
                                <span className="mr-1">
                                  {conversation.lastMessage.isRead ? (
                                    <CheckCheck className="inline h-4 w-4 text-blue-500" />
                                  ) : (
                                    <Check className="inline h-4 w-4 text-gray-400" />
                                  )}
                                </span>
                              )}
                              {conversation.lastMessage.text}
                            </p>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-xs">
                                {conversation.type === "whatsapp" ? "WA" : "SMS"}
                              </Badge>
                              {conversation.unreadCount > 0 && (
                                <Badge className="bg-blue-500 text-white text-xs px-2 py-0">
                                  {conversation.unreadCount}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Message Thread */}
        <div className="col-span-8">
          {selectedConversation ? (
            <Card className="h-full flex flex-col">
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-gray-200 rounded-full p-2">
                      <Users className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{selectedConversation.contact.name}</CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <Phone className="h-3 w-3" />
                        {selectedConversation.contact.phone}
                      </CardDescription>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="flex-1 overflow-y-auto p-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.isSent ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg px-4 py-2 ${
                          message.isSent
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="text-sm">{message.text}</p>
                        <div className={`flex items-center gap-1 mt-1 text-xs ${
                          message.isSent ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          <Clock className="h-3 w-3" />
                          <span>{new Date(message.timestamp).toLocaleTimeString('nl-NL', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}</span>
                          {message.isSent && (
                            <span className="ml-1">
                              {message.isRead ? (
                                <CheckCheck className="h-3 w-3" />
                              ) : message.isDelivered ? (
                                <CheckCheck className="h-3 w-3 opacity-60" />
                              ) : (
                                <Check className="h-3 w-3" />
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>

              <div className="border-t p-4">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm">
                    <Smile className="h-5 w-5" />
                  </Button>
                  <input
                    type="text"
                    placeholder="Type een bericht..."
                    className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  />
                  <Button onClick={sendMessage}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="h-full flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500">Selecteer een gesprek om te beginnen</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}