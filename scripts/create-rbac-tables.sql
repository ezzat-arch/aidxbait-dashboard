-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create permissions table
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create role_permissions junction table
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (role_id, permission_id)
);

-- Create user_roles junction table
CREATE TABLE IF NOT EXISTS user_roles (
  user_id UUID NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, role_id)
);

-- Insert default roles
INSERT INTO roles (name, description) VALUES
  ('super_admin', 'Has access to all features and data'),
  ('admin', 'Has access to most features and data'),
  ('manager', 'Can manage users and view analytics'),
  ('user', 'Basic access to view data'),
  ('guest', 'Limited view-only access')
ON CONFLICT (name) DO NOTHING;

-- Insert permissions
INSERT INTO permissions (name, description) VALUES
  ('users:view', 'Can view user data'),
  ('users:create', 'Can create new users'),
  ('users:update', 'Can update existing users'),
  ('users:delete', 'Can delete users'),
  ('analytics:view', 'Can view analytics data'),
  ('analytics:export', 'Can export analytics data'),
  ('settings:view', 'Can view system settings'),
  ('settings:update', 'Can update system settings'),
  ('admin:manage-roles', 'Can manage roles and permissions'),
  ('admin:view-audit-logs', 'Can view audit logs')
ON CONFLICT (name) DO NOTHING;

-- Assign permissions to roles
-- First, get role IDs
WITH roles_data AS (
  SELECT id, name FROM roles
),
permissions_data AS (
  SELECT id, name FROM permissions
)

-- Super Admin - all permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles_data r, permissions_data p
WHERE r.name = 'super_admin'
ON CONFLICT DO NOTHING;

-- Admin permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles_data r, permissions_data p
WHERE r.name = 'admin' AND p.name IN (
  'users:view', 'users:create', 'users:update', 'users:delete',
  'analytics:view', 'analytics:export',
  'settings:view', 'settings:update',
  'admin:view-audit-logs'
)
ON CONFLICT DO NOTHING;

-- Manager permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles_data r, permissions_data p
WHERE r.name = 'manager' AND p.name IN (
  'users:view', 'users:create', 'users:update',
  'analytics:view', 'analytics:export',
  'settings:view'
)
ON CONFLICT DO NOTHING;

-- User permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles_data r, permissions_data p
WHERE r.name = 'user' AND p.name IN (
  'users:view',
  'analytics:view',
  'settings:view'
)
ON CONFLICT DO NOTHING;

-- Guest permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles_data r, permissions_data p
WHERE r.name = 'guest' AND p.name IN (
  'users:view'
)
ON CONFLICT DO NOTHING;

-- Assign super_admin role to the default admin user
WITH admin_user AS (
  SELECT id FROM admins WHERE email = 'admin@aidxbait.com' LIMIT 1
),
super_admin_role AS (
  SELECT id FROM roles WHERE name = 'super_admin' LIMIT 1
)
INSERT INTO user_roles (user_id, role_id)
SELECT admin_user.id, super_admin_role.id
FROM admin_user, super_admin_role
ON CONFLICT DO NOTHING;
