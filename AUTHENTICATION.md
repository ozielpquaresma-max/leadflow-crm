# 🔐 Guia de Autenticação e Autorização

## Visão Geral

O projeto está preparado para integração com **NextAuth.js** (recomendado) ou outro provedor de autenticação.

Este guia descreve como a autenticação deve ser implementada seguindo a arquitetura do projeto.

## Estrutura de Autenticação

### 1. Tipos

```typescript
// src/features/auth/types/index.ts
export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterCredentials extends LoginCredentials {
  name: string
  password_confirm: string
}

export interface AuthUser {
  id: string
  email: string
  name: string
  avatar?: string
  role: 'admin' | 'manager' | 'sales' | 'user'
  organizationId: string
}

export interface AuthSession {
  user: AuthUser
  token: string
  expiresAt: Date
}
```

### 2. Serviço de Autenticação

```typescript
// src/features/auth/services/index.ts
import { apiService } from '@/services'
import { LoginCredentials, RegisterCredentials, AuthSession } from '../types'

export class AuthService {
  async login(credentials: LoginCredentials): Promise<AuthSession> {
    const response = await apiService.post('/api/auth/login', credentials)
    return response.data
  }

  async register(credentials: RegisterCredentials): Promise<AuthSession> {
    const response = await apiService.post('/api/auth/register', credentials)
    return response.data
  }

  async logout(): Promise<void> {
    await apiService.post('/api/auth/logout')
  }

  async getCurrentUser(): Promise<AuthUser> {
    const response = await apiService.get('/api/auth/me')
    return response.data
  }

  async refreshToken(): Promise<string> {
    const response = await apiService.post('/api/auth/refresh')
    return response.data.token
  }
}

export const authService = new AuthService()
```

### 3. Custom Hook de Autenticação

```typescript
// src/hooks/useAuth.ts
'use client'

import { useEffect, useState } from 'react'
import { AuthUser, AuthSession } from '@/features/auth/types'
import { authService } from '@/features/auth/services'

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await authService.getCurrentUser()
        setUser(currentUser)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch user')
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [])

  const login = async (email: string, password: string) => {
    setLoading(true)
    try {
      const session = await authService.login({ email, password })
      setUser(session.user)
      localStorage.setItem('authToken', session.token)
      return session
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const register = async (
    email: string,
    password: string,
    name: string,
    password_confirm: string,
  ) => {
    setLoading(true)
    try {
      const session = await authService.register({
        email,
        password,
        name,
        password_confirm,
      })
      setUser(session.user)
      localStorage.setItem('authToken', session.token)
      return session
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      await authService.logout()
      setUser(null)
      localStorage.removeItem('authToken')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Logout failed')
    }
  }

  return {
    user,
    loading,
    error,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  }
}
```

### 4. Componentes de Autenticação

```typescript
// src/features/auth/components/LoginForm.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui'

export function LoginForm() {
  const router = useRouter()
  const { login, error } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await login(email, password)
      router.push('/dashboard')
    } catch (err) {
      // Error is handled by useAuth hook
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-4 py-2 border rounded-lg"
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Senha</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full px-4 py-2 border rounded-lg"
        />
      </div>
      {error && <div className="text-red-600">{error}</div>}
      <Button type="submit" isLoading={isLoading}>
        Entrar
      </Button>
    </form>
  )
}
```

### 5. Middleware de Proteção

```typescript
// src/middleware.ts
import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('authToken')?.value

  // Rotas protegidas
  if (request.nextUrl.pathname.startsWith('/(auth)')) {
    if (!token) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
  }

  // Rotas de autenticação (redirecionar se já logado)
  if (request.nextUrl.pathname.startsWith('/auth') && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/(auth)/:path*', '/auth/:path*'],
}
```

### 6. API Routes de Autenticação

```typescript
// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createSuccessResponse, createErrorResponse } from '@/lib/api'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    // Validar credenciais (implementar com banco de dados)
    // const user = await db.user.findUnique({ where: { email } })
    // if (!user || !verifyPassword(password, user.password)) {
    //   return NextResponse.json(
    //     createErrorResponse('Invalid email or password'),
    //     { status: 401 }
    //   )
    // }

    // Gerar token JWT
    // const token = generateJWT(user)

    // Mock response
    const mockResponse = {
      user: {
        id: '1',
        email,
        name: 'User Name',
        role: 'user',
        organizationId: 'org-1',
      },
      token: 'mock-token',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    }

    // Setar cookie
    const response = NextResponse.json(
      createSuccessResponse(mockResponse, 'Login successful'),
      { status: 200 }
    )

    response.cookies.set({
      name: 'authToken',
      value: mockResponse.token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours
    })

    return response
  } catch (error) {
    return NextResponse.json(
      createErrorResponse('Login failed'),
      { status: 500 }
    )
  }
}
```

```typescript
// src/app/api/auth/me/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createSuccessResponse, createErrorResponse } from '@/lib/api'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('authToken')?.value

    if (!token) {
      return NextResponse.json(
        createErrorResponse('Unauthorized'),
        { status: 401 }
      )
    }

    // Validar token e buscar usuário
    // const decoded = verifyJWT(token)
    // const user = await db.user.findUnique({ where: { id: decoded.userId } })

    // Mock response
    const mockUser = {
      id: '1',
      email: 'user@example.com',
      name: 'User Name',
      role: 'user',
      organizationId: 'org-1',
    }

    return NextResponse.json(
      createSuccessResponse(mockUser),
      { status: 200 }
    )
  } catch (error) {
    return NextResponse.json(
      createErrorResponse('Failed to fetch user'),
      { status: 500 }
    )
  }
}
```

## Autorização (RBAC)

### Checking Permissions

```typescript
// src/lib/permissions.ts
export const permissions = {
  contacts: {
    list: ['admin', 'manager', 'sales', 'user'],
    create: ['admin', 'manager', 'sales'],
    edit: ['admin', 'manager', 'sales'],
    delete: ['admin', 'manager'],
  },
  leads: {
    list: ['admin', 'manager', 'sales'],
    create: ['admin', 'manager', 'sales'],
    edit: ['admin', 'manager', 'sales'],
    delete: ['admin', 'manager'],
  },
  reports: {
    list: ['admin', 'manager'],
    view: ['admin', 'manager'],
  },
  settings: {
    manage: ['admin'],
  },
}

export function hasPermission(userRole: string, resource: string, action: string): boolean {
  const resourcePermissions = permissions[resource as keyof typeof permissions]
  if (!resourcePermissions) return false
  
  const allowedRoles = resourcePermissions[action as keyof typeof resourcePermissions]
  return allowedRoles?.includes(userRole) ?? false
}
```

### Proteger Componentes

```typescript
// src/components/shared/ProtectedComponent.tsx
import { useAuth } from '@/hooks/useAuth'
import { hasPermission } from '@/lib/permissions'

interface ProtectedComponentProps {
  resource: string
  action: string
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function ProtectedComponent({
  resource,
  action,
  children,
  fallback = null,
}: ProtectedComponentProps) {
  const { user } = useAuth()

  if (!user) return fallback

  if (hasPermission(user.role, resource, action)) {
    return children
  }

  return fallback
}
```

## Boas Práticas

- ✅ Use tokens JWT com expiração curta (15-30 min)
- ✅ Use refresh tokens para renovar acesso (7-30 dias)
- ✅ Armazene tokens em HttpOnly cookies (seguro contra XSS)
- ✅ Valide tokens no middleware e nas API routes
- ✅ Use HTTPS em produção
- ✅ Implemente rate limiting em endpoints de autenticação
- ✅ Hash senhas com bcrypt ou similar
- ✅ Logging de tentativas de login falhadas
- ❌ Não armazene tokens em localStorage (vulnerável a XSS)
- ❌ Não coloque dados sensíveis no token
- ❌ Não envie senhas em respostas da API

## Próximas Etapas

1. Instalar e configurar NextAuth.js (ou alternativa)
2. Implementar banco de dados com Prisma
3. Adicionar autenticação social (Google, GitHub, etc)
4. Implementar 2FA
5. Adicionar recuperação de senha por email
