# 📦 Guia de Gerenciamento de Estado

## Visão Geral

O projeto utiliza múltiplas estratégias de gerenciamento de estado dependendo do contexto:

- **Server State**: Dados do servidor (banco de dados)
- **Client State**: Estado local da UI
- **Form State**: Estado de formulários
- **Global State**: Estado compartilhado entre componentes

## 1. Server State com TanStack Query (React Query)

Para dados que vêm do servidor e precisam de sincronização.

### Instalação

```bash
npm install @tanstack/react-query
```

### Setup

```typescript
// src/lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})
```

```typescript
// src/app/layout.tsx
'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
```

### Uso em Hooks

```typescript
// src/features/contacts/hooks/useContacts.ts
'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiService } from '@/services'
import { Contact } from '../types'

export function useContacts(page = 1, limit = 20) {
  return useQuery({
    queryKey: ['contacts', page, limit],
    queryFn: async () => {
      const response = await apiService.get(
        `/api/contacts?page=${page}&limit=${limit}`
      )
      if (!response.success) throw new Error(response.error)
      return response.data
    },
  })
}

export function useContact(id: string) {
  return useQuery({
    queryKey: ['contacts', id],
    queryFn: async () => {
      const response = await apiService.get(`/api/contacts/${id}`)
      if (!response.success) throw new Error(response.error)
      return response.data
    },
  })
}

export function useCreateContact() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Partial<Contact>) => {
      const response = await apiService.post('/api/contacts', data)
      if (!response.success) throw new Error(response.error)
      return response.data
    },
    onSuccess: () => {
      // Invalidate contacts list to refetch
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
    },
  })
}

export function useUpdateContact(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Partial<Contact>) => {
      const response = await apiService.put(`/api/contacts/${id}`, data)
      if (!response.success) throw new Error(response.error)
      return response.data
    },
    onSuccess: (data) => {
      // Update cache
      queryClient.setQueryData(['contacts', id], data)
      // Invalidate list
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
    },
  })
}

export function useDeleteContact(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const response = await apiService.delete(`/api/contacts/${id}`)
      if (!response.success) throw new Error(response.error)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      queryClient.removeQueries({ queryKey: ['contacts', id] })
    },
  })
}
```

### Uso em Componentes

```typescript
// src/features/contacts/components/ContactList.tsx
'use client'

import { useContacts } from '../hooks'

export function ContactList() {
  const { data, isLoading, error } = useContacts()

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>
  if (!data?.items) return <div>No contacts found</div>

  return (
    <ul>
      {data.items.map((contact) => (
        <li key={contact.id}>{contact.name}</li>
      ))}
    </ul>
  )
}
```

## 2. Client State com useState

Para estado local de componentes.

```typescript
// src/features/contacts/components/ContactFilters.tsx
'use client'

import { useState } from 'react'

export function ContactFilters() {
  const [searchTerm, setSearchTerm] = useState('')
  const [status, setStatus] = useState('all')
  const [sortBy, setSortBy] = useState('name')

  return (
    <div className="space-y-4">
      <input
        type="text"
        placeholder="Search..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <select value={status} onChange={(e) => setStatus(e.target.value)}>
        <option value="all">All</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>
      <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
        <option value="name">Name</option>
        <option value="created">Created Date</option>
      </select>
    </div>
  )
}
```

## 3. Global State com Zustand

Para estado compartilhado entre muitos componentes.

### Instalação

```bash
npm install zustand
```

### Criar Store

```typescript
// src/stores/uiStore.ts
import { create } from 'zustand'

interface UiStore {
  sidebarOpen: boolean
  toggleSidebar: () => void
  theme: 'light' | 'dark'
  setTheme: (theme: 'light' | 'dark') => void
}

export const useUiStore = create<UiStore>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  theme: 'light',
  setTheme: (theme) => set({ theme }),
}))
```

```typescript
// src/stores/authStore.ts
import { create } from 'zustand'
import { AuthUser } from '@/features/auth/types'

interface AuthStore {
  user: AuthUser | null
  setUser: (user: AuthUser | null) => void
  logout: () => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  logout: () => set({ user: null }),
}))
```

### Usar Store

```typescript
// src/components/layout/Sidebar.tsx
'use client'

import { useUiStore } from '@/stores/uiStore'

export function Sidebar() {
  const sidebarOpen = useUiStore((state) => state.sidebarOpen)
  const toggleSidebar = useUiStore((state) => state.toggleSidebar)

  return (
    <div className={sidebarOpen ? 'w-64' : 'w-16'}>
      {/* Sidebar content */}
      <button onClick={toggleSidebar}>Toggle</button>
    </div>
  )
}
```

## 4. Form State com React Hook Form

Para gerenciamento de formulários.

### Instalação

```bash
npm install react-hook-form zod @hookform/resolvers
```

### Criar Formulário

```typescript
// src/features/contacts/components/ContactForm.tsx
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Contact } from '../types'
import { useCreateContact } from '../hooks'

const contactSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().optional(),
  status: z.enum(['active', 'inactive', 'prospect', 'customer']),
})

type ContactFormData = z.infer<typeof contactSchema>

interface ContactFormProps {
  initialData?: Partial<Contact>
  onSubmit?: (data: ContactFormData) => void
}

export function ContactForm({ initialData, onSubmit }: ContactFormProps) {
  const { mutate: createContact, isPending } = useCreateContact()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: initialData,
  })

  const onFormSubmit = (data: ContactFormData) => {
    if (onSubmit) {
      onSubmit(data)
    } else {
      createContact(data)
    }
  }

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium">First Name *</label>
        <input
          {...register('firstName')}
          className="w-full px-4 py-2 border rounded"
        />
        {errors.firstName && (
          <span className="text-red-600">{errors.firstName.message}</span>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium">Last Name *</label>
        <input
          {...register('lastName')}
          className="w-full px-4 py-2 border rounded"
        />
        {errors.lastName && (
          <span className="text-red-600">{errors.lastName.message}</span>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium">Email *</label>
        <input
          type="email"
          {...register('email')}
          className="w-full px-4 py-2 border rounded"
        />
        {errors.email && (
          <span className="text-red-600">{errors.email.message}</span>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium">Phone</label>
        <input
          {...register('phone')}
          className="w-full px-4 py-2 border rounded"
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Status</label>
        <select
          {...register('status')}
          className="w-full px-4 py-2 border rounded"
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="prospect">Prospect</option>
          <option value="customer">Customer</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="px-6 py-2 bg-blue-600 text-white rounded"
      >
        {isPending ? 'Saving...' : 'Save'}
      </button>
    </form>
  )
}
```

## 5. Context API

Para estado complexo que precisa ser compartilhado.

```typescript
// src/context/FiltersContext.tsx
'use client'

import { createContext, useContext, useState } from 'react'

interface FiltersContextType {
  filters: {
    searchTerm: string
    status: string
    sortBy: string
  }
  setFilters: (filters: Partial<FiltersContextType['filters']>) => void
  resetFilters: () => void
}

const FiltersContext = createContext<FiltersContextType | undefined>(undefined)

export function FiltersProvider({ children }: { children: React.ReactNode }) {
  const [filters, setFilterState] = useState({
    searchTerm: '',
    status: 'all',
    sortBy: 'name',
  })

  const setFilters = (newFilters: Partial<typeof filters>) => {
    setFilterState((prev) => ({ ...prev, ...newFilters }))
  }

  const resetFilters = () => {
    setFilterState({
      searchTerm: '',
      status: 'all',
      sortBy: 'name',
    })
  }

  return (
    <FiltersContext.Provider value={{ filters, setFilters, resetFilters }}>
      {children}
    </FiltersContext.Provider>
  )
}

export function useFilters() {
  const context = useContext(FiltersContext)
  if (!context) {
    throw new Error('useFilters must be used within FiltersProvider')
  }
  return context
}
```

## Matriz de Decisão

| Tipo de Estado | Onde Usar | Exemplo |
|---|---|---|
| **Server State** | Dados do banco de dados | useContacts, useContact |
| **Client State** | UI local do componente | searchTerm, sortBy, isOpen |
| **Global State** | Compartilhado em muitos lugares | theme, user, sidebar state |
| **Form State** | Dados de formulários | login form, contact form |
| **Context** | Muitos valores compartilhados | theme provider, auth context |

## Boas Práticas

- ✅ Use TanStack Query para server state
- ✅ Use useState para state local simples
- ✅ Use Zustand para global state
- ✅ Use React Hook Form para formulários
- ✅ Use Context API como último recurso
- ✅ Normalize o estado (não aninhado)
- ✅ Evite prop drilling profundo
- ✅ Use seletores (selector functions) no Zustand
- ❌ Não misture server state com client state
- ❌ Não armazene dados do servidor em useState
- ❌ Não use Context para tudo
- ❌ Não crie estado unnecessário
