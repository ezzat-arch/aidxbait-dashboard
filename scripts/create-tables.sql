-- Create admins table
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supabase_id UUID NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create users table for the application users (not admin users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL,
  status TEXT NOT NULL,
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert sample admin user
INSERT INTO admins (supabase_id, email)
VALUES 
  ('00000000-0000-0000-0000-000000000000', 'admin@aidxbait.com')
ON CONFLICT (email) DO NOTHING;

-- Insert sample application users
INSERT INTO users (name, email, role, status, last_active)
VALUES 
  ('John Doe', 'john.doe@example.com', 'admin', 'active', NOW() - INTERVAL '1 day'),
  ('Jane Smith', 'jane.smith@example.com', 'manager', 'active', NOW() - INTERVAL '2 days'),
  ('Robert Johnson', 'robert.johnson@example.com', 'user', 'inactive', NOW() - INTERVAL '20 days'),
  ('Emily Davis', 'emily.davis@example.com', 'user', 'active', NOW() - INTERVAL '1 day'),
  ('Michael Wilson', 'michael.wilson@example.com', 'guest', 'pending', NOW() - INTERVAL '3 days'),
  ('Sarah Brown', 'sarah.brown@example.com', 'manager', 'active', NOW() - INTERVAL '2 days'),
  ('David Miller', 'david.miller@example.com', 'user', 'inactive', NOW() - INTERVAL '25 days'),
  ('Lisa Anderson', 'lisa.anderson@example.com', 'admin', 'active', NOW() - INTERVAL '1 day'),
  ('James Taylor', 'james.taylor@example.com', 'user', 'pending', NOW() - INTERVAL '4 days'),
  ('Jennifer White', 'jennifer.white@example.com', 'guest', 'active', NOW() - INTERVAL '3 days'),
  ('Daniel Thomas', 'daniel.thomas@example.com', 'user', 'active', NOW() - INTERVAL '2 days'),
  ('Patricia Martinez', 'patricia.martinez@example.com', 'manager', 'inactive', NOW() - INTERVAL '15 days')
ON CONFLICT (email) DO NOTHING;
