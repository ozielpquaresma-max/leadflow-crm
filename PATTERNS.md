/**
 * @file Exemplo de Padrão - Como adicionar novos componentes
 * 
 * Este arquivo serve como referência para manter consistência
 * na adição de novos componentes, hooks e serviços.
 */

// ============================================================================
// 1. CRIAR COMPONENTE
// ============================================================================

// src/components/ui/Button.tsx
// 'use client'

// import { cn } from '@/lib/utils'

// interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
//   variant?: 'primary' | 'secondary' | 'danger'
//   size?: 'sm' | 'md' | 'lg'
//   isLoading?: boolean
// }

// export function Button({
//   variant = 'primary',
//   size = 'md',
//   isLoading = false,
//   className,
//   children,
//   disabled,
//   ...props
// }: ButtonProps) {
//   return (
//     <button
//       className={cn(
//         'font-medium transition-colors focus:outline-none focus:ring-2',
//         {
//           'px-4 py-2 text-sm': size === 'sm',
//           'px-6 py-3 text-base': size === 'md',
//           'px-8 py-4 text-lg': size === 'lg',
//           'bg-primary text-white hover:bg-primary-dark': variant === 'primary',
//           'bg-secondary text-white hover:bg-secondary-dark': variant === 'secondary',
//           'bg-error text-white hover:bg-red-700': variant === 'danger',
//           'opacity-50 cursor-not-allowed': disabled || isLoading,
//         },
//         className
//       )}
//       disabled={disabled || isLoading}
//       {...props}
//     >
//       {isLoading && <span className="spinner mr-2" />}
//       {children}
//     </button>
//   )
// }

// ============================================================================
// 2. EXPORTAR COMPONENTE
// ============================================================================

// src/components/ui/index.ts
// export { Button } from './Button'

// ============================================================================
// 3. CRIAR TIPO
// ============================================================================

// src/features/contacts/types/contact.types.ts
// export interface Contact {
//   id: string
//   email: string
//   firstName: string
//   lastName: string
//   phone?: string
//   organizationId: string
//   createdAt: Date
//   updatedAt: Date
// }

// export type CreateContactInput = Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>
// export type UpdateContactInput = Partial<CreateContactInput>

// ============================================================================
// 4. CRIAR SERVIÇO
// ============================================================================

// src/features/contacts/services/contact.service.ts
// import { apiService } from '@/services'
// import { Contact, CreateContactInput } from '../types'

// export class ContactService {
//   async listContacts(page = 1, limit = 20) {
//     return apiService.get(`/api/contacts?page=${page}&limit=${limit}`)
//   }

//   async getContact(id: string) {
//     return apiService.get(`/api/contacts/${id}`)
//   }

//   async createContact(data: CreateContactInput) {
//     return apiService.post('/api/contacts', data)
//   }

//   async updateContact(id: string, data: Partial<CreateContactInput>) {
//     return apiService.put(`/api/contacts/${id}`, data)
//   }

//   async deleteContact(id: string) {
//     return apiService.delete(`/api/contacts/${id}`)
//   }
// }

// ============================================================================
// 5. CRIAR HOOK
// ============================================================================

// src/features/contacts/hooks/useContacts.ts
// 'use client'

// import { useEffect, useState } from 'react'
// import { ContactService } from '../services'
// import { Contact } from '../types'

// export function useContacts() {
//   const [contacts, setContacts] = useState<Contact[]>([])
//   const [loading, setLoading] = useState(false)
//   const [error, setError] = useState<string | null>(null)

//   const contactService = new ContactService()

//   useEffect(() => {
//     const fetchContacts = async () => {
//       setLoading(true)
//       try {
//         const response = await contactService.listContacts()
//         if (response.success) {
//           setContacts(response.data)
//         } else {
//           setError(response.error || 'Error fetching contacts')
//         }
//       } catch (err) {
//         setError(err instanceof Error ? err.message : 'Unknown error')
//       } finally {
//         setLoading(false)
//       }
//     }

//     fetchContacts()
//   }, [])

//   return { contacts, loading, error }
// }

// ============================================================================
// 6. CRIAR COMPONENTE DA FEATURE
// ============================================================================

// src/features/contacts/components/ContactList.tsx
// 'use client'

// import { useContacts } from '../hooks'

// export function ContactList() {
//   const { contacts, loading, error } = useContacts()

//   if (loading) return <div>Loading...</div>
//   if (error) return <div>Error: {error}</div>

//   return (
//     <div>
//       <h1>Contacts</h1>
//       <ul>
//         {contacts.map((contact) => (
//           <li key={contact.id}>
//             {contact.firstName} {contact.lastName} - {contact.email}
//           </li>
//         ))}
//       </ul>
//     </div>
//   )
// }

// ============================================================================
// 7. REGISTRAR EXPORTS
// ============================================================================

// src/features/contacts/types/index.ts
// export * from './contact.types'

// src/features/contacts/services/index.ts
// export { ContactService } from './contact.service'

// src/features/contacts/hooks/index.ts
// export { useContacts } from './useContacts'

// src/features/contacts/components/index.ts
// export { ContactList } from './ContactList'

// src/features/contacts/index.ts
// export * from './components'
// export * from './hooks'
// export * from './services'
// export * from './types'

// ============================================================================
// 8. USAR A FEATURE
// ============================================================================

// src/app/(auth)/contacts/page.tsx
// import { ContactList } from '@/features/contacts'

// export default function ContactsPage() {
//   return <ContactList />
// }

// ============================================================================
// 9. CRIAR API ROUTE
// ============================================================================

// src/app/api/contacts/route.ts
// import { NextRequest, NextResponse } from 'next/server'
// import { createSuccessResponse, createErrorResponse } from '@/lib/api'

// export async function GET(request: NextRequest) {
//   try {
//     // Fetch from database
//     const contacts = []

//     return NextResponse.json(
//       createSuccessResponse(contacts),
//       { status: 200 }
//     )
//   } catch (error) {
//     return NextResponse.json(
//       createErrorResponse('Failed to fetch contacts'),
//       { status: 500 }
//     )
//   }
// }

// export async function POST(request: NextRequest) {
//   try {
//     const data = await request.json()

//     // Validate and save to database
//     const newContact = {} // Created contact

//     return NextResponse.json(
//       createSuccessResponse(newContact, 'Contact created successfully'),
//       { status: 201 }
//     )
//   } catch (error) {
//     return NextResponse.json(
//       createErrorResponse('Failed to create contact'),
//       { status: 500 }
//     )
//   }
// }
