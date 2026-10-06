---
name: revisar-entrega
description: Checklist final antes de entregar qualquer trabalho ao usuário (código, tela ou documento). Use antes de declarar uma tarefa concluída.
---

# Revisar entrega

Passe por cada item e corrija o que falhar. No resumo final, diga o que foi verificado e o que não pôde ser verificado.

1. **Funciona** — o código roda e os testes passam; informe o comando e o resultado real.
2. **Revisado** — o subagente `reviewer` revisou as mudanças de código e os achados críticos e altos foram tratados.
3. **Regras** — a entrega segue `.claude/rules/` (idioma e formatos, código, segurança, testes e, se houver interface, frontend).
4. **Interface** (se houver) — responsiva, com tema claro/escuro, estados de carregamento/vazio/erro e identidade visual Perfin.
5. **Sem sobras** — nada de código de depuração, `console.log`, arquivos temporários, código comentado ou TODO sem responsável.
6. **Documentação** — decisões e mudanças relevantes registradas com a skill `documentar-projeto`; comandos novos de build ou teste registrados no `CLAUDE.md`.
