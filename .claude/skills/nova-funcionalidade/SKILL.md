---
name: nova-funcionalidade
description: Fluxo completo para implementar uma funcionalidade ou mudança relevante — plano com o architect, implementação, testes com o tester, revisão com o reviewer e documentação. Use quando o usuário pedir uma funcionalidade nova ou uma mudança que afete mais de um arquivo.
---

# Nova funcionalidade

Siga as etapas na ordem. Se precisar pular alguma, avise o usuário e explique por quê.

1. **Planejar** — delegue ao subagente `architect` com o requisito completo. Apresente ao usuário o impacto, os arquivos, os riscos e o plano, e **aguarde aprovação** antes de alterar código.
2. **Implementar** — execute o plano aprovado. Para interfaces, delegue ao subagente `frontend`; o restante, implemente seguindo `.claude/rules/`.
3. **Testar** — delegue ao subagente `tester`, informando o que mudou e os riscos apontados no plano. Se ele encontrar bugs, corrija e peça uma nova rodada.
4. **Revisar** — delegue ao subagente `reviewer` com a lista de arquivos alterados. Corrija os achados críticos e altos; para médios e baixos, corrija ou justifique.
5. **Documentar** — se houve decisão de arquitetura ou mudança de comportamento visível, use a skill `documentar-projeto`.
6. **Entregar** — rode a skill `revisar-entrega` e apresente ao usuário o que mudou, como verificar e o que ficou pendente.
