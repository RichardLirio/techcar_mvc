# 🚗 Sistema de Gestão para Oficina Mecânica

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Fastify](https://img.shields.io/badge/Fastify-000000?style=for-the-badge&logo=fastify&logoColor=white)](https://www.fastify.io/)
[![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![JWT](https://img.shields.io/badge/JWT-black?style=for-the-badge&logo=JSON%20web%20tokens)](https://jwt.io/)

## 📋 Sobre o Projeto

Sistema completo de gestão para oficinas mecânicas desenvolvido com **TypeScript**, **Fastify** e **Prisma ORM**. O sistema oferece controle total sobre clientes, veículos, estoque de peças, ordens de serviço e usuários, com autenticação JWT e controle de permissões baseado em roles.

### 🎯 Principais Funcionalidades

- **🔐 Autenticação e Autorização**: JWT com middleware personalizado e controle de roles (ADMIN/USER)
- **👥 Gestão de Clientes**: CRUD completo com validação de CPF/CNPJ
- **🚙 Gestão de Veículos**: Controle de frota vinculada aos clientes
- **📦 Controle de Estoque**: Gestão inteligente de peças com alertas de estoque insuficiente
- **📋 Ordens de Serviço**: Sistema completo com cálculo automático e controle de status
- **🖨️ Geração de PDF**: Impressão profissional de ordens de serviço com layout customizado
- **💰 Gestão Financeira**: Controle de descontos, preços e valores totais
- **🔄 Transações Seguras**: Uso de transações de banco para garantir consistência

## 🛠️ Stack Tecnológica

### Backend
- **Node.js** - Runtime JavaScript
- **TypeScript** - Superset tipado do JavaScript
- **Fastify** - Framework web de alta performance
- **Prisma ORM** - ORM moderno e type-safe
- **PostgreSQL** - Banco de dados relacional
- **Zod** - Validação de schemas e tipos
- **JWT** - Autenticação stateless
- **bcrypt** - Hash de senhas
- **Puppeteer** - Geração de PDFs e automação de navegador

### DevOps & Tools
- **Docker** - Containerização
- **ESLint** - Linting de código
- **Prettier** - Formatação de código
- **Husky** - Git hooks
- **Conventional Commits** - Padrão de commits

## 🏗️ Arquitetura

```
├── .env.example
├── .github
    └── workflows
    │   └── run-e2e-tests.yml
├── .gitignore
├── .husky
    ├── commit-msg
    └── pre-commit
├── LICENSE
├── README.md
├── client.http
├── commitlint.config.js
├── docker-compose.yml
├── eslint.config.mjs
├── ordem_servico_exemplo.pdf
├── ordem_servico_preview.html
├── package-lock.json
├── package.json
├── prisma
    ├── migrations
    │   ├── 20250708121623_create_database
    │   │   └── migration.sql
    │   └── migration_lock.toml
    ├── schema.prisma
    └── seed.ts
├── src
    ├── @types
    │   ├── fastify-jwt.d.ts
    │   └── response.d.ts
    ├── app.ts
    ├── env
    │   └── index.ts
    ├── lib
    │   └── database.ts
    ├── middlewares
    │   ├── verify-jwt.ts
    │   └── verify-user-role.ts
    ├── modules
    │   ├── auth
    │   │   ├── auth.controller.e2e.spec.ts
    │   │   ├── auth.controller.ts
    │   │   └── auth.routes.ts
    │   ├── clients
    │   │   ├── clients.controller.ts
    │   │   ├── clients.routes.ts
    │   │   ├── create.client.controller.e2e.spec.ts
    │   │   ├── delete.client.controller.e2e.spec.ts
    │   │   ├── fetch.clients.controller.e2e.spec.ts
    │   │   ├── get.client.controller.e2e.spec.ts
    │   │   └── update.client.controller.e2e.spec.ts
    │   ├── order
    │   │   ├── create.order.controller.e2e.spec.ts
    │   │   ├── delete.order.controller.e2e.spec.ts
    │   │   ├── get.order.controller.e2e.spec.ts
    │   │   ├── order.controller.ts
    │   │   ├── order.print.service.ts
    │   │   ├── order.routes.ts
    │   │   ├── update.order.controller.e2e.spec.ts
    │   │   └── update.status.order.controller.e2e.spec.ts
    │   ├── parts
    │   │   ├── create.parts.controller.e2e.spec.ts
    │   │   ├── delete.parts.controller.e2e.spec.ts
    │   │   ├── fetch.parts.controller.e2e.spec.ts
    │   │   ├── get.part.controller.e2e.spec.ts
    │   │   ├── parts.controller.ts
    │   │   ├── parts.routes.ts
    │   │   └── update.parts.controller.e2e.spec.ts
    │   ├── users
    │   │   ├── create.user.controller.e2e.spec.ts
    │   │   ├── delete.user.controller.e2e.spec.ts
    │   │   ├── fetch.users.controller.e2e.spec.ts
    │   │   ├── get.user.controller.e2e.spec.ts
    │   │   ├── update.user.controller.e2e.spec.ts
    │   │   ├── user.controller.ts
    │   │   └── users.routes.ts
    │   └── vehicle
    │   │   ├── create.vehicle.controller.e2e.spec.ts
    │   │   ├── delete.vehicle.controller.e2e.spec.ts
    │   │   ├── fetch.vehicles.controller.e2e.spec.ts
    │   │   ├── get.vehicle.controller.e2e.spec.ts
    │   │   ├── update.vehicle.controller.e2e.spec.ts
    │   │   ├── vehicle.controller.ts
    │   │   └── vehicle.routes.ts
    ├── schemas
    │   ├── clients.schemas.ts
    │   ├── common.schemas.ts
    │   ├── orders.schemas.ts
    │   ├── parts.schemas.ts
    │   ├── users.schemas.ts
    │   ├── validation.ts
    │   └── vehicles.schemas.ts
    ├── server.ts
    └── utils
    │   ├── compare-password.ts
    │   ├── formata-cpfCnpj.ts
    │   ├── formata-placa-veiculos.ts
    │   ├── hash-password.ts
    │   └── http-error.ts
├── test
    ├── e2e-setup.ts
    └── factories
    │   ├── create-order-for-tests.ts
    │   ├── create-users-for-tests.ts
    │   └── return-auth-cookies.ts
├── tsconfig.json
└── vitest.config.mts
```

## 🚀 Principais Recursos Técnicos

### 1. **Controle de Transações Avançado**
```typescript
// Exemplo de transação complexa com rollback automático
const order = await prisma.$transaction(async (tx) => {
  // Criar ordem
  const newOrder = await tx.order.create({...})
  
  // Atualizar estoque
  for (const item of data.items) {
    await tx.part.update({
      where: { id: item.partId },
      data: { quantity: { decrement: item.quantity } }
    })
  }
  
  return newOrder
})
```

### 2. **Validação Robusta com Zod**
```typescript
const createOrderSchema = z.object({
  clientId: z.string().min(1, "Cliente é obrigatório"),
  vehicleId: z.string().min(1, "Veículo é obrigatório"),
  description: z.string().toUpperCase().optional(),
  kilometers: z.number().min(1, "Quilometragem é obrigatória"),
  discount: z
    .number()
    .min(0, "Desconto deve ser maior ou igual a 0")
    .default(0),
  services: z
    .array(serviceSchema)
    .min(1, "Pelo menos um serviço é obrigatório"),
  items: z.array(orderItemSchema).default([]),
});
```

### 3. **Middleware de Autenticação**
```typescript
export async function VerifyJWT(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
  } catch (_) {
    return reply.status(401).send({ error: "Unauthorized." }); 
  }
}
```

### 4. **Geração de PDF com Puppeteer**
```typescript
// Geração de PDF profissional com layout customizado
const gerador = new GeradorOrdemServico();
try {
  await gerador.inicializar();
  const pdfBuffer = await gerador.gerarPDFJson(order);

  reply
    .header("Content-Type", "application/pdf")
    .header("Content-Disposition", `inline; filename=OS-${order.id}.pdf`)
    .header("Content-Length", pdfBuffer.length);

  return reply.send(Buffer.from(pdfBuffer));
} catch (error) {
  console.error("Erro ao gerar OS:", error);
  throw new HttpError(`Erro ao gerar OS ${order.id}`, 409);
} finally {
  await gerador.finalizar();
}
  
```

### 5. **Controle de Estoque Inteligente**
- Verificação automática de disponibilidade
- Atualização em tempo real
- Restauração automática em cancelamentos

### 6. **Sistema de Permissões Granular**
- Controle baseado em roles (ADMIN/USER)
- Restrições específicas por funcionalidade
- Middleware de autorização reutilizável

## 📊 Modelo de Dados

```prisma
model Order {
  id          String      @id @default(cuid())
  clientId    String
  vehicleId   String
  status      OrderStatus @default(IN_PROGRESS)
  description String?
  kilometers  Int
  discount    Decimal     @default(0)
  totalValue  Decimal     @default(0)
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  client   Client      @relation(fields: [clientId], references: [id])
  vehicle  Vehicle     @relation(fields: [vehicleId], references: [id])
  services Service[]
  items    OrderItem[]

  @@map("orders")
}
```

## 🖨️ Exemplos de Impressão

O sistema gera ordens de serviço com layout profissional, incluindo todas as informações necessárias:

### 📄 Exemplo de Ordem de Serviço (PDF)
![Exemplo PDF](./ordem_servico_exemplo.pdf)

### 🌐 Exemplo de Ordem de Serviço (HTML)
![Exemplo HTML](./ordem_servico_preview.html)

### Características da Impressão:
- **Layout Profissional**: Design limpo e organizado
- **Informações Completas**: Dados do cliente, veículo, serviços e peças
- **Cálculos Automáticos**: Subtotais, descontos e valor total
- **Branding**: Logo e informações da oficina
- **Responsivo**: Adaptável para diferentes tamanhos de papel

## 🔧 Instalação e Uso

### Pré-requisitos
- Node.js 20+
- PostgreSQL 13+
- Docker (opcional)

### Instalação

```bash
# Clone o repositório
git clone https://github.com/RichardLirio/techcar_mvc.git
cd oficina-mecanica

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env

# Execute as migrações
npx prisma migrate dev

# Inicie o servidor
npm run dev
```

### Variáveis de Ambiente

```env
# Configuração básica do servidor
NODE_ENV=development
PORT=3333
HOST=localhost
APP_VERSION=1.0.0

# Database (obrigatório em produção)
DATABASE_URL=postgresql://user:password@localhost:5432/database

# JWT (obrigatório em produção)
JWT_SECRET=seu-jwt-secret-super-seguro-com-pelo-menos-32-caracteres
JWT_EXPIRES_IN=1d

# Rate Limiting
RATE_LIMIT_MAX=100

# CORS (separar múltiplas origens por vírgula)
CORS_ORIGINS=http://localhost:3333,http://localhost:3001

## Database Docker
PG_USER=root
PG_PASSWORD=password
PG_DB=mydb

## Admin user access
ADMIN_USER_EMAIL="admin@admin.com"
ADMIN_USER_PASSWORD="admin@123"
```

## 📝 Endpoints da API

### Prefixo
- `/api/v1`

### Autenticação
- `POST /login` - Login do usuário
- `POST /logout` - Logout do usuário

### Clientes
- `GET /clients` - Listar clientes
- `POST /clients` - Criar cliente
- `GET /clients/:id` - Buscar cliente
- `PUT /clients/:id` - Atualizar cliente
- `DELETE /clients/:id` - Deletar cliente

### Ordens de Serviço
- `GET /orders` - Listar ordens
- `POST /orders` - Criar ordem
- `GET /orders/:id` - Buscar ordem
- `PUT /orders/:id` - Atualizar ordem
- `DELETE /orders/:id` - Deletar ordem
- `PATCH /orders/status/:id` - Atualizar status
- `GET /orders/:id/pdf` - **Gerar PDF da ordem de serviço**

### Veículos
- `GET /vehicles` - Listar veículos
- `POST /vehicles` - Criar veículo
- `GET /vehicles/:id` - Buscar veículo
- `PUT /vehicles/:id` - Atualizar veículo
- `DELETE /vehicles/:id` - Deletar veículo

### Peças
- `GET /parts` - Listar peças
- `POST /parts` - Criar peça
- `GET /parts/:id` - Buscar peça
- `PUT /parts/:id` - Atualizar peça
- `DELETE /parts/:id` - Deletar peça

### Usuários (Apenas ADMIN)
- `GET /users` - Listar usuários
- `POST /users` - Criar usuário
- `GET /users/:id` - Buscar usuário
- `PUT /users/:id` - Atualizar usuário
- `DELETE /users/:id` - Deletar usuário

## 🧪 Testes

```bash
# Executar testes unitários
npm run test

# Executar testes com coverage
npm run test:coverage

# Executar testes e2e
npm run test:e2e
```

## 📈 Performance e Otimizações

- **Queries Otimizadas**: Uso de `select` e `include` específicos
- **Indexação**: Índices estratégicos no banco de dados
- **Validação Eficiente**: Zod com parsing otimizado
- **Connection Pooling**: Gerenciamento eficiente de conexões
- **PDF Otimizado**: Geração eficiente com Puppeteer

## 🔒 Segurança

- **Hash de Senhas**: bcrypt com salt rounds configuráveis
- **JWT Seguro**: Tokens com expiração e refresh
- **Validação de Entrada**: Sanitização de todos os inputs
- **Rate Limiting**: Proteção contra ataques DDoS
- **CORS Configurado**: Controle de origem das requisições

## 📚 Padrões e Boas Práticas

### Arquitetura
- **Clean Architecture**: Separação clara de responsabilidades
- **SOLID Principles**: Código maintível e extensível
- **DRY (Don't Repeat Yourself)**: Reutilização de código
- **Type Safety**: TypeScript em toda a aplicação

### Código
- **Conventional Commits**: Padronização de commits
- **ESLint + Prettier**: Consistência de código
- **Error Handling**: Tratamento robusto de erros
- **Logging**: Sistema de logs estruturado

## 📖 Documentação Técnica (Em inglês)
**Documentação:** [deepwiki](https://deepwiki.com/RichardLirio/techcar_mvc/8.2-cicd-pipeline)  

## 📞 Contato

**Desenvolvedor:** Richard Lirio  
**Email:** richardlirio@hotmail.com  
**LinkedIn:** [Richard Lirio](https://www.linkedin.com/in/richard-silva-lirio-b97484250/)  
**GitHub:** [Richard Lirio](https://github.com/RichardLirio)

---

### 💡 **Competências Demonstradas**

✅ **TypeScript Avançado** - Tipos complexos, generics, decorators  
✅ **Arquitetura Limpa** - Separação de responsabilidades, SOLID  
✅ **ORM Moderno** - Prisma com relacionamentos complexos  
✅ **Autenticação Robusta** - JWT, middleware personalizado  
✅ **Validação Avançada** - Zod schemas, type-safe validation  
✅ **Transações de Banco** - Consistência de dados, rollback automático  
✅ **Controle de Permissões** - RBAC, middleware de autorização  
✅ **Geração de PDF** - Puppeteer, layouts profissionais  
✅ **Tratamento de Erros** - Error handling robusto  
✅ **Performance** - Queries otimizadas, indexação estratégica  
✅ **Segurança** - Hashing, sanitização, rate limiting  

### 🎯 **Diferenciais Técnicos**

- **Controle de Estoque em Tempo Real** com transações ACID
- **Sistema de Permissões Granular** baseado em roles
- **Geração de PDF Profissional** com layout customizado
- **Validação Type-Safe** em toda a aplicação
- **Arquitetura Escalável** preparada para crescimento
- **Código Limpo e Documentado** seguindo melhores práticas

Este projeto demonstra proficiência em desenvolvimento backend moderno, com foco em qualidade, segurança e performance. Ideal para posições que exigem conhecimento sólido em Node.js, TypeScript e arquitetura de sistemas.

---

*⭐ Se este projeto foi útil, considere dar uma estrela no repositório!*
