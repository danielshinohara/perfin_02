# Arquitetura

- Preserve a arquitetura existente. Entenda a estrutura atual antes de propor qualquer alteração e justifique quando a mudança for necessária.
- Prefira modificar ou aprimorar um módulo existente a criar um novo.
- Reutilize funções, componentes e ferramentas já existentes sempre que possível. Procure no projeto antes de escrever algo novo.
- Não introduza novas dependências sem explicar o motivo: o que ela resolve, por que o que já existe não basta e qual o custo (tamanho, manutenção, segurança).
- Regras e lógica de negócio nunca ficam no código React/Next.js (componentes, páginas, hooks de tela). Elas ficam em uma camada própria (serviços, funções de domínio ou backend) e a interface apenas as consome.
- Evite arquivos com mais de 400 linhas. Se passar disso, divida em módulos menores e coesos.
- Evite funções com mais de 50 linhas. Extraia partes em funções menores com nomes claros.
