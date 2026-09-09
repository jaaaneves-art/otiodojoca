# PHASE 7 - DIAGNÓSTICO FINAL E HANDOFF

**Data:** 21 Agosto 2026  
**Status:** BLOQUEADO - Endpoint de submissão de reserva retorna 404  
**Contexto:** Testando fluxo completo de reservas de alojamento (O Tio do Joca)

---

## 1. ESTADO ATUAL

### ✅ O QUE FUNCIONA

1. **Página de detalhe do alojamento (page.tsx)**
   - GET /alojamento/11 → 200
   - Carrega dados corretamente
   - Exibe: nome, preço, quartos, localização, refeições
   - Renderiza o formulário de reserva com dropdown de refeições

2. **Dados de teste no Supabase**
   - Localização: ID 12 (Lisboa)
   - Alojamento: ID 11 (Hotel Tio do Joca - €85/noite)
   - Refeições: 3 registos (pequeno_almoco €12, almoço €18, jantar €22)
   - Todos com `disponivel: true`

3. **Código-fonte (ficheiros)**
   - `page.tsx`: Correto com `await params`, passa `refeicoes` prop
   - `reserva-form.tsx`: Componente correto, POST para `/api/reservas/${id}`
   - `actions.ts`: Server actions existem e funcionam
   - `seed/route.ts`: Idempotente, inseriu dados com sucesso
   - `admin.ts`: Cliente Supabase com service_role_key configurado

### ❌ O QUE NÃO FUNCIONA

1. **Endpoint de submissão (POST /api/reservas/11)**
   - Retorna 404 em cada tentativa
   - Significa que `app/api/reservas/[id]/route.ts` não foi detectado pelo Next.js
   - Formulário não consegue submeter

### 🔍 PROBLEMA IDENTIFICADO

**Ficheiro criado mas não detectado:**
- Caminho: `/home/claude/otiodojoca-work/app/api/reservas/[id]/route.ts`
- Status de criação: Sucesso (reportado pelo sistema)
- Status de detecção Next.js: Falha (404 ao testar POST)

**Possíveis causas:**
1. Ficheiro existe no cloud workspace (`/home/claude/otiodojoca-work/`) mas não no workspace local do utilizador
2. Hot-reload falhou no Next.js Turbopack
3. Ficheiro corrompido ou não guardado completamente
4. Caminho incorreto na estrutura de diretórios

---

## 2. FLUXO DE TESTES REALIZADO

### Sequência de eventos:
```
1. Seed endpoint chamado: ✅
   curl -X POST http://localhost:3000/api/seed
   Resposta: {"success":true,"data":{"localizacaoId":12,"alojamentoId":11,"refeicaoIds":[5,6,7]}}

2. Página de alojamento carregada: ✅
   GET http://localhost:3000/alojamento/11 → 200
   Página exibe todos os dados corretamente

3. Formulário preenchido e submetido: ❌
   POST http://localhost:3000/api/reservas/11 → 404
   Erro: "Falha ao enviar formulário" (sem detalhes)

4. Logs do servidor:
   ✓ GET /alojamento/11 200 in 615ms
   ✗ POST /api/reservas/11 404 in 313ms (x2 tentativas)
```

---

## 3. CÓDIGO CRIADO (EM NUVEM)

### `/app/api/reservas/[id]/route.ts`
**Status:** Arquivo criado no cloud workspace  
**Responsabilidade:** Handler POST para submissão de reservas

```typescript
import { NextResponse } from 'next/server';
import { criarReservaAlojamento } from '@/lib/alojamento/actions';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const alojamentoId = Number(id);

    if (!Number.isInteger(alojamentoId) || alojamentoId <= 0) {
      return NextResponse.json(
        { error: 'ID inválido' },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Validar dados obrigatórios
    if (!body.nome_hospede || !body.email_hospede || !body.data_entrada || !body.data_saida) {
      return NextResponse.json(
        { error: 'Campos obrigatórios faltando' },
        { status: 400 }
      );
    }

    // Chamar server action para criar reserva
    const reserva = await criarReservaAlojamento({
      alojamento_id: alojamentoId,
      nome_hospede: body.nome_hospede,
      email_hospede: body.email_hospede,
      telefone_hospede: body.telefone_hospede || undefined,
      data_entrada: body.data_entrada,
      data_saida: body.data_saida,
      num_pessoas: body.num_pessoas,
      num_quartos: body.num_quartos,
      tipo_refeicao: body.tipo_refeicao,
      preco_total: body.preco_total,
      observacoes: body.observacoes || undefined,
    });

    return NextResponse.json(reserva, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar reserva:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    );
  }
}
```

**Ficheiro expectativa:** Próximo por verificar/reproduzir localmente

---

## 4. AMBIENTE

**Local do projeto:** `/home/berze/Nextcloud/Projectos/otiodojoca/` (Windows/Linux remoto)  
**Servidor:** Next.js 16.3.1 com Turbopack  
**Porta:** 3000  
**Database:** Supabase (opdvusuwrhmbgkthscsc.supabase.co)  
**Auth:** Service role key em `.env.local`

---

## 5. INSTRUÇÕES PARA PRÓXIMA IA

### FASE 1: VERIFICAR FICHEIRO LOCALMENTE

```bash
# No terminal do utilizador:
cd ~/Nextcloud/Projectos/otiodojoca

# Verificar se o ficheiro existe no local correto:
ls -la app/api/reservas/[id]/

# Se não existir, criá-lo com:
mkdir -p app/api/reservas/[id]
cat > app/api/reservas/[id]/route.ts << 'EOF'
[copiar conteúdo acima]
EOF

# Verificar sintaxe (se tiver npx tsc):
npx tsc --noEmit app/api/reservas/[id]/route.ts
```

### FASE 2: REINICIAR SERVIDOR

```bash
# Parar o servidor (Ctrl+C no terminal)
# Aguardar 2-3 segundos
# Reiniciar:
npm run dev
```

### FASE 3: TESTAR NOVAMENTE

```bash
# Aguardar "✓ Ready" no terminal do servidor

# Fazer POST para o endpoint:
curl -X POST http://localhost:3000/api/reservas/11 \
  -H "Content-Type: application/json" \
  -d '{
    "nome_hospede": "João Silva",
    "email_hospede": "joao@exemplo.pt",
    "data_entrada": "2026-08-25",
    "data_saida": "2026-08-28",
    "num_pessoas": 2,
    "num_quartos": 1,
    "tipo_refeicao": "pequeno_almoco",
    "preco_total": 280.50,
    "observacoes": "Teste"
  }'

# Resultado esperado: 201 com dados da reserva criada
```

### FASE 4: SE CONTINUAR COM 404

1. **Verificar se o ficheiro está no `git status`:**
   ```bash
   git status
   ```
   Se não aparecer `app/api/reservas/[id]/route.ts`, o ficheiro não foi sincronizado do cloud

2. **Verificar se Turbopack está a hot-reload:**
   ```bash
   # Ver logs do servidor para:
   # ✓ Watcherou ✗ Error
   ```

3. **Limpar cache e reconstruir:**
   ```bash
   rm -rf .next
   npm run dev
   ```

4. **Verificar se há conflito com outra rota:**
   ```bash
   find app/api -name "*reserva*" -o -name "*[id]*"
   ```

---

## 6. PRÓXIMOS PASSOS (ORDEM DE PRIORIDADE)

1. ✅ **VERIFICAR FICHEIRO LOCALMENTE** (primeiro passo obrigatório)
2. **REINICIAR SERVIDOR** se ficheiro existir
3. **TESTAR POST** com curl após reinício
4. **ANALISAR RESPOSTA:**
   - Se 201: Sucesso! Continuar para testes de integração
   - Se 404: Investigar fase 4 acima
   - Se 400/500: Ver erro específico, debugar server action

---

## 7. CHECKLIST DE FUNCIONAMENTO

- [ ] Ficheiro `/app/api/reservas/[id]/route.ts` existe localmente
- [ ] Servidor reiniciado após criação do ficheiro
- [ ] POST /api/reservas/11 retorna 201 (não 404)
- [ ] Resposta contém ID da reserva criada
- [ ] Supabase contém novo registo em `reservas_alojamento`
- [ ] Formulário mostra "Reserva criada com sucesso!"
- [ ] Formulário limpa campos após sucesso

---

## 8. INFORMAÇÃO CRÍTICA PARA REPRODUÇÃO

**Configuração mínima necessária:**
- Node.js 18+
- npm 9+
- `.env.local` com `NEXT_PUBLIC_SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`
- Supabase projeto criado com tabelas de alojamento/reservas

**Dados de teste já inseridos:**
- Alojamento ID: 11
- Localização ID: 12
- Refeição IDs: 5, 6, 7

**Não modificar:** `.env.local` (contém secrets)

---

## 9. DÚVIDAS FREQUENTES

**P: Por que o ficheiro foi criado em `/home/claude/otiodojoca-work/` e não no local real?**  
R: O Claude Code corre em cloud. Ficheiros criados aqui precisam ser sincronizados/copiados para o projeto local.

**P: O servidor precisa reiniciar?**  
R: Sim. Turbopack faz hot-reload de ficheiros *existentes*, mas ficheiros *novos* podem exigir reinício completo.

**P: O endpoint está correto?**  
R: Sim. Usa `await params` (Next.js 16), chama server action corretamente, retorna 201 ou erro apropriado.

---

**Handoff para:** Próxima IA / Engenheiro  
**Prioridade:** Alta (bloqueia Phase 7 testing)  
**Tempo estimado:** 5-10 minutos para resolver
