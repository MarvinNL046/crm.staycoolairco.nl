"use client"

import { useState, useCallback, useEffect } from 'react'
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  Connection,
  MarkerType,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Plus,
  Save,
  Play,
  Pause,
  Settings,
  Zap,
  Mail,
  MessageSquare,
  CheckSquare,
  UserCheck,
  Tag,
  Clock,
  GitBranch,
  Globe,
  Trash2,
  Copy,
  FileText,
  Calendar,
  UserPlus,
  TrendingUp
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { WorkflowTemplateModal } from '@/components/workflows/WorkflowTemplateModal'
import { WorkflowSidebar } from '@/components/workflows/WorkflowSidebar'

// Node types icons
const nodeIcons: Record<string, any> = {
  send_email: Mail,
  send_sms: MessageSquare,
  create_task: CheckSquare,
  update_lead_status: UserCheck,
  add_tag: Tag,
  wait: Clock,
  condition: GitBranch,
  webhook: Globe,
  lead_created: UserPlus,
  lead_status_changed: UserCheck,
  form_submitted: FileText,
  appointment_scheduled: Calendar,
}

// Custom node component
const WorkflowNode = ({ data }: { data: any }) => {
  const Icon = nodeIcons[data.action || data.trigger] || Zap
  const isCondition = data.action === 'condition'
  
  return (
    <div className={`px-4 py-2 shadow-lg rounded-lg border-2 ${
      data.type === 'trigger' 
        ? 'bg-purple-100 dark:bg-purple-900/20 border-purple-400 dark:border-purple-600' 
        : isCondition
        ? 'bg-amber-100 dark:bg-amber-900/20 border-amber-400 dark:border-amber-600'
        : 'bg-blue-100 dark:bg-blue-900/20 border-blue-400 dark:border-blue-600'
    }`}>
      {data.type !== 'trigger' && (
        <Handle
          type="target"
          position={Position.Top}
          className="w-3 h-3 !bg-gray-400"
        />
      )}
      
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5" />
        <div className="text-sm font-medium">{data.label}</div>
      </div>
      
      {isCondition ? (
        <>
          <Handle
            type="source"
            position={Position.Right}
            id="yes"
            className="w-3 h-3 !bg-green-500"
            style={{ top: '30%' }}
          />
          <Handle
            type="source"
            position={Position.Right}
            id="no"
            className="w-3 h-3 !bg-red-500"
            style={{ top: '70%' }}
          />
        </>
      ) : (
        <Handle
          type="source"
          position={Position.Bottom}
          className="w-3 h-3 !bg-gray-400"
        />
      )}
    </div>
  )
}

const nodeTypes = {
  trigger: WorkflowNode,
  action: WorkflowNode,
  condition: WorkflowNode,
}

// Initial nodes and edges
const initialNodes: Node[] = [
  {
    id: '1',
    type: 'trigger',
    position: { x: 250, y: 50 },
    data: { 
      label: 'Lead Aangemaakt',
      type: 'trigger',
      trigger: 'lead_created'
    },
  },
  {
    id: '2',
    type: 'action',
    position: { x: 250, y: 150 },
    data: { 
      label: 'Stuur Welkomst Email',
      type: 'action',
      action: 'send_email'
    },
  },
  {
    id: '3',
    type: 'action',
    position: { x: 250, y: 250 },
    data: { 
      label: 'Wacht 1 dag',
      type: 'action',
      action: 'wait'
    },
  },
  {
    id: '4',
    type: 'action',
    position: { x: 250, y: 350 },
    data: { 
      label: 'Maak Follow-up Taak',
      type: 'action',
      action: 'create_task'
    },
  },
]

const initialEdges: Edge[] = [
  { 
    id: 'e1-2', 
    source: '1', 
    target: '2',
    animated: true,
    style: { stroke: '#6366f1' }
  },
  { 
    id: 'e2-3', 
    source: '2', 
    target: '3',
    animated: true,
    style: { stroke: '#6366f1' }
  },
  { 
    id: 'e3-4', 
    source: '3', 
    target: '4',
    animated: true,
    style: { stroke: '#6366f1' }
  },
]

export default function WorkflowsPage() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [showSidebar, setShowSidebar] = useState(false)
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [workflows, setWorkflows] = useState<any[]>([])
  const [activeWorkflow, setActiveWorkflow] = useState<any>(null)

  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge = {
        ...params,
        animated: true,
        style: { stroke: '#6366f1' },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#6366f1',
        },
      }
      setEdges((eds) => addEdge(newEdge, eds))
    },
    [setEdges]
  )

  const onNodeClick = useCallback((_: any, node: Node) => {
    setSelectedNode(node)
    setShowSidebar(true)
  }, [])

  const addNode = (type: string, action?: string) => {
    const newNode: Node = {
      id: `${Date.now()}`,
      type: type === 'trigger' ? 'trigger' : type === 'condition' ? 'condition' : 'action',
      position: { x: 250, y: nodes.length * 120 + 50 },
      data: {
        label: action ? action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Nieuwe Actie',
        type: type,
        action: action,
      }
    }
    setNodes((nds) => [...nds, newNode])
  }

  const saveWorkflow = async () => {
    // Hier zou je de workflow opslaan naar de database
    console.log('Saving workflow:', { nodes, edges })
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold">Workflow Builder</h1>
              <p className="text-sm text-muted-foreground">
                {activeWorkflow ? activeWorkflow.name : 'Nieuwe Workflow'}
              </p>
            </div>
            <Badge variant="outline" className="bg-green-100 dark:bg-green-900/20">
              Active
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowTemplateModal(true)}>
              <FileText className="mr-2 h-4 w-4" />
              Templates
            </Button>
            <Button variant="outline" onClick={saveWorkflow}>
              <Save className="mr-2 h-4 w-4" />
              Opslaan
            </Button>
            <Button>
              <Play className="mr-2 h-4 w-4" />
              Activeren
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Left Sidebar - Actions */}
        <div className="w-64 border-r p-4 overflow-y-auto">
          <h3 className="font-semibold mb-4">Triggers</h3>
          <div className="space-y-2 mb-6">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => addNode('trigger', 'lead_created')}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Lead Aangemaakt
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => addNode('trigger', 'form_submitted')}
            >
              <FileText className="mr-2 h-4 w-4" />
              Formulier Ingediend
            </Button>
          </div>

          <h3 className="font-semibold mb-4">Acties</h3>
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => addNode('action', 'send_email')}
            >
              <Mail className="mr-2 h-4 w-4" />
              Stuur Email
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => addNode('action', 'send_sms')}
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              Stuur SMS
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => addNode('action', 'create_task')}
            >
              <CheckSquare className="mr-2 h-4 w-4" />
              Maak Taak
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => addNode('action', 'wait')}
            >
              <Clock className="mr-2 h-4 w-4" />
              Wacht
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => addNode('condition', 'condition')}
            >
              <GitBranch className="mr-2 h-4 w-4" />
              Conditie
            </Button>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            fitView
          >
            <Background />
            <Controls />
            <MiniMap 
              className="!bg-white dark:!bg-gray-900"
              nodeColor={(node) => {
                if (node.data.type === 'trigger') return '#a855f7'
                if (node.data.action === 'condition') return '#f59e0b'
                return '#3b82f6'
              }}
            />
          </ReactFlow>
        </div>

        {/* Right Sidebar - Properties */}
        {showSidebar && selectedNode && (
          <WorkflowSidebar
            node={selectedNode}
            onClose={() => setShowSidebar(false)}
            onUpdate={(updatedNode) => {
              setNodes((nds) =>
                nds.map((node) =>
                  node.id === updatedNode.id ? updatedNode : node
                )
              )
            }}
          />
        )}
      </div>

      {/* Template Modal */}
      <WorkflowTemplateModal
        open={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
        onSelect={(template) => {
          // Load template nodes and edges
          setNodes(template.nodes)
          setEdges(template.edges)
          setShowTemplateModal(false)
        }}
      />
    </div>
  )
}