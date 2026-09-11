# Specification - Troca de senha autenticada

## Objetivo

Garantir que troca voluntaria ou obrigatoria de senha use a identidade autenticada, sem depender de email informado no formulario.

## Escopo

- Proteger `POST /auth/change-password` com JWT.
- Remover email do payload de troca de senha.
- Usar o usuario autenticado para buscar e validar a senha atual.
- Permitir troca para usuarios `AVAILABLE` e `CHANGE_PASSWORD`.
- Bloquear troca para usuarios `PENDING`.

## Regras de negocio

- A senha atual deve ser validada contra o hash do usuario autenticado.
- A nova senha deve seguir a politica de senha forte.
- A confirmacao deve coincidir com a nova senha.
- Apos trocar a senha, o status deve ficar `AVAILABLE`.
- A API deve retornar nova sessao apos a troca.

## Criterios de aceite

- Usuario autenticado `AVAILABLE` consegue trocar a senha informando senha atual correta.
- Usuario autenticado `CHANGE_PASSWORD` consegue trocar a senha informando senha temporaria correta.
- Usuario sem token nao consegue trocar senha.
- O formulario web nao pede email para troca de senha.
