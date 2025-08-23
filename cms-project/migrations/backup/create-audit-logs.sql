-- Create audit logs table for tracking super admin actions
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    table_name TEXT,
    record_id TEXT,
    changes JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON public.audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Create policy - only super admins can view audit logs
CREATE POLICY "Super admins can view audit logs" ON public.audit_logs
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.super_admins 
            WHERE user_id = auth.uid()
        )
    );

-- Create policy - only super admins can insert audit logs  
CREATE POLICY "Super admins can insert audit logs" ON public.audit_logs
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.super_admins 
            WHERE user_id = auth.uid()
        )
    );

-- Grant necessary permissions
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;

-- Add some sample entries
INSERT INTO public.audit_logs (user_id, action, table_name, changes) VALUES
(
    (SELECT user_id FROM public.super_admins LIMIT 1),
    'audit_table_created',
    'audit_logs', 
    '{"message": "Audit logs table created for tracking super admin actions"}'
);

-- Verify the table was created
SELECT 
    'AUDIT LOGS TABLE CREATED' as status,
    COUNT(*) as initial_records
FROM public.audit_logs;