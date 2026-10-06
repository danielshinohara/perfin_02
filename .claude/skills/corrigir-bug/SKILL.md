---
name: corrigir-bug
description: Processo para corrigir um bug — entender, reproduzir com um teste, corrigir a causa raiz e revisar. Use quando o usuário relatar um erro ou comportamento inesperado.
---

# Corrigir bug

1. **Entender** — registre o comportamento esperado, o observado e os passos para reproduzir. Se faltar informação, pergunte ao usuário.
2. **Reproduzir** — confirme o bug e delegue ao subagente `tester` a criação de um teste de regressão que falha por causa dele.
3. **Encontrar a causa raiz** — investigue até entender por que acontece; não corrija só o sintoma. Procure o mesmo erro em outros pontos do código.
4. **Corrigir** — faça a menor mudança que resolve a causa raiz. Se a correção exigir mudança de arquitetura, consulte antes o subagente `architect`.
5. **Verificar** — rode o teste de regressão (agora deve passar) e os demais testes.
6. **Revisar** — delegue ao subagente `reviewer` os arquivos alterados e trate os achados.
7. **Entregar** — rode a skill `revisar-entrega` e resuma a causa, a correção e como foi verificado.
