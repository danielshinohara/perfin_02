---
name: documentar-projeto
description: Registra documentação em Documentacao/ — decisões de arquitetura ou produto, funcionalidades e guias — e mantém o índice Documentacao/README.md. Use após decisões relevantes ou mudanças de comportamento.
---

# Documentar projeto

Toda documentação fica em `Documentacao/`, em Markdown e pt-BR.

## Decisão de arquitetura ou produto

Crie `Documentacao/decisoes/AAAA-MM-DD-titulo-curto.md` (data no nome para manter a ordem) com:

- **Data** (DD/MM/AAAA) e **status**: proposta, aceita ou substituída.
- **Contexto**: o problema e as restrições.
- **Decisão**: o que foi decidido.
- **Alternativas consideradas** e por que foram descartadas.
- **Consequências**: impactos positivos e negativos.

Não reescreva uma decisão antiga: crie uma nova e marque a anterior como "substituída por ...".

## Funcionalidade ou guia

Crie ou atualize `Documentacao/<tema>.md` descrevendo o que faz, como usar e as limitações conhecidas.

## Índice

Atualize `Documentacao/README.md` (crie se não existir) com um link e uma linha de descrição para cada documento novo.
