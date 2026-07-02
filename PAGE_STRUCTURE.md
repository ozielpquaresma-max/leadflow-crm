# 🗂️ Guia de Estrutura de Páginas

## Rotas Protegidas vs Públicas

### Rotas Públicas
```
src/app/(public)/
├── page.tsx           # Landing page /
├── pricing/           # /pricing
├── about/             # /about
└── ...
```

### Rotas Protegidas (Requerem autenticação)
```
src/app/(auth)/
├── dashboard/         # /dashboard
├── contacts/          # /contacts, /contacts/[id], /contacts/create
├── leads/             # /leads, /leads/[id], /leads/create
├── pipeline/          # /pipeline
├── calendar/          # /calendar
├── tasks/             # /tasks
├── proposals/         # /proposals
├── finance/           # /finance/invoices
├── reports/           # /reports
└── settings/          # /settings
```

O sufixo `(auth)` é um **route group** do Next.js que permite aplicar um layout compartilhado a todas as rotas autenticadas.

## Estrutura de uma Página

### Page com Dados Simples

```typescript
// src/app/(auth)/contacts/page.tsx
'use client'

import { ContactList } from '@/features/contacts/components'

export default function ContactsPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Contatos</h1>
        <p className="text-gray-600">Gerenciador seus contatos</p>
      </div>
      
      <ContactList />
    </div>
  )
}
```

### Page com Layout customizado

```typescript
// src/app/(auth)/dashboard/page.tsx
'use client'

import { DashboardHeader } from '@/features/dashboard/components'
import { DashboardCards } from '@/features/dashboard/components'
import { DashboardCharts } from '@/features/dashboard/components'

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <DashboardHeader />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCards />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardCharts />
      </div>
    </div>
  )
}
```

### Page com Loading State

```typescript
// src/app/(auth)/contacts/[id]/page.tsx
'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ContactDetail } from '@/features/contacts/components'
import { Contact } from '@/features/contacts/types'

export default function ContactDetailPage() {
  const params = useParams()
  const id = params.id as string
  
  const [contact, setContact] = useState<Contact | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchContact = async () => {
      try {
        const response = await fetch(`/api/contacts/${id}`)
        const data = await response.json()
        if (data.success) {
          setContact(data.data)
        } else {
          setError(data.error)
        }
      } catch (err) {
        setError('Failed to load contact')
      } finally {
        setLoading(false)
      }
    }

    fetchContact()
  }, [id])

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>
  if (!contact) return <div>Contact not found</div>

  return <ContactDetail contact={contact} />
}
```

## Metadata das Páginas

```typescript
// src/app/(auth)/contacts/page.tsx
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contatos - LeadFlow CRM',
  description: 'Gerenciar contatos e clientes',
}

export default function ContactsPage() {
  // ...
}
```

## Layouts Compartilhados

### Layout Raiz
```typescript
// src/app/layout.tsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
      </body>
    </html>
  )
}
```

### Layout Autenticado
```typescript
// src/app/(auth)/layout.tsx
import { Header } from '@/components/layout'
import { Sidebar } from '@/components/layout'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 overflow-auto bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  )
}
```

### Layout Público
```typescript
// src/app/(public)/layout.tsx
import { Header } from '@/components/layout'
import { Footer } from '@/components/layout'

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header variant="public" />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  )
}
```

## Dynamic Routes

### Com parâmetro dinâmico

```typescript
// src/app/(auth)/contacts/[id]/page.tsx
export default function ContactPage({ params }: { params: { id: string } }) {
  return <ContactDetail id={params.id} />
}
```

### Com múltiplos parâmetros

```typescript
// src/app/(auth)/pipeline/[stageId]/[dealId]/page.tsx
export default function DealPage({
  params,
}: {
  params: { stageId: string; dealId: string }
}) {
  return <DealDetail stageId={params.stageId} dealId={params.dealId} />
}
```

### Com Catch-all Routes

```typescript
// src/app/(auth)/docs/[[...slug]]/page.tsx
export default function DocsPage({ params }: { params: { slug?: string[] } }) {
  const path = params.slug?.join('/') || 'index'
  return <Docs path={path} />
}
```

## Boas Práticas

### ✅ DO's

- Use `'use client'` apenas quando necessário interatividade
- Organize componentes por feature, não por tipo de arquivo
- Reutilize componentes do `@/components`
- Use hooks customizados para lógica compartilhada
- Implemente loading e error states
- Use path aliases (`@/`) para imports

### ❌ DON'Ts

- Não coloque lógica de negócio em páginas
- Não importe diretamente de outras features (use `@/features/feature-name`)
- Não reutilize componentes de uma feature em outra (crie um componente global)
- Não use props drilling profundo (use hooks ou context)
- Não misture SSR e componentes client sem pensar nas implicações

## Exemplo Completo

```typescript
// src/app/(auth)/leads/[id]/edit/page.tsx
'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Metadata } from 'next'
import { LeadForm } from '@/features/leads/components'
import { Lead } from '@/features/leads/types'
import { leadService } from '@/features/leads/services'

export const metadata: Metadata = {
  title: 'Editar Lead - LeadFlow CRM',
}

export default function EditLeadPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [lead, setLead] = useState<Lead | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchLead = async () => {
      try {
        const response = await leadService.getLead(id)
        if (response.success) {
          setLead(response.data)
        } else {
          setError(response.error || 'Lead not found')
        }
      } catch (err) {
        setError('Failed to load lead')
      } finally {
        setLoading(false)
      }
    }

    fetchLead()
  }, [id])

  const handleSubmit = async (formData: Partial<Lead>) => {
    try {
      const response = await leadService.updateLead(id, formData)
      if (response.success) {
        router.push(`/leads/${id}`)
      } else {
        setError(response.error || 'Failed to update lead')
      }
    } catch (err) {
      setError('An error occurred')
    }
  }

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>
  if (!lead) return <div>Lead not found</div>

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Editar Lead</h1>
      <LeadForm initialData={lead} onSubmit={handleSubmit} />
    </div>
  )
}
```
