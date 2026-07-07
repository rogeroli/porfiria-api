# ADR-0002: Usar Prisma, PostgreSQL e Docker Compose para Desenvolvimento Local

## Status
Aceito

## Contexto
A API precisa de um banco de dados relacional, alterações estruturais versionadas e um ambiente local repetível para desenvolvimento.

## Decisão
O projeto usará Prisma ORM como única camada de acesso a dados da aplicação, PostgreSQL como banco de dados principal e Docker Compose para executar a infraestrutura local.

## Alternativas Consideradas
- Acesso SQL direto: poderoso, mas contorna a regra do projeto de manter o acesso ao banco centralizado por meio do Prisma.
- Executar PostgreSQL manualmente em cada máquina: funciona, mas dificulta o onboarding e a consistência entre ambientes.

## Consequências
- Alterações estruturais no banco de dados devem ser representadas por atualizações no schema do Prisma e migrations.
- Pessoas desenvolvedoras podem iniciar a infraestrutura local com Docker Compose.
- O acesso ao banco de dados deve permanecer dentro de services e repositories baseados em Prisma.
- Tokens de sessão não devem ser armazenados no PostgreSQL; refresh tokens devem usar Redis com TTL.

## Especificações Relacionadas
- Nenhuma.
