# Especificação: Login e Refresh Token

## Status
Aceito

## Contexto
Após o cadastro, pessoas usuárias precisam autenticar na plataforma e acessar áreas protegidas, como a dashboard.

O sistema deve usar access token de curta duração e refresh token rotativo armazenado no Redis para renovar a sessão sem exigir novo login a cada expiração.

## Objetivo
Autenticar usuário por email e senha, emitir access token válido por 30 minutos e refresh token revogável.

## Escopo
- Criar endpoint `POST /api/auth/login`.
- Criar endpoint `POST /api/auth/refresh`.
- Criar endpoint `POST /api/auth/logout`.
- Emitir access token JWT com expiração de 30 minutos.
- Emitir refresh token opaco válido por 24 horas.
- Armazenar no Redis apenas o hash do refresh token, com TTL.
- Validar senha usando bcrypt.
- Revogar refresh token no logout.

## Fora de Escopo
- Tela de alteração de senha funcional.
- Recuperação de senha.
- MFA.
- Bloqueio por tentativas inválidas.

## Regras de Negócio
- Login deve aceitar email e senha.
- Access token deve expirar em 30 minutos.
- Refresh token deve expirar em 24 horas.
- Refresh token deve ser rotacionado a cada chamada de refresh.
- Refresh token deve ser armazenado no Redis apenas como hash.
- Nenhum token deve ser armazenado no PostgreSQL.
- Senha deve ser comparada com bcrypt.
- A API nunca deve retornar `passwordHash`.
- Credenciais inválidas devem retornar `401 Unauthorized`.
- Refresh token inválido, expirado ou revogado deve retornar `401 Unauthorized`.

## Contratos de API
### Login
`POST /api/auth/login`

#### Requisição
```json
{
  "email": "maria@example.com",
  "password": "Senha@123"
}
```

#### Resposta de Sucesso
```json
{
  "success": true,
  "data": {
    "accessToken": "jwt",
    "refreshToken": "opaque-token",
    "expiresIn": 1800,
    "user": {
      "id": "uuid",
      "name": "Maria Silva",
      "profile": "PATIENT",
      "email": "maria@example.com",
      "createdAt": "2026-07-07T00:00:00.000Z"
    }
  }
}
```

### Refresh
`POST /api/auth/refresh`

#### Requisição
```json
{
  "refreshToken": "opaque-token"
}
```

### Logout
`POST /api/auth/logout`

#### Requisição
```json
{
  "refreshToken": "opaque-token"
}
```

## Impacto no Modelo de Dados
Não há armazenamento de tokens no PostgreSQL.

O Redis deve armazenar chaves no formato `auth:refresh-token:{hash}` com TTL de 24 horas.

## Testes Esperados
- Testes unitários para login, refresh e logout.
- `npm run lint`
- `npm run test`
- `npm run build`

## ADRs Relacionados
- `docs/adrs/0001-use-nestjs-modular-monolith.md`
- `docs/adrs/0002-use-prisma-postgresql-and-docker-compose.md`
