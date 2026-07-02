# LeadFlow CRM - Arquitetura do Projeto

## 📁 Estrutura de Pastas

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Rotas autenticadas - layout compartilhado
│   ├── (public)/                 # Rotas públicas - layout padrão
│   ├── api/                      # API Routes
│   │   ├── auth/                 # Endpoints de autenticação
│   │   ├── contacts/             # Endpoints de contatos
│   │   ├── leads/                # Endpoints de leads
│   │   ├── companies/            # Endpoints de empresas
│   │   ├── deals/                # Endpoints de deals
│   │   ├── tasks/                # Endpoints de tarefas
│   │   ├── proposals/            # Endpoints de propostas
│   │   └── webhooks/             # Webhooks de integrações
│   ├── layout.tsx                # Layout raiz
│   └── page.tsx                  # Página inicial
│
├── features/                     # Módulos de funcionalidades independentes
│   ├── auth/                     # Módulo de autenticação
│   │   ├── components/           # Componentes (LoginForm, RegisterForm)
│   │   ├── hooks/                # Hooks customizados (useLogin, useRegister)
│   │   ├── services/             # Lógica de negócio
│   │   ├── types/                # Tipos TypeScript
│   │   └── index.ts              # Exports do módulo
│   │
│   ├── dashboard/                # Dashboard e overview
│   ├── leads/                    # Gerenciamento de leads
│   ├── contacts/                 # Gerenciamento de contatos
│   ├── companies/                # Gerenciamento de empresas
│   ├── pipeline/                 # Pipeline de vendas (Deals/Kanban)
│   ├── calendar/                 # Calendário e agendamentos
│   ├── tasks/                    # Gerenciamento de tarefas
│   ├── whatsapp/                 # Integração WhatsApp
│   ├── proposals/                # Criação e gerenciamento de propostas
│   ├── finance/                  # Faturamento e financeiro
│   ├── reports/                  # Relatórios e analytics
│   ├── settings/                 # Configurações da aplicação
│   └── index.ts                  # Export central de features
│
├── components/                   # Componentes reutilizáveis globais
│   ├── ui/                       # Componentes base (Button, Input, Card, etc)
│   ├── layout/                   # Componentes de layout (Header, Sidebar, Footer)
│   ├── forms/                    # Componentes de formulário
│   ├── tables/                   # Componentes de tabela de dados
│   ├── modals/                   # Modals e diálogos
│   ├── charts/                   # Gráficos e visualizações
│   ├── shared/                   # Componentes compartilhados (Loading, Empty)
│   └── index.ts                  # Export central
│
├── hooks/                        # Hooks React customizados globais
│   ├── useAuth.ts                # Hook para autenticação
│   ├── useAsync.ts               # Hook para operações assíncronas
│   ├── useLocalStorage.ts        # Hook para localStorage
│   └── index.ts
│
├── services/                     # Serviços de negócio e API
│   ├── api.service.ts            # Cliente HTTP centralizado
│   ├── auth.service.ts           # Serviço de autenticação
│   └── index.ts
│
├── lib/                          # Utilitários e helpers
│   ├── api.ts                    # Helpers de API (responses, errors)
│   ├── utils.ts                  # Funções utilitárias
│   └── index.ts
│
├── utils/                        # Mais utilitários (export de lib)
│   └── index.ts
│
├── types/                        # Definições de tipos TypeScript
│   ├── common.ts                 # Tipos comuns (ApiResponse, Pagination, etc)
│   ├── api.ts                    # Tipos relacionados a API
│   ├── models.ts                 # Modelos de domínio (User, Contact, Deal, etc)
│   └── index.ts                  # Export central
│
├── styles/                       # Estilos globais
│   ├── variables.css             # Variáveis CSS (cores, espaçamento, etc)
│   ├── animations.css            # Animações e transições
│   └── index.css                 # Import central
│
├── config.ts                     # Configurações da aplicação
├── constants.ts                  # Constantes globais (rotas, status, etc)
└── middleware.ts                 # Middleware Next.js
```

## 🏗️ Arquitetura em Camadas

### 1. **Presentation Layer** (UI)
- **Componentes**: `src/components/*`
- **Páginas**: `src/app/*`
- Responsabilidade: Renderização e interação com usuário

### 2. **State Management** (Client-side)
- **Hooks**: `src/hooks/*`
- **Stores** (quando necessário): Zustand/Context API
- Responsabilidade: Gerenciar estado da aplicação

### 3. **Business Logic Layer** (Features)
- **Features**: `src/features/*`
- Cada feature é independente e modular
- Contém: componentes + hooks + services + types específicos
- Responsabilidade: Lógica de negócio isolada por domínio

### 4. **Services Layer** (API & External)
- **Services**: `src/services/*`
- **ApiService**: Cliente HTTP centralizado
- Responsabilidade: Comunicação com backend e integrações externas

### 5. **Data Access Layer** (API Routes)
- **API Routes**: `src/app/api/*`
- Próxima camada: Prisma/ORM + Database

## 🎯 Padrões e Convenções

### Nomenclatura de Arquivos
- **Componentes React**: `PascalCase` (ex: `UserCard.tsx`)
- **Serviços**: `camelCase.service.ts` (ex: `user.service.ts`)
- **Hooks**: `use` + `PascalCase` (ex: `useUserForm.ts`)
- **Types**: `PascalCase.ts` (ex: `User.ts`)
- **Utils**: `camelCase.ts` (ex: `formatPhone.ts`)

### Estrutura de Feature

Cada feature segue este padrão:

```
features/[feature-name]/
├── components/           # Componentes específicos da feature
│   ├── index.ts
│   ├── FeatureList.tsx
│   ├── FeatureForm.tsx
│   └── FeatureDetail.tsx
├── hooks/                # Hooks customizados da feature
│   ├── index.ts
│   ├── useFeatureList.ts
│   └── useFeatureForm.ts
├── services/             # Serviços específicos da feature
│   ├── index.ts
│   └── feature.service.ts
├── types/                # Tipos TypeScript da feature
│   ├── index.ts
│   └── feature.types.ts
├── index.ts              # Export central da feature
└── README.md             # Documentação da feature (opcional)
```

### Exportações Centralizadas

Usar `index.ts` para re-exportar tudo de cada módulo:

```typescript
// src/features/contacts/index.ts
export * from './components'
export * from './hooks'
export * from './services'
export * from './types'
```

Isso permite imports limpos:
```typescript
import { ContactList, useContacts } from '@/features/contacts'
```

## 🔄 Fluxo de Dados

```
User Interaction (UI)
        ↓
    Component
        ↓
    Custom Hook (useFeature)
        ↓
    Service (feature.service.ts)
        ↓
    ApiService (centralized HTTP)
        ↓
    API Route (src/app/api/*)
        ↓
    Backend/Database
        ↓
    Response
        ↓
    State Update (Hook + Component)
        ↓
    Rerender
```

## 📦 Path Aliases

Configurado em `tsconfig.json`:
```json
{
  "paths": {
    "@/*": ["./src/*"]
  }
}
```

Exemplos de uso:
```typescript
import { Button } from '@/components/ui'
import { useContacts } from '@/features/contacts'
import { ROUTES } from '@/constants'
import { formatPhone } from '@/lib/utils'
```

## 🚀 Como Adicionar uma Nova Feature

1. **Criar estrutura de pastas**:
   ```bash
   mkdir -p src/features/new-feature/{components,hooks,services,types}
   ```

2. **Criar `index.ts` arquivos**:
   ```typescript
   // src/features/new-feature/index.ts
   export * from './components'
   export * from './hooks'
   export * from './services'
   export * from './types'
   ```

3. **Criar tipos**:
   ```typescript
   // src/features/new-feature/types/index.ts
   export interface NewFeature {
     id: string
     name: string
     // ...
   }
   ```

4. **Criar componentes**:
   ```typescript
   // src/features/new-feature/components/NewFeatureList.tsx
   'use client'
   import { NewFeature } from '../types'

   export function NewFeatureList() {
     // Implementation
   }

   export function NewFeatureForm() {
     // Implementation
   }
   ```

5. **Criar serviço**:
   ```typescript
   // src/features/new-feature/services/index.ts
   export class NewFeatureService {
     async list() { }
     async create(data: any) { }
     async update(id: string, data: any) { }
     async delete(id: string) { }
   }
   ```

6. **Criar hooks**:
   ```typescript
   // src/features/new-feature/hooks/index.ts
   export function useNewFeatureList() {
     // Implementation
   }
   ```

7. **Registrar em `src/features/index.ts`**:
   ```typescript
   export * from './new-feature'
   ```

8. **Criar API routes** (se necessário):
   ```typescript
   // src/app/api/new-feature/route.ts
   export async function GET() { }
   export async function POST() { }
   ```

## 🔐 Segurança

- **Middleware**: `src/middleware.ts` para proteção de rotas
- **Env vars**: `.env.local` para secrets
- **API validation**: Zod para validação de schema
- **RBAC**: Role-based access control por feature
- **CSRF Protection**: Implementado via headers

## 📊 Estado e Gerenciamento

- **Server State**: Use `useQuery` (TanStack Query) para dados do servidor
- **Client State**: Use `useState` ou Zustand para UI state
- **Form State**: Use `react-hook-form` + `zod`
- **Global State**: Zustand para estado global compartilhado

## 🧪 Testes

Estrutura de testes seguirá a mesma estrutura do código:
```
tests/
├── unit/
│   └── features/[feature-name]/
├── integration/
├── e2e/
└── __mocks__/
```

## 📝 Próximos Passos

1. Instalar dependências (Prisma, Auth, UI libs, etc)
2. Configurar database
3. Implementar autenticação
4. Criar primeiras features
5. Setup de testes

---

**Última atualização**: 02/07/2026  
**Versão da Arquitetura**: 1.0
