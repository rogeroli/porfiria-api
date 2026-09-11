# Specification - Consumo de trilhas por perfil

## Objetivo

Permitir que usuarios autenticados consumam trilhas por perfil compostas por questionarios publicados e, no futuro, alimentem o dashboard com seus resultados.

## Escopo inicial

- Listar trilhas por perfil compostas por questionarios publicados.
- Visualizar detalhes dos questionarios da trilha com itens ordenados.
- Exibir itens quiz com pergunta e alternativas sem revelar respostas corretas para usuarios comuns.
- Exibir itens video usando arquivo local publicado pela API.

## Fora do escopo inicial

- Persistencia de respostas do usuario.
- Calculo de pontuacao.
- Dashboard real por progresso.

## Criterios de aceite

- Usuarios autenticados podem listar trilhas por perfil compostas por questionarios publicados.
- Dados administrativos sensiveis, como resposta correta, devem ser evitados no consumo publico quando a resolucao for implementada.
