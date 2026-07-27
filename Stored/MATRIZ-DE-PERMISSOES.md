# MATRIZ-DE-PERMISSOES

## Objetivo

Definir a correspondência entre funções (roles) e permissões dos diferentes módulos do OTJ.

---

## Matriz de Permissões

| Função | Leitura | Criação | Edição | Eliminação | Administração |
|--------|:--------:|:-------:|:------:|:----------:|:-------------:|
| Visitante | ✓ | | | | |
| Utilizador | ✓ | ✓ | Próprio | Próprio | |
| Moderador | ✓ | ✓ | ✓ | ✓ | Limitada |
| Editor | ✓ | ✓ | ✓ | ✓ | Conteúdos |
| Gestor | ✓ | ✓ | ✓ | ✓ | Módulo |
| Administrador | ✓ | ✓ | ✓ | ✓ | Global |
| Administrador de Sistema | ✓ | ✓ | ✓ | ✓ | Total |

---

## Regras

- As permissões são atribuídas através de funções.
- Um utilizador pode possuir múltiplas funções.
- O princípio do menor privilégio aplica-se por defeito.
- Todas as alterações de permissões são auditadas.

---

## Estado

Versão: 1.0

Estado: Em desenvolvimento.
