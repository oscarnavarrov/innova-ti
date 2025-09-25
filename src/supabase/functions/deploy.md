# Deployment Instructions for User Management System

## Setup

1. Ensure you have the Supabase CLI installed:
   ```bash
   npm install -g supabase
   ```

2. Login to Supabase:
   ```bash
   supabase login
   ```

3. Link your project:
   ```bash
   supabase link --project-ref lguohsvuarkciiozljva
   ```

## Deploy Functions

Deploy the server function:
```bash
supabase functions deploy server
```

## Database Schema Requirements

Ensure your database has the following tables with the correct structure:

### 1. roles table
```sql
CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR NOT NULL,
  permissions JSONB
);

-- Insert default roles
INSERT INTO roles (id, name, permissions) VALUES
(1, 'Administrador', '{"description": "Acceso completo al sistema"}'),
(2, 'Técnico', '{"description": "Manejo de tickets y mantenimiento"}'),
(3, 'Docente', '{"description": "Acceso a préstamos de equipos"}');
```

### 2. profiles table
```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name VARCHAR NOT NULL,
  role_id INTEGER REFERENCES roles(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies as needed
```

## Testing

Test the endpoints using the browser console:

```javascript
// Test getting users
fetch('/make-server-2e05cbde/users', {
  headers: {
    'Authorization': 'Bearer ' + 'YOUR_ACCESS_TOKEN'
  }
})

// Test creating a user
fetch('/make-server-2e05cbde/users', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + 'YOUR_ACCESS_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'test@example.com',
    password: 'password123',
    full_name: 'Test User',
    role_id: 2
  })
})
```

## Environment Variables

Make sure your Supabase project has the following environment variables set:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (for admin operations like user creation)

## Troubleshooting

1. **CORS Issues**: Make sure your function is deployed and accessible
2. **Auth Issues**: Verify that the user has admin role (role_id = 1)
3. **Database Issues**: Check that the database schema matches exactly
4. **Permission Issues**: Ensure RLS policies allow the operations you need