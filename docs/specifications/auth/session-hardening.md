# Specification - Endurecimento de sessao autenticada

## Objetivo

Garantir que telas autenticadas sejam validadas pela API e nao apenas pelo armazenamento local do navegador.

## Escopo

- Criar guard JWT para rotas protegidas.
- Criar endpoint `GET /auth/me` para retornar o usuario autenticado.
- Bloquear usuarios inexistentes ou pendentes em rotas protegidas.
- Permitir que a web valide a sessao atual contra a API.
- Preparar a web para renovar access token usando refresh token em respostas `401`.

## Regras de negocio

- Access token deve ser enviado no header `Authorization: Bearer <token>`.
- Token ausente, invalido ou expirado deve retornar `401`.
- Usuario com status `PENDING` nao deve acessar rotas protegidas.
- Usuario com status `CHANGE_PASSWORD` pode acessar a rota de troca de senha.

## Criterios de aceite

- `GET /auth/me` retorna o usuario autenticado quando o access token e valido.
- Dashboard deve consultar `/auth/me` antes de liberar a tela.
- Se o access token expirar e houver refresh token valido, a web renova a sessao e repete a chamada.
- Se a renovacao falhar, a web limpa a sessao e redireciona para login.
