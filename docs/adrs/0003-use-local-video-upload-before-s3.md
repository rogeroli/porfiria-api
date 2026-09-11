# ADR 0003 - Usar upload local de videos antes da migracao para S3

## Status

Aceito

## Contexto

O modulo de trilhas precisa permitir itens de video. No ambiente atual de desenvolvimento, ainda nao ha infraestrutura AWS S3 configurada.

## Decisao

Videos serao armazenados localmente em `uploads/videos` durante o desenvolvimento inicial. A API servira esses arquivos pela rota `/uploads/videos/*`.

## Consequencias

- O desenvolvimento do modulo de trilhas nao fica bloqueado pela infraestrutura AWS.
- O diretorio `uploads/` deve ser ignorado pelo Git.
- Em producao, o armazenamento local nao deve ser usado como estrategia definitiva.
- A migracao para S3 deve preservar o contrato publico dos itens de video sempre que possivel.
