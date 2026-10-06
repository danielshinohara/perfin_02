# Testes

- Toda mudança de comportamento vem acompanhada de testes automatizados, no framework já adotado pelo projeto.
- Todo bug corrigido ganha um teste de regressão que falhava antes da correção.
- Nunca apague, desative ou enfraqueça um teste para fazê-lo passar: corrija o código ou discuta o teste com o usuário.
- Testes devem ser determinísticos: sem depender da data/hora atual, da ordem de execução ou de serviços externos reais.
- Ao relatar resultados, informe o comando executado e o resultado real. Se não foi possível rodar os testes, diga isso.
- Ao adotar um framework de testes, registre no `CLAUDE.md` os comandos para rodar todos os testes e um único teste.
