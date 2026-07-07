# AGENTS.md

# Porfiria Academy - Backend API

## Objetivo

Este repositório contém a API do Porfiria Academy.

A API é responsável por toda a regra de negócio da plataforma, incluindo autenticação, autorização, usuários, cursos, trilhas de aprendizagem, mentorias, comunidade, notificações, certificados e futuras integrações.

O projeto deve ser desenvolvido priorizando simplicidade, escalabilidade, legibilidade e facilidade de manutenção.

---

# Desenvolvimento Orientado por Especificações (SDD)

Este projeto utiliza Specification-Driven Development (SDD).

Antes de implementar qualquer funcionalidade:

1. Leia a Specification correspondente.
2. Entenda os critérios de aceitação.
3. Verifique se existe algum ADR relacionado.
4. Tire dúvidas antes da implementação, caso existam.
5. Implemente somente o que estiver especificado.
6. Atualize a documentação quando necessário.

Nunca implemente funcionalidades baseadas apenas em suposições.

---

# Arquitetura

A aplicação deve seguir uma arquitetura **Modular Monolith**, utilizando os recursos nativos do NestJS.

Cada domínio representa um módulo independente.

Exemplo:

```
src/
    auth/
    users/
    courses/
    academy/
    mentoring/
    notifications/
    common/
    config/
    prisma/
```

Cada módulo deve possuir alta coesão e baixo acoplamento.

Evitar dependências circulares.

A comunicação entre módulos deve ocorrer através de Services públicos ou eventos quando apropriado.

Os módulos devem ser desenvolvidos pensando em uma futura extração para microsserviços, caso necessário.

---

# Organização dos módulos

Cada módulo deve possuir apenas os artefatos necessários.

Exemplo:

```
auth/

auth.module.ts
auth.controller.ts
auth.service.ts

dto/
entities/
guards/
strategies/
repositories/
mappers/

tests/
```

Nem todo módulo precisa possuir todas essas pastas.

Criar apenas quando houver necessidade.

---

# Filosofia de Desenvolvimento

Priorizar código simples.

Evitar abstrações prematuras.

Evitar excesso de interfaces.

Evitar criar camadas sem necessidade.

A arquitetura deve servir ao projeto, e não o contrário.

---

# DDD

Utilizar conceitos de Domain-Driven Design de forma pragmática.

Aplicar:

- Linguagem Ubíqua
- Bounded Contexts
- Entidades
- Agregados quando fizer sentido

Evitar complexidade desnecessária.

Não criar Value Objects, Factories, Specifications ou Domain Services sem necessidade real.

---

# Stack

- Node.js LTS
- NestJS
- TypeScript
- Prisma ORM
- PostgreSQL
- Redis
- JWT
- Passport
- Swagger
- Docker

---

# Banco de Dados

Utilizar exclusivamente Prisma ORM.

Nunca acessar PostgreSQL diretamente utilizando SQL, exceto quando houver justificativa técnica documentada.

Toda alteração estrutural deve gerar uma nova Migration.

Nunca alterar migrations antigas.

Sempre versionar o banco.

---

# Segurança

Autenticação:

- JWT Access Token
- Refresh Token

Criptografia:

- bcrypt

Nunca:

- armazenar senhas em texto puro
- retornar hashes
- expor informações sensíveis

Sempre validar permissões.

---

# API

Toda API deve possuir:

- DTOs
- Validação
- Swagger
- Tratamento consistente de erros
- Responses padronizadas

Utilizar class-validator.

---

# Código

Escrever código legível.

Priorizar clareza.

Evitar duplicação.

Não utilizar "any".

Seguir princípios SOLID quando agregarem valor.

Quando um Service crescer excessivamente, dividir responsabilidades.

---

# Performance

Evitar:

- consultas desnecessárias
- N+1 queries
- processamento duplicado

Pensar em escalabilidade desde o início.

---

# Testes

Toda funcionalidade deve possuir testes.

Prioridade:

- Unit Tests
- Integration Tests

Antes de concluir qualquer implementação executar:

```
npm run lint
npm run test
npm run build
```

---

# Documentação

Toda funcionalidade implementada deve possuir uma Specification aprovada.

Nunca implementar funcionalidades sem Specification.

Sempre manter Swagger atualizado.

Atualizar documentação sempre que necessário.

---

# Dependências

Antes de adicionar uma nova biblioteca:

- verificar necessidade
- evitar dependências redundantes
- preferir soluções nativas

Toda nova dependência deve possuir justificativa técnica.

---

# Commits

Utilizar Conventional Commits.

Exemplos:

```
feat(auth): implement login

feat(users): create profile endpoint

fix(auth): validate refresh token

refactor(courses): simplify enrollment service
```

---

# Pull Requests

Toda Pull Request deve:

- seguir a Specification
- passar no lint
- passar nos testes
- compilar
- manter a documentação atualizada

---

# Objetivo Final

Construir uma API organizada, modular, testável e preparada para evoluir durante os próximos anos.

A prioridade é manter uma base de código simples de entender, fácil de manter e preparada para o crescimento do Porfiria Academy sem necessidade de grandes refatorações.