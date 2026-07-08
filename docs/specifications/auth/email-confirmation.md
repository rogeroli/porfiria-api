# Specification - Confirmacao de email

## Objetivo

Garantir que todo usuario cadastrado confirme a posse do email antes de utilizar a plataforma.

## Contexto

Apos o cadastro, o usuario deve permanecer com status `PENDING` ate confirmar o email por meio de um link unico enviado pela API.

## Escopo

- Criar status do usuario no banco de dados.
- Criar token aleatorio para confirmacao de email.
- Armazenar token temporario no Redis com expiracao.
- Enviar email de confirmacao apos cadastro.
- Confirmar o email por endpoint publico.

## Regras de negocio

- Todo novo usuario deve ser criado com status `PENDING`.
- O token de confirmacao deve ser aleatorio, opaco e armazenado apenas como hash no Redis.
- O link de confirmacao deve apontar para a aplicacao web.
- Ao confirmar um token valido, o usuario deve passar para status `AVAILABLE`.
- Usuario com status `PENDING` nao deve conseguir autenticar na plataforma.
- Tokens expirados ou invalidos devem retornar erro de validacao.

## Criterios de aceite

- Ao cadastrar usuario, a API cria o usuario como `PENDING`.
- Ao cadastrar usuario, a API solicita o envio do email de confirmacao.
- Ao acessar o endpoint de confirmacao com token valido, o usuario fica `AVAILABLE`.
- Ao tentar login com usuario `PENDING`, a API informa que o email precisa ser confirmado.
- O token puro nao deve ser persistido em banco relacional.
