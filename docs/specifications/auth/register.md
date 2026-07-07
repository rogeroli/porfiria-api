# Especificação: Cadastro de Usuário

## Status
Aceito

## Contexto
O Porfiria Academy precisa permitir o cadastro inicial de usuários para, posteriormente, autenticar e direcionar experiências de pacientes, médicos e pesquisadores.

Esta funcionalidade é o primeiro fluxo integrado entre Web e API.

## Objetivo
Criar uma conta de usuário com nome, perfil, email, senha e confirmação de senha, armazenando a senha de forma segura com hash criptográfico e retornando apenas dados públicos da conta criada.

## Escopo
- Criar enum de perfil de usuário no backend.
- Criar modelo `User` no Prisma.
- Criar endpoint público `POST /api/auth/register`.
- Validar dados recebidos com DTO e `class-validator`.
- Garantir email único.
- Validar política forte de senha.
- Validar confirmação de senha.
- Armazenar senha usando hash criptográfico com bcrypt.
- Documentar endpoint no Swagger.

## Fora de Escopo
- Login.
- Refresh token.
- Recuperação de senha.
- Verificação de email.
- Perfis administrativos.
- Envio de email transacional.

## Regras de Negócio
- O perfil deve ser um enum com os valores `PATIENT`, `DOCTOR` e `RESEARCHER`.
- O email deve ser único.
- A senha deve ter mais de 8 caracteres.
- A senha deve conter pelo menos uma letra maiúscula.
- A senha deve conter pelo menos uma letra minúscula.
- A senha deve conter pelo menos um número.
- A senha deve conter pelo menos um caractere especial.
- A confirmação de senha deve ser igual à senha.
- A API nunca deve retornar o hash da senha.
- A senha nunca deve ser armazenada em texto puro.
- O cadastro é público e não exige autenticação.

## Contratos de API
### Endpoint
`POST /api/auth/register`

### Requisição
```json
{
  "name": "Maria Silva",
  "profile": "PATIENT",
  "email": "maria@example.com",
  "password": "Senha@123",
  "confirmPassword": "Senha@123"
}
```

### Resposta de Sucesso
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Maria Silva",
    "profile": "PATIENT",
    "email": "maria@example.com",
    "createdAt": "2026-07-07T00:00:00.000Z"
  }
}
```

### Respostas de Erro
- `400 Bad Request`: dados inválidos.
- `400 Bad Request`: senha não atende à política de segurança.
- `400 Bad Request`: confirmação de senha diferente da senha.
- `409 Conflict`: email já cadastrado.

## Impacto no Modelo de Dados
Criar enum `UserProfile` e modelo `User` com os campos:

- `id`
- `name`
- `profile`
- `email`
- `passwordHash`
- `createdAt`
- `updatedAt`

## Notas Técnicas
- Utilizar Prisma ORM.
- Criar migration para alteração estrutural.
- Criar módulo `users` para persistência de usuários.
- Criar módulo `auth` para endpoint público de cadastro.
- Habilitar CORS para permitir integração com a Web local.

## Critérios de Aceitação
- Dado um email novo e dados válidos, quando a Web envia o cadastro, então a API cria o usuário e retorna dados públicos.
- Dado um email já cadastrado, quando a Web envia o cadastro, então a API retorna `409 Conflict`.
- Dada uma senha com 8 caracteres ou menos, quando a Web envia o cadastro, então a API retorna `400 Bad Request`.
- Dada uma senha sem maiúscula, minúscula, número ou caractere especial, quando a Web envia o cadastro, então a API retorna `400 Bad Request`.
- Dada uma confirmação diferente da senha, quando a Web envia o cadastro, então a API retorna `400 Bad Request`.
- Dado um perfil fora do enum, quando a Web envia o cadastro, então a API retorna `400 Bad Request`.
- Dado um cadastro bem-sucedido, quando a API responde, então o hash da senha não é retornado.

## Testes Esperados
- Testes unitários para `AuthService`.
- Testes de integração/compilação do módulo principal.
- `npm run lint`
- `npm run test`
- `npm run build`

## ADRs Relacionados
- `docs/adrs/0001-use-nestjs-modular-monolith.md`
- `docs/adrs/0002-use-prisma-postgresql-and-docker-compose.md`
