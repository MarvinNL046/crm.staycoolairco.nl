import { createClient } from '@/lib/supabase/server'

export default async function TestPage() {
  const supabase = await createClient()
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  
  // Get pipeline stages
  const { data: stages, error: stagesError } = await supabase
    .from('pipeline_stages')
    .select('*')
    .order('sort_order')
  
  // Get leads
  const { data: leads, error: leadsError } = await supabase
    .from('leads')
    .select('*')
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Debug Test Page</h1>
      
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-2">Current User:</h2>
        <pre className="bg-gray-100 p-4 rounded">
          {JSON.stringify(user, null, 2)}
        </pre>
      </div>
      
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-2">Pipeline Stages ({stages?.length || 0}):</h2>
        {stagesError ? (
          <pre className="bg-red-100 p-4 rounded text-red-700">
            Error: {JSON.stringify(stagesError, null, 2)}
          </pre>
        ) : (
          <pre className="bg-gray-100 p-4 rounded">
            {JSON.stringify(stages, null, 2)}
          </pre>
        )}
      </div>
      
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-2">Leads ({leads?.length || 0}):</h2>
        {leadsError ? (
          <pre className="bg-red-100 p-4 rounded text-red-700">
            Error: {JSON.stringify(leadsError, null, 2)}
          </pre>
        ) : (
          <pre className="bg-gray-100 p-4 rounded">
            {JSON.stringify(leads, null, 2)}
          </pre>
        )}
      </div>
    </div>
  )
}