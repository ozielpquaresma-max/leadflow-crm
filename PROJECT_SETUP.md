# 🎯 LeadFlow CRM - Arquitetura Escalável SaaS

> Um CRM profissional e escalável construído com Next.js 16, TypeScript e App Router, preparado para produção em SaaS.

## 🚀 Quick Start

### Pré-requisitos
- Node.js 18+ 
- npm ou yarn
- PostgreSQL 12+ (recomendado)

### Instalação

1. Clone o repositório
```bash
git clone <repository-url>
cd leadflow-crm
```

2. Instale as dependências
```bash
npm install
```

3. Configure as variáveis de ambiente
```bash
cp .env.example .env.local
# Edite .env.local com suas configurações
```

4. Execute as migrations do banco de dados
```bash
npm run prisma:migrate
```

5. Inicie o servidor de desenvolvimento
```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no seu navegador.

## 📚 Documentação

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Documentação completa da arquitetura
- **[API.md](./docs/API.md)** - Documentação da API (em desenvolvimento)
- **[FEATURES.md](./docs/FEATURES.md)** - Descrição de cada feature (em desenvolvimento)

## 🏗️ Estrutura do Projeto

A arquitetura foi desenvolvida seguindo princípios **SOLID** e **Domain-Driven Design (DDD)**:

```
src/
├── app/              # Next.js App Router + API Routes
├── features/         # Módulos independentes de funcionalidades
├── components/       # Componentes reutilizáveis globais
├── hooks/            # Hooks customizados
├── services/         # Serviços de negócio e API
├── lib/              # Utilitários e helpers
├── types/            # Definições TypeScript
├── styles/           # Estilos globais
├── config.ts         # Configurações
└── constants.ts      # Constantes
```

Para detalhes completos da arquitetura, veja [ARCHITECTURE.md](./ARCHITECTURE.md).

## ✨ Features Implementadas (Roadmap)

- [ ] **Auth** - Autenticação e autorização
- [ ] **Dashboard** - Overview e KPIs
- [ ] **Leads** - Gestão de leads
- [ ] **Contacts** - Gestão de contatos
- [ ] **Companies** - Gestão de empresas
- [ ] **Pipeline** - Kanban board de vendas
- [ ] **Calendar** - Calendário e agendamentos
- [ ] **Tasks** - Gerenciamento de tarefas
- [ ] **WhatsApp** - Integração WhatsApp
- [ ] **Proposals** - Criação de propostas
- [ ] **Finance** - Faturamento e invoices
- [ ] **Reports** - Relatórios e analytics
- [ ] **Settings** - Configurações da aplicação

## 🛠️ Tech Stack

### Frontend
- **React 19** com React Compiler
- **Next.js 16** com App Router
- **TypeScript 5**
- **Tailwind CSS 4**

### Backend (Preparado para)
- **Next.js API Routes**
- **Prisma ORM** (a instalar)
- **PostgreSQL** (recomendado)
- **NextAuth.js** (a instalar)

### Quality & Testing (Preparado para)
- **ESLint 9**
- **Vitest** (a instalar)
- **Playwright** (a instalar)

## 📋 Scripts Disponíveis

```bash
# Development
npm run dev              # Inicia servidor de desenvolvimento
npm run build           # Build para produção
npm start               # Inicia servidor em produção
npm run lint            # Executa ESLint

# Database (quando Prisma for instalado)
npm run prisma:migrate  # Cria migrations
npm run prisma:studio   # Abre Prisma Studio
npm run prisma:seed     # Executa seed

# Testing (quando testes forem implementados)
npm run test            # Executa testes unitários
npm run test:e2e        # Executa testes E2E
```

## 🔐 Segurança

- ✅ TypeScript stricto para type-safety
- ✅ Path aliases para imports seguros
- ✅ Middleware para proteção de rotas
- 🔜 CSRF protection (a implementar)
- 🔜 Rate limiting (a implementar)
- 🔜 Validação de schema com Zod (a implementar)
- 🔜 Criptografia de dados sensíveis (a implementar)

## 📊 Escalabilidade

A arquitetura foi desenhada para:
- ✅ Separação de concerns com features modulares
- ✅ Reutilização de componentes globais
- ✅ Hooks customizados para lógica compartilhada
- 🔜 Multi-tenancy (a implementar)
- 🔜 Caching com Redis (a implementar)
- 🔜 Database sharding (a implementar)

## 🚢 Deployment

Preparado para deployment em:
- **Vercel** (recomendado para Next.js)
- **Railway**
- **Render**
- **AWS / Azure / Google Cloud**

Veja [DEPLOYMENT.md](./docs/DEPLOYMENT.md) para instruções detalhadas (em desenvolvimento).

## 🤝 Contribuição

Para adicionar uma nova feature:

1. Crie a estrutura em `src/features/[feature-name]`
2. Siga o padrão definido em [ARCHITECTURE.md](./ARCHITECTURE.md)
3. Registre em `src/features/index.ts`
4. Crie API routes em `src/app/api/[feature-name]`
5. Adicione testes
6. Atualize a documentação

## 📝 Licença

Este projeto é propriedade de LeadFlow. Todos os direitos reservados.

## 🆘 Suporte

Para dúvidas ou problemas:
1. Verifique a documentação em [ARCHITECTURE.md](./ARCHITECTURE.md)
2. Abra uma issue no repositório
3. Entre em contato com a equipe

---

**Desenvolvido com ❤️ para CRM SaaS Moderno**

Última atualização: 02/07/2026
