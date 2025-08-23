import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Database, 
  Server, 
  Shield, 
  Activity, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  HardDrive,
  Cpu,
  Wifi
} from 'lucide-react'

export default function SystemPage() {
  // Mock system health data - in real app this would come from monitoring services
  const systemStatus = {
    overall: 'healthy',
    uptime: '99.8%',
    lastChecked: new Date().toISOString(),
    services: [
      { name: 'Database', status: 'healthy', uptime: '99.9%', responseTime: '12ms' },
      { name: 'API Gateway', status: 'healthy', uptime: '99.8%', responseTime: '45ms' },
      { name: 'Authentication', status: 'healthy', uptime: '100%', responseTime: '23ms' },
      { name: 'File Storage', status: 'healthy', uptime: '99.7%', responseTime: '67ms' },
      { name: 'Email Service', status: 'warning', uptime: '98.2%', responseTime: '156ms' },
      { name: 'Background Jobs', status: 'healthy', uptime: '99.5%', responseTime: '89ms' },
    ],
    metrics: {
      cpu: { usage: 45, trend: 'stable' },
      memory: { usage: 67, trend: 'stable' },
      disk: { usage: 23, trend: 'increasing' },
      network: { usage: 34, trend: 'stable' },
    },
    recentEvents: [
      { time: '10:23', type: 'info', message: 'Database backup completed successfully' },
      { time: '09:45', type: 'warning', message: 'Email service experiencing high latency' },
      { time: '08:30', type: 'info', message: 'System maintenance window completed' },
      { time: '07:15', type: 'success', message: 'Security scan completed - no issues found' },
    ]
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-50 border-green-200'
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'error': return 'text-red-600 bg-red-50 border-red-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'warning': return <AlertCircle className="h-4 w-4 text-yellow-600" />
      case 'error': return <AlertCircle className="h-4 w-4 text-red-600" />
      default: return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'success': return 'text-green-600'
      case 'warning': return 'text-yellow-600'
      case 'error': return 'text-red-600'
      default: return 'text-blue-600'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Systeem Status</h1>
          <p className="text-gray-600">Platform gezondheid en prestatie monitoring</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Activity className="mr-2 h-4 w-4" />
            Logs Bekijken
          </Button>
          <Button>
            <Shield className="mr-2 h-4 w-4" />
            Security Scan
          </Button>
        </div>
      </div>

      {/* Overall Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Platform Overzicht
          </CardTitle>
          <CardDescription>
            Huidige status van alle systeem componenten
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <span className="text-lg font-medium text-green-700">Systeem Operationeel</span>
              </div>
              <Badge className={getStatusColor('healthy')}>
                {systemStatus.uptime} Uptime
              </Badge>
            </div>
            <div className="text-sm text-gray-500">
              Laatst gecontroleerd: {new Date(systemStatus.lastChecked).toLocaleTimeString('nl-NL')}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Services Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Service Status
          </CardTitle>
          <CardDescription>
            Individuele service componenten
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {systemStatus.services.map((service) => (
              <div key={service.name} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{service.name}</h4>
                  {getStatusIcon(service.status)}
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Uptime:</span>
                    <span className="font-medium">{service.uptime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Response:</span>
                    <span className="font-medium">{service.responseTime}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* System Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cpu className="h-5 w-5" />
            Systeem Metrics
          </CardTitle>
          <CardDescription>
            Real-time resource gebruik
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* CPU Usage */}
            <div className="text-center">
              <Cpu className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{systemStatus.metrics.cpu.usage}%</div>
              <p className="text-sm text-gray-600">CPU Gebruik</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full" 
                  style={{ width: `${systemStatus.metrics.cpu.usage}%` }}
                ></div>
              </div>
            </div>

            {/* Memory Usage */}
            <div className="text-center">
              <Database className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{systemStatus.metrics.memory.usage}%</div>
              <p className="text-sm text-gray-600">Memory Gebruik</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-green-500 h-2 rounded-full" 
                  style={{ width: `${systemStatus.metrics.memory.usage}%` }}
                ></div>
              </div>
            </div>

            {/* Disk Usage */}
            <div className="text-center">
              <HardDrive className="h-8 w-8 text-purple-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{systemStatus.metrics.disk.usage}%</div>
              <p className="text-sm text-gray-600">Disk Gebruik</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-purple-500 h-2 rounded-full" 
                  style={{ width: `${systemStatus.metrics.disk.usage}%` }}
                ></div>
              </div>
            </div>

            {/* Network Usage */}
            <div className="text-center">
              <Wifi className="h-8 w-8 text-orange-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{systemStatus.metrics.network.usage}%</div>
              <p className="text-sm text-gray-600">Network Gebruik</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-orange-500 h-2 rounded-full" 
                  style={{ width: `${systemStatus.metrics.network.usage}%` }}
                ></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recente Gebeurtenissen
          </CardTitle>
          <CardDescription>
            Laatste systeem activiteiten en meldingen
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {systemStatus.recentEvents.map((event, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-500 font-mono w-12">
                  {event.time}
                </div>
                <div className="flex-1">
                  <p className={`text-sm ${getEventTypeColor(event.type)}`}>
                    {event.message}
                  </p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {event.type}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}