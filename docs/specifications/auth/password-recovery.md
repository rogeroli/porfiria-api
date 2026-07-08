# Specification - Recuperacao de senha

## Objetivo

Permitir que usuarios recuperem o acesso quando esquecerem a senha, preservando a politica de senha forte.

## Contexto

Quando o usuario solicitar recuperacao, a API deve gerar uma senha temporaria forte, enviar por email e marcar o usuario para troca obrigatoria de senha.

## Escopo

- Criar endpoint publico de esqueci senha.
- Gerar senha temporaria seguindo a politica atual.
- Armazenar apenas o hash da senha temporaria.
- Alterar status do usuario para `CHANGE_PASSWORD`.
- Permitir login com senha temporaria.
- Exigir troca de senha antes de uso regular da plataforma.

## Regras de negocio

- A resposta de esqueci senha deve ser generica para evitar enumeracao de emails.
- Se o email existir, a senha temporaria deve ser enviada por email.
- A senha temporaria deve cumprir a politica: mais de 8 caracteres, letra maiuscula, letra minuscula, numero e caractere especial.
- Ao logar com status `CHANGE_PASSWORD`, a sessao deve sinalizar `mustChangePassword`.
- A nova senha deve cumprir a mesma politica e possuir confirmacao.
- Apos trocar a senha, o usuario deve voltar para status `AVAILABLE`.

## Criterios de aceite

- Solicitar recuperacao para email existente muda o status para `CHANGE_PASSWORD`.
- Solicitar recuperacao para email inexistente retorna mensagem generica sem erro de existencia.
- Login com senha temporaria retorna sessao com troca obrigatoria.
- Trocar senha com senha atual invalida deve falhar.
- Trocar senha com nova senha fraca deve falhar por validacao.
