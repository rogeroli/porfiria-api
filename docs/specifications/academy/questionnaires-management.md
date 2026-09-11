# Specification - Gestao administrativa de questionarios

## Objetivo

Permitir que administradores criem questionarios educacionais sobre porfiria.

## Modelo

- Questionario possui titulo, descricao, status, perfis autorizados e itens ordenados.
- Status possiveis: `DRAFT`, `PUBLISHED` e `DISABLED`.
- Item de questionario possui tipo `QUIZ` ou `VIDEO`.
- Item `QUIZ` possui uma pergunta e alternativas, com uma ou mais corretas.
- Item `VIDEO` possui upload local de arquivo de video.

## Regras de negocio

- Apenas administradores podem criar, editar, ordenar, publicar questionarios e gerenciar itens.
- Questionarios novos iniciam como `DRAFT`.
- Um questionario pode ser publicada depois de possuir ao menos um item.
- O admin deve informar todos os itens ao reordenar uma trilha, garantindo uma ordem unica para cada item.
- Um quiz deve possuir ao menos duas alternativas e ao menos uma alternativa correta.
- Videos serao armazenados localmente neste primeiro momento.
- A migracao futura para AWS S3 sera tratada em evolucao propria.
- Questionarios desativados nao devem aparecer para consumo dos usuarios.
- Usuarios devem consumir a trilha ordenada do seu perfil, composta por questionarios publicados.

## Criterios de aceite

- Admin consegue visualizar questionarios ja criados para edicao, incluindo trilhas desativadas.
- Admin consegue criar questionario em rascunho.
- Admin consegue editar titulo e descricao de um questionario.
- Admin consegue adicionar item quiz com alternativas e respostas corretas.
- Admin consegue adicionar item video por upload local.
- Admin consegue reordenar itens/perguntas de um questionario enquanto ela nao estiver desativada.
- Admin consegue desativar um questionario por soft delete, alterando seu status para `DISABLED`.
- Usuario comum nao consegue acessar endpoints administrativos.
