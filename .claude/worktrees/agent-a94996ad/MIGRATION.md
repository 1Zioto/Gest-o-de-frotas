# Guia de Migração — API Refatorada para Vercel Hobby Plan

## O Problema

O Vercel Hobby Plan permite no máximo **12 Serverless Functions** por deploy.
Cada arquivo dentro da pasta `/api` vira uma função. O projeto original tinha 13+ arquivos,
ultrapassando o limite.

---

## A Solução: Internal Router Pattern

Em vez de um arquivo por recurso, usamos **poucos arquivos em `/api`** que delegam
para **módulos internos em `/modules`**. Os módulos são simples funções TypeScript —
não viram funções serverless, são apenas código importado.

---

## Mapeamento de Rotas: Antes → Depois

| Antes (arquivo próprio)     | Depois (via query param `resource`)         |
|-----------------------------|---------------------------------------------|
| `/api/veiculos`             | `/api/frota?resource=veiculos`              |
| `/api/motoristas`           | `/api/frota?resource=motoristas`            |
| `/api/proprietarios`        | `/api/frota?resource=proprietarios`         |
| `/api/inspecoes`            | `/api/frota?resource=inspecoes`             |
| `/api/transportes`          | `/api/frota?resource=transportes`           |
| `/api/manutencoes`          | `/api/manutencao?resource=manutencoes`      |
| `/api/multas`               | `/api/manutencao?resource=multas`           |
| `/api/catalogos?resource=pneus` | `/api/manutencao?resource=pneus`        |
| `/api/abastecimentos`       | `/api/financeiro?resource=abastecimentos`   |
| `/api/admin?resource=despesas` | `/api/financeiro?resource=despesas`      |
| `/api/registros`            | `/api/financeiro?resource=registros`        |
| `/api/catalogos?resource=carretas` | `/api/catalogos?resource=carretas`  |
| `/api/catalogos?resource=oficinas` | `/api/catalogos?resource=oficinas`  |
| `/api/catalogos?resource=valores`  | `/api/catalogos?resource=valores`   |
| `/api/auth`                 | `/api/auth` *(sem mudança)*                 |
| `/api/admin?resource=dashboard` | `/api/admin?resource=dashboard`         |
| `/api/admin?resource=users`    | `/api/admin?resource=users`              |

**Total de funções serverless: 6** (auth, frota, manutencao, financeiro, catalogos, admin)

---

## Estrutura de Pastas

```
/api/                          ← Apenas 6 arquivos → 6 funções serverless
  auth.ts
  frota.ts
  manutencao.ts
  financeiro.ts
  catalogos.ts
  admin.ts

/modules/                      ← Código modular, NÃO vira função serverless
  shared/
    cors.ts                    ← Headers CORS centralizados
    middleware.ts              ← withAuth(), generateId()
  auth/
    login.ts
    register.ts
    verify.ts
  frota/
    veiculos.ts
    motoristas.ts
    proprietarios.ts
    inspecoes.ts
    transportes.ts
  manutencao/
    manutencoes.ts
    multas.ts
    pneus.ts
  financeiro/
    abastecimentos.ts
    despesas.ts
    registros.ts
  catalogos/
    carretas.ts
    oficinas.ts
    valores.ts
  admin/
    dashboard.ts
    users.ts
```

---

## Como Funciona

### 1. Requisição chega na Vercel
```
GET /api/frota?resource=veiculos&id=VEI-123
Authorization: Bearer <token>
```

### 2. `api/frota.ts` recebe a requisição
```typescript
// Lê o query param "resource"
const resource = req.query['resource']; // → "veiculos"

// Delega para o módulo correto
switch (resource) {
  case 'veiculos': return handleVeiculos(req, res);
  // ...
}
```

### 3. `modules/frota/veiculos.ts` executa a lógica
```typescript
export async function handleVeiculos(req, res) {
  // Lógica de CRUD completa aqui
}
```

---

## Como Atualizar o Frontend Angular

Localize as chamadas HTTP no seu `AuthService` e serviços de dados e
atualize as URLs. Exemplo:

```typescript
// ANTES
this.http.get('/api/veiculos')
this.http.get('/api/motoristas')
this.http.get('/api/abastecimentos')

// DEPOIS
this.http.get('/api/frota?resource=veiculos')
this.http.get('/api/frota?resource=motoristas')
this.http.get('/api/financeiro?resource=abastecimentos')
```

**Dica:** Crie constantes centralizadas para não espalhar as URLs:

```typescript
// src/app/core/api-routes.ts
export const API = {
  veiculos:        '/api/frota?resource=veiculos',
  motoristas:      '/api/frota?resource=motoristas',
  proprietarios:   '/api/frota?resource=proprietarios',
  inspecoes:       '/api/frota?resource=inspecoes',
  transportes:     '/api/frota?resource=transportes',
  manutencoes:     '/api/manutencao?resource=manutencoes',
  multas:          '/api/manutencao?resource=multas',
  pneus:           '/api/manutencao?resource=pneus',
  abastecimentos:  '/api/financeiro?resource=abastecimentos',
  despesas:        '/api/financeiro?resource=despesas',
  registros:       '/api/financeiro?resource=registros',
  carretas:        '/api/catalogos?resource=carretas',
  oficinas:        '/api/catalogos?resource=oficinas',
  valores:         '/api/catalogos?resource=valores',
  dashboard:       '/api/admin?resource=dashboard',
  users:           '/api/admin?resource=users',
  auth:            '/api/auth',
} as const;
```

---

## Como Adicionar Novos Endpoints

### Cenário 1: Novo recurso dentro de um módulo existente

Ex: adicionar `seguros` ao módulo `financeiro`.

**Passo 1** — Crie o arquivo do módulo:
```
modules/financeiro/seguros.ts
```
```typescript
export async function handleSeguros(req, res) {
  // lógica CRUD aqui
}
```

**Passo 2** — Registre no roteador `api/financeiro.ts`:
```typescript
import { handleSeguros } from '../modules/financeiro/seguros.js';

const RESOURCES = ['abastecimentos', 'despesas', 'registros', 'seguros'] as const;
// ...
case 'seguros': return handleSeguros(req, res);
```

**Passo 3** — Use no frontend:
```typescript
this.http.get('/api/financeiro?resource=seguros')
```

### Cenário 2: Novo módulo que exige uma nova função serverless

Use apenas se os módulos existentes ficarem sobrecarregados ou se precisar de
isolamento (ex: webhooks, integrações externas). Crie `/api/novo-modulo.ts`
e os módulos internos. O contador atual é **6 de 12**, então há 6 slots disponíveis.

---

## Boas Práticas Implementadas

### Validação de entrada
Todos os handlers validam campos obrigatórios antes de tocar o banco:
```typescript
if (!nome) return res.status(400).json({ error: 'Campo obrigatório: nome.' });
```

### Tratamento de erros centralizado
O `withAuth()` em `modules/shared/middleware.ts` envolve todos os handlers
protegidos em um `try/catch` global — erros inesperados retornam 500 com
mensagem legível ao invés de quebrar silenciosamente.

### CORS centralizado
`modules/shared/cors.ts` garante que todos os endpoints usam os mesmos headers,
sem duplicação.

### IDs únicos
`generateId('VEI')` gera IDs no formato `VEI-1713200000000-k2j9f` —
prefixo legível + timestamp + aleatório, sem depender de UUID externo.

### Sem `app.listen()`
Nenhum arquivo usa `express` ou inicia um servidor HTTP. Todos exportam
`export default async function handler(req, res)` — compatível 100% com Vercel serverless.

---

## Passos para Deploy

```bash
# 1. Substitua a pasta /api e crie a pasta /modules no seu projeto
# 2. Confirme que vercel.json está correto (já incluído)
# 3. Atualize as URLs no frontend Angular (veja seção acima)
# 4. Faça o deploy normalmente
vercel --prod
```
