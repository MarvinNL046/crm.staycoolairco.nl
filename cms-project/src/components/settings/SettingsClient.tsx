'use client';

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Copy,
  Eye,
  EyeOff,
  Webhook,
  Settings,
  Code,
  TestTube,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  CreditCard,
  Users,
  Target,
  Calendar,
  Crown,
  Zap,
  Building,
  AlertTriangle,
  Mail,
  Plus,
  Edit,
  Trash2,
  Save,
  X
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

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  template_type: string;
  html_content: string;
  text_content?: string;
  variables?: Record<string, string>;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface SettingsClientProps {
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
  cancelled: AlertCircle,
  expired: AlertTriangle,
  suspended: AlertTriangle
};

const emailTemplateTypes = {
  lead_welcome: { name: 'Welkom Nieuwe Lead', description: 'Automatisch verzonden naar nieuwe leads' },
  appointment_confirmation: { name: 'Afspraak Bevestiging', description: 'Bevestiging van gemaakte afspraken' },
  invoice_sent: { name: 'Factuur Verzonden', description: 'Notificatie bij verzonden facturen' },
  quote_sent: { name: 'Offerte Verzonden', description: 'Notificatie bij verzonden offertes' },
  follow_up: { name: 'Follow-up Email', description: 'Follow-up communicatie met klanten' }
};

export function SettingsClient({ tenant, currentUsers, currentLeads }: SettingsClientProps) {
  const [webhookSecret, setWebhookSecret] = useState('wh_secret_abc123xyz789');
  const [showSecret, setShowSecret] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Email Templates State
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [templateForm, setTemplateForm] = useState({
    name: '',
    subject: '',
    template_type: '',
    html_content: '',
    text_content: '',
    is_default: false,
    is_active: true
  });

  const webhookUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://crm.staycoolairco.nl'}/api/webhook/leads`;

  const plan = planDetails[tenant.subscription_plan as keyof typeof planDetails];
  const StatusIcon = statusIcons[tenant.subscription_status as keyof typeof statusIcons];
  
  const userUsagePercentage = (currentUsers / tenant.max_users) * 100;
  const leadUsagePercentage = (currentLeads / tenant.max_leads) * 100;

  // Load email templates
  useEffect(() => {
    async function loadEmailTemplates() {
      try {
        const response = await fetch('/api/email-templates');
        if (response.ok) {
          const data = await response.json();
          setEmailTemplates(data.templates);
        }
      } catch (error) {
        console.error('Error loading email templates:', error);
      } finally {
        setTemplatesLoading(false);
      }
    }

    loadEmailTemplates();
  }, []);

  // Email template handlers
  const openCreateTemplateDialog = () => {
    setTemplateForm({
      name: '',
      subject: '',
      template_type: '',
      html_content: '',
      text_content: '',
      is_default: false,
      is_active: true
    });
    setEditingTemplate(null);
    setIsTemplateDialogOpen(true);
  };

  const openEditTemplateDialog = (template: EmailTemplate) => {
    setTemplateForm({
      name: template.name,
      subject: template.subject,
      template_type: template.template_type,
      html_content: template.html_content,
      text_content: template.text_content || '',
      is_default: template.is_default,
      is_active: template.is_active
    });
    setEditingTemplate(template);
    setIsTemplateDialogOpen(true);
  };

  const saveEmailTemplate = async () => {
    try {
      const url = editingTemplate ? `/api/email-templates/${editingTemplate.id}` : '/api/email-templates';
      const method = editingTemplate ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(templateForm)
      });

      if (response.ok) {
        const data = await response.json();
        if (editingTemplate) {
          setEmailTemplates(prev => prev.map(t => t.id === editingTemplate.id ? data.template : t));
        } else {
          setEmailTemplates(prev => [...prev, data.template]);
        }
        setIsTemplateDialogOpen(false);
      }
    } catch (error) {
      console.error('Error saving template:', error);
    }
  };

  const deleteEmailTemplate = async (template: EmailTemplate) => {
    if (confirm('Weet je zeker dat je deze template wilt verwijderen?')) {
      try {
        const response = await fetch(`/api/email-templates/${template.id}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          setEmailTemplates(prev => prev.filter(t => t.id !== template.id));
        }
      } catch (error) {
        console.error('Error deleting template:', error);
      }
    }
  };

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

  const generateNewSecret = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const newSecret = 'wh_secret_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      setWebhookSecret(newSecret);
      setIsGenerating(false);
    }, 1000);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const testWebhook = async () => {
    try {
      const response = await fetch('/api/webhook/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Test Contact',
          email: 'test@example.com',
          phone: '+31 6 1234 5678',
          company: 'Test Company',
          message: 'This is a test webhook submission',
          source: 'webhook_test'
        })
      });

      if (response.ok) {
        setTestResult('success');
      } else {
        setTestResult('error');
      }
    } catch (error) {
      setTestResult('error');
    }

    setTimeout(() => setTestResult(null), 3000);
  };

  const htmlFormExample = `<!-- Contact Form Example for StayCool Air Conditioning -->
<form action="${webhookUrl}" method="POST">
  <input type="text" name="name" placeholder="Your Name" required>
  <input type="email" name="email" placeholder="Your Email" required>
  <input type="tel" name="phone" placeholder="Your Phone">
  <input type="text" name="company" placeholder="Company Name">
  <textarea name="message" placeholder="Tell us about your air conditioning needs"></textarea>
  <input type="hidden" name="source" value="staycool_website">
  <button type="submit">Request Quote</button>
</form>`;

  const jsExample = `// JavaScript Fetch Example for StayCool
const formData = {
  name: 'Jan Janssen',
  email: 'jan@bakkerijjanssen.nl',
  phone: '+31 6 1234 5678',
  company: 'Bakkerij Janssen',
  message: 'We need air conditioning for our bakery, can you provide a quote?',
  source: 'staycool_website'
};

fetch('${webhookUrl}', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Webhook-Signature': 'your_signature_here'
  },
  body: JSON.stringify(formData)
})
.then(response => response.json())
.then(data => console.log('Lead created:', data));`;

  const curlExample = `# cURL Example for StayCool webhook
curl -X POST ${webhookUrl} \\
  -H "Content-Type: application/json" \\
  -H "X-Webhook-Signature: your_signature_here" \\
  -d '{
    "name": "Jan Janssen",
    "email": "jan@bakkerijjanssen.nl",
    "phone": "+31 6 1234 5678",
    "company": "Bakkerij Janssen",
    "message": "We need air conditioning for our bakery, can you provide a quote?",
    "source": "staycool_website"
  }'`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Instellingen</h1>
          <p className="text-muted-foreground">
            Beheer je abonnement, configureer integraties en instellingen
          </p>
        </div>
      </div>

      <Tabs defaultValue="subscription" className="space-y-6">
        <TabsList>
          <TabsTrigger value="subscription" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Abonnement
          </TabsTrigger>
          <TabsTrigger value="email-templates" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email Templates
          </TabsTrigger>
          <TabsTrigger value="webhooks" className="flex items-center gap-2">
            <Webhook className="h-4 w-4" />
            Webhooks
          </TabsTrigger>
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Algemeen
          </TabsTrigger>
        </TabsList>

        {/* Subscription Tab */}
        <TabsContent value="subscription" className="space-y-6">
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

          {/* Available Plans */}
          <Card>
            <CardHeader>
              <CardTitle>Beschikbare Plannen</CardTitle>
              <CardDescription>
                Neem contact op om je abonnement te wijzigen
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
                          <Button variant="outline" size="sm" className="w-full">
                            Contact
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Templates Tab */}
        <TabsContent value="email-templates" className="space-y-6">
          {/* Header with Add Button */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Email Templates</h3>
              <p className="text-sm text-muted-foreground">
                Beheer je email templates voor automatische communicatie
              </p>
            </div>
            <Button onClick={openCreateTemplateDialog} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nieuwe Template
            </Button>
          </div>

          {/* Templates List */}
          <div className="grid gap-4">
            {templatesLoading ? (
              <Card>
                <CardContent className="p-6">
                  <div className="text-center">Laden...</div>
                </CardContent>
              </Card>
            ) : emailTemplates.length === 0 ? (
              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Geen templates gevonden</h3>
                    <p className="text-muted-foreground mb-4">
                      Maak je eerste email template om te beginnen met geautomatiseerde communicatie.
                    </p>
                    <Button onClick={openCreateTemplateDialog}>
                      <Plus className="h-4 w-4 mr-2" />
                      Eerste Template Maken
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              emailTemplates.map((template) => (
                <Card key={template.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {template.name}
                          {template.is_default && (
                            <Badge variant="secondary">Standaard</Badge>
                          )}
                          {!template.is_active && (
                            <Badge variant="outline">Inactief</Badge>
                          )}
                        </CardTitle>
                        <CardDescription>
                          {emailTemplateTypes[template.template_type as keyof typeof emailTemplateTypes]?.name || template.template_type}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditTemplateDialog(template)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {!template.is_default && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteEmailTemplate(template)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div>
                        <Label className="text-sm font-medium">Onderwerp:</Label>
                        <p className="text-sm text-muted-foreground">{template.subject}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Type:</Label>
                        <p className="text-sm text-muted-foreground">
                          {emailTemplateTypes[template.template_type as keyof typeof emailTemplateTypes]?.description || template.template_type}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Template Edit/Create Dialog */}
          <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingTemplate ? 'Template Bewerken' : 'Nieuwe Template Maken'}
                </DialogTitle>
                <DialogDescription>
                  Configureer je email template voor automatische communicatie
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="template-name">Template Naam *</Label>
                    <Input
                      id="template-name"
                      value={templateForm.name}
                      onChange={(e) => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Bijv. Welkom Nieuwe Lead"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="template-type">Template Type *</Label>
                    <Select
                      value={templateForm.template_type}
                      onValueChange={(value) => setTemplateForm(prev => ({ ...prev, template_type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecteer type" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(emailTemplateTypes).map(([key, type]) => (
                          <SelectItem key={key} value={key}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="template-subject">Email Onderwerp *</Label>
                  <Input
                    id="template-subject"
                    value={templateForm.subject}
                    onChange={(e) => setTemplateForm(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="Bijv. Welkom bij {{company_name}}"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="template-html">HTML Inhoud *</Label>
                  <Textarea
                    id="template-html"
                    value={templateForm.html_content}
                    onChange={(e) => setTemplateForm(prev => ({ ...prev, html_content: e.target.value }))}
                    rows={10}
                    className="font-mono text-sm"
                    placeholder="<html><body><h1>Welkom {{customer_name}}!</h1>...</body></html>"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="template-text">Tekst Versie (optioneel)</Label>
                  <Textarea
                    id="template-text"
                    value={templateForm.text_content}
                    onChange={(e) => setTemplateForm(prev => ({ ...prev, text_content: e.target.value }))}
                    rows={6}
                    placeholder="Tekst versie van je email..."
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is-default"
                      checked={templateForm.is_default}
                      onCheckedChange={(checked) => setTemplateForm(prev => ({ ...prev, is_default: checked }))}
                    />
                    <Label htmlFor="is-default">Maak dit de standaard template voor dit type</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is-active"
                      checked={templateForm.is_active}
                      onCheckedChange={(checked) => setTemplateForm(prev => ({ ...prev, is_active: checked }))}
                    />
                    <Label htmlFor="is-active">Actief</Label>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold mb-2">Beschikbare Variabelen:</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                    <code>{'{{customer_name}}'}</code>
                    <code>{'{{company_name}}'}</code>
                    <code>{'{{contact_person}}'}</code>
                    <code>{'{{lead_name}}'}</code>
                    <code>{'{{appointment_date}}'}</code>
                    <code>{'{{invoice_number}}'}</code>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Deze variabelen worden automatisch vervangen door echte waarden.
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsTemplateDialogOpen(false)}>
                  Annuleren
                </Button>
                <Button onClick={saveEmailTemplate}>
                  <Save className="h-4 w-4 mr-2" />
                  {editingTemplate ? 'Opslaan' : 'Maken'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Webhooks Tab */}
        <TabsContent value="webhooks" className="space-y-6">
          {/* Webhook Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Webhook className="h-5 w-5" />
                Lead Ontvangst Webhook
              </CardTitle>
              <CardDescription>
                Importeer automatisch leads vanaf je website contactformulieren
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Webhook URL */}
              <div className="space-y-2">
                <Label htmlFor="webhook-url">Webhook URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="webhook-url"
                    value={webhookUrl}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => copyToClipboard(webhookUrl)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Stuur POST verzoeken naar deze URL om nieuwe leads aan te maken
                </p>
              </div>

              {/* Webhook Secret */}
              <div className="space-y-2">
                <Label htmlFor="webhook-secret">Webhook Secret</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="webhook-secret"
                      type={showSecret ? "text" : "password"}
                      value={webhookSecret}
                      readOnly
                      className="font-mono text-sm pr-10"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1 h-8 w-8 p-0"
                      onClick={() => setShowSecret(!showSecret)}
                    >
                      {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => copyToClipboard(webhookSecret)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={generateNewSecret}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Gebruik dit geheim om je webhook verzoeken te ondertekenen voor beveiliging
                </p>
              </div>

              {/* Test Webhook */}
              <div className="flex items-center gap-4 p-4 border rounded-lg">
                <div className="flex-1">
                  <h4 className="font-semibold">Test Webhook</h4>
                  <p className="text-sm text-muted-foreground">
                    Stuur een test verzoek om te controleren of je webhook werkt
                  </p>
                </div>
                <Button onClick={testWebhook} className="flex items-center gap-2">
                  <TestTube className="h-4 w-4" />
                  Test Nu
                </Button>
                {testResult === 'success' && (
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Gelukt
                  </Badge>
                )}
                {testResult === 'error' && (
                  <Badge variant="destructive">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Fout
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Code Examples */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                Integratie Voorbeelden
              </CardTitle>
              <CardDescription>
                Kopieer en plak deze voorbeelden om te integreren met je website
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Tabs defaultValue="html">
                <TabsList>
                  <TabsTrigger value="html">HTML Formulier</TabsTrigger>
                  <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                  <TabsTrigger value="curl">cURL</TabsTrigger>
                </TabsList>
                
                <TabsContent value="html" className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>HTML Contactformulier</Label>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => copyToClipboard(htmlFormExample)}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Kopiëren
                    </Button>
                  </div>
                  <Textarea
                    value={htmlFormExample}
                    readOnly
                    className="font-mono text-sm h-48"
                  />
                </TabsContent>

                <TabsContent value="javascript" className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>JavaScript Fetch</Label>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => copyToClipboard(jsExample)}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Kopiëren
                    </Button>
                  </div>
                  <Textarea
                    value={jsExample}
                    readOnly
                    className="font-mono text-sm h-48"
                  />
                </TabsContent>

                <TabsContent value="curl" className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>cURL Commando</Label>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => copyToClipboard(curlExample)}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Kopiëren
                    </Button>
                  </div>
                  <Textarea
                    value={curlExample}
                    readOnly
                    className="font-mono text-sm h-48"
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        {/* General Tab */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Bedrijfsinformatie</CardTitle>
              <CardDescription>
                Basisinformatie over je bedrijf
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="company-name">Bedrijfsnaam</Label>
                  <Input id="company-name" defaultValue="StayCool Air Conditioning" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vat-number">BTW Nummer</Label>
                  <Input id="vat-number" defaultValue="NL123456789B01" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefoon</Label>
                  <Input id="phone" defaultValue="+31 20 123 4567" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" defaultValue="info@staycoolairco.nl" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Adres</Label>
                <Textarea id="address" defaultValue="Keizersgracht 123
1016 EA Amsterdam
Netherlands" />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button>Wijzigingen Opslaan</Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}