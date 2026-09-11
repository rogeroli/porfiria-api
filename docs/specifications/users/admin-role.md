# Specification - Papel administrativo

## Objetivo

Separar perfil de atuacao do usuario de permissoes administrativas da plataforma.

## Decisao

- `UserProfile` representa a atuacao: paciente, medico ou pesquisador.
- `UserRole` representa permissao: `USER` ou `ADMIN`.

## Regras de negocio

- Todo usuario novo deve ser criado com role `USER`.
- Usuarios `ADMIN` podem acessar rotas administrativas.
- Usuarios `USER` nao podem criar, editar ou publicar trilhas.
- Um usuario pode ser, por exemplo, `DOCTOR` e `ADMIN` ao mesmo tempo.

## Criterios de aceite

- O token JWT deve conter a role do usuario.
- O endpoint `/auth/me` deve retornar a role.
- Rotas administrativas devem validar role `ADMIN`.
