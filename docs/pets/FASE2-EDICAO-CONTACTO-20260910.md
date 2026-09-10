# Mundo dos Patudos — Fase 2: edição, contacto e testes RLS

**Data:** 10 de setembro de 2026  
**Estado:** código local concluído; testes de base de dados preparados, mas não
executados nesta sessão por indisponibilidade do motor local de contentores.

## Alterações

- Autores podem editar os dados dos seus casos em
  `/mundo-dos-patudos/[id]/editar`.
- A freguesia atual é preservada corretamente no autocomplete e só muda quando
  o utilizador escolhe uma nova entrada da lista.
- Datas introduzidas em `datetime-local` são convertidas no navegador para ISO,
  preservando o fuso horário do utilizador.
- O detalhe permite iniciar contacto através das mensagens privadas existentes.
  O nome de utilizador é pré-preenchido, mas a ação volta a validar o perfil e a
  sessão; nenhum telefone ou email é exposto.
- A edição mantém as fotografias intactas. Gestão individual de fotografias fica
  bloqueada até as policies de Storage serem testadas numa base real.
- O autocomplete partilhado deixou de duplicar estado derivado em `useEffect`,
  mantendo o mesmo comportamento para os outros módulos.

## Testes preparados

`supabase/tests/database/pets_rls.test.sql` contém 16 verificações dentro de uma
transação com rollback: RLS, privilégios anónimos, propriedade, visibilidade de
rascunhos, proteção contra identidade falsa e duplicação, denúncias e moderação.

O conjunto estático `npm run test:pets-security` passou com 9 verificações,
incluindo o âmbito da edição por autor e o contacto sem exposição de email ou
telefone.

Depois de iniciar o Supabase local e aplicar migrations:

```bash
npm run test:pets-security
supabase test db supabase/tests/database/pets_rls.test.sql
```

Nenhuma migration foi aplicada à instância remota ou de produção.
