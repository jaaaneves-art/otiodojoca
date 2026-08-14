# Módulo ALOJAMENTO (DORMIR)

Sistema de gestão de alojamentos rurais, casas de turismo e hospedagem com suporte a refeições.

---

## 📁 Estrutura de Ficheiros

```
lib/alojamento/
├── tipos.ts              # Tipos TypeScript
├── actions.ts            # Server Actions
└── README.md            # Este ficheiro

sql/
└── ALOJAMENTOS.sql      # Tabelas da BD

components/alojamento/
├── alojamento-card.tsx  # Card para listagem
└── reserva-form.tsx     # Formulário de reserva

app/(alojamento)/alojamento/
├── page.tsx             # Página de listagem
└── [id]/
    └── page.tsx         # Página de detalhe
```

---

## 🎯 Funcionalidades

### Alojamentos
- ✅ Listagem de alojamentos disponíveis
- ✅ Detalhes completos com localização
- ✅ Integração com Google Maps
- ✅ Ratings e comentários
- ✅ Filtros por tipo e preço

### Refeições
- ✅ Pequeno-almoço
- ✅ Almoço
- ✅ Jantar
- ✅ Preços extra configuráveis
- ✅ Pacotes: Meia-pensão, Pensão completa

### Reservas
- ✅ Cálculo automático de preço
- ✅ Verificação de disponibilidade
- ✅ Sistema de status (Pendente, Confirmada, Concluída, Cancelada)
- ✅ Email do hóspede
- ✅ Observações e requisitos especiais

---

## 🗄️ Base de Dados

### Tabela `alojamentos`

```sql
CREATE TABLE alojamentos (
  id BIGINT PRIMARY KEY
  nome TEXT NOT NULL
  descricao TEXT
  tipo VARCHAR (hotel, pousada, casa_rural, etc.)
  localizacao_id BIGINT NOT NULL (FK)
  preco_noite NUMERIC(10, 2) NOT NULL
  num_quartos INTEGER NOT NULL
  num_camas INTEGER
  rating NUMERIC(3, 2)
  telefone, email, website TEXT
  created_at, updated_at TIMESTAMPTZ
)
```

**Padrão:** Segue o mesmo padrão de COMER
- Referência única via `localizacao_id`
- Sem duplicação de dados de localização
- FK com `ON DELETE RESTRICT`

### Tabela `refeicoes_alojamento`

```sql
CREATE TABLE refeicoes_alojamento (
  id BIGINT PRIMARY KEY
  alojamento_id BIGINT NOT NULL (FK)
  tipo_refeicao VARCHAR (pequeno_almoco, almoço, jantar)
  preco_extra NUMERIC(8, 2)
  disponivel BOOLEAN
  created_at, updated_at TIMESTAMPTZ
)
```

Associa refeições a cada alojamento com preço extra.

### Tabela `reservas_alojamento`

```sql
CREATE TABLE reservas_alojamento (
  id BIGINT PRIMARY KEY
  alojamento_id BIGINT NOT NULL (FK)
  nome_hospede, email_hospede, telefone_hospede TEXT
  data_entrada, data_saida DATE NOT NULL
  num_pessoas, num_quartos INTEGER
  tipo_refeicao VARCHAR (sem_refeicoes, pequeno_almoco, meia_pensao, pensao_completa)
  preco_total NUMERIC(10, 2)
  status VARCHAR (pendente, confirmada, concluido, cancelada)
  observacoes TEXT
  created_at, updated_at TIMESTAMPTZ
)
```

Regista as reservas dos hóspedes.

---

## 🎨 Componentes Principais

### AlojamentoCard

Exibe um alojamento em formato de card para a listagem.

**Props:**
- `alojamento: Alojamento` — Dados do alojamento

**Uso:**
```typescript
import AlojamentoCard from '@/components/alojamento/alojamento-card';

<AlojamentoCard alojamento={dados} />
```

### ReservaForm

Formulário para fazer reserva com cálculo automático de preço.

**Props:**
- `alojamento: AlojamentoComRefeicoes` — Alojamento com refeições

**Funcionalidades:**
- Validação de datas
- Cálculo em tempo real
- Seleção de refeições
- Confirmação de reserva

**Uso:**
```typescript
import ReservaForm from '@/components/alojamento/reserva-form';

<ReservaForm alojamento={dados} />
```

---

## ⚙️ Server Actions

### Alojamentos

**`listarAlojamentos()`**
Retorna todos os alojamentos disponíveis.

```typescript
const alojamentos = await listarAlojamentos();
```

**`obterAlojamento(id: number)`**
Retorna um alojamento com localização completa.

```typescript
const alojamento = await obterAlojamento(1);
console.log(alojamento.localizacao.municipio);
```

**`obterAlojamentoComRefeicoes(id: number)`**
Retorna alojamento com refeições disponíveis.

```typescript
const dados = await obterAlojamentoComRefeicoes(1);
console.log(dados.refeicoes);
```

**`filtrarAlojamentosPorTipo(tipo: string)`**
Filtra por tipo (hotel, pousada, etc.).

```typescript
const pousadas = await filtrarAlojamentosPorTipo('pousada');
```

**`filtrarAlojamentosPorPreco(min: number, max: number)`**
Filtra por intervalo de preço.

```typescript
const baratos = await filtrarAlojamentosPorPreco(50, 100);
```

### Refeições

**`obterRefeicoesAlojamento(alojamentoId: number)`**
Lista refeições disponíveis para um alojamento.

```typescript
const refeicoes = await obterRefeicoesAlojamento(1);
```

### Reservas

**`criarReservaAlojamento(dados: ...)`**
Cria uma nova reserva.

```typescript
const reserva = await criarReservaAlojamento({
  alojamento_id: 1,
  nome_hospede: 'João Silva',
  email_hospede: 'joao@email.com',
  data_entrada: '2026-08-20',
  data_saida: '2026-08-25',
  num_pessoas: 2,
  num_quartos: 1,
  tipo_refeicao: 'pequeno_almoco',
  preco_total: 450.00,
});
```

**`listarReservasAlojamento(alojamentoId: number)`**
Lista todas as reservas de um alojamento.

```typescript
const reservas = await listarReservasAlojamento(1);
```

**`obterReserva(id: number)`**
Obtém uma reserva específica.

```typescript
const reserva = await obterReserva(1);
```

**`atualizarStatusReserva(id: number, novoStatus: string)`**
Actualiza o status de uma reserva.

```typescript
await atualizarStatusReserva(1, 'confirmada');
```

**`cancelarReserva(id: number, motivo?: string)`**
Cancela uma reserva.

```typescript
await cancelarReserva(1, 'Cancelação do cliente');
```

**`verificarDisponibilidade(alojamentoId: number, dataEntrada: string, dataSaida: string)`**
Verifica se o alojamento está disponível.

```typescript
const disponivel = await verificarDisponibilidade(1, '2026-08-20', '2026-08-25');
```

**`calcularPrecoReserva(alojamentoId: number, dataEntrada: string, dataSaida: string, tipoRefeicao: string)`**
Calcula o preço total da reserva.

```typescript
const preco = await calcularPrecoReserva(1, '2026-08-20', '2026-08-25', 'pequeno_almoco');
console.log(preco.precoTotal); // €450.00
```

---

## 📋 Tipos TypeScript

### `Alojamento`

```typescript
interface Alojamento {
  id: number;
  nome: string;
  descricao?: string;
  tipo: TipoAlojamento;
  localizacao_id: number;
  preco_noite: number;
  num_quartos: number;
  num_camas?: number;
  rating?: number;
  telefone?: string;
  email?: string;
  website?: string;
  created_at: string;
  updated_at: string;
}
```

### `AlojamentoComLocalizacao`

Estende `Alojamento` com localização:

```typescript
interface AlojamentoComLocalizacao extends Alojamento {
  localizacao: Localizacao;
}
```

### `AlojamentoComRefeicoes`

Estende `AlojamentoComLocalizacao` com refeições:

```typescript
interface AlojamentoComRefeicoes extends AlojamentoComLocalizacao {
  refeicoes: RefeicaoAlojamento[];
}
```

### `ReservaAlojamento`

```typescript
interface ReservaAlojamento {
  id: number;
  alojamento_id: number;
  nome_hospede: string;
  email_hospede: string;
  data_entrada: string;
  data_saida: string;
  num_pessoas: number;
  num_quartos: number;
  tipo_refeicao: TipoRefeicao;
  preco_total: number;
  status: 'pendente' | 'confirmada' | 'concluido' | 'cancelada';
  observacoes?: string;
}
```

---

## 🚀 Como Usar

### 1. Listar Alojamentos

```typescript
// app/(alojamento)/alojamento/page.tsx
import { listarAlojamentos } from '@/lib/alojamento/actions';

export default async function AlojamentoPage() {
  const alojamentos = await listarAlojamentos();
  
  return (
    <div>
      {alojamentos.map(alojamento => (
        <AlojamentoCard key={alojamento.id} alojamento={alojamento} />
      ))}
    </div>
  );
}
```

### 2. Ver Detalhe

```typescript
// app/(alojamento)/alojamento/[id]/page.tsx
import { obterAlojamentoComRefeicoes } from '@/lib/alojamento/actions';

async function DetalheAlojamento({ id }: { id: number }) {
  const dados = await obterAlojamentoComRefeicoes(id);
  
  return (
    <div>
      <h1>{dados.nome}</h1>
      <p>{dados.localizacao.nome} • {dados.localizacao.municipio}</p>
      <ReservaForm alojamento={dados} />
    </div>
  );
}
```

### 3. Fazer Reserva

ReservaForm trata de tudo automaticamente:
- Validação de datas
- Cálculo de preço
- Seleção de refeições
- Criação de reserva

---

## 🎨 CSS & Tema

O módulo usa **Tailwind CSS** com cores azul (tema DORMIR):

- `bg-blue-600` — Cor principal
- `bg-blue-50` — Fundo claro
- `text-blue-700` — Texto destaque
- `border-blue-200` — Bordas

Customiza conforme necessário em `tailwind.config.ts`.

---

## 🔒 Segurança

### RLS Policies

- **Alojamentos:** Todos podem ver (SELECT público)
- **Refeições:** Todos podem ver (SELECT público)
- **Reservas:** Todos podem criar e ver (controlo de acesso básico)

Para produção, implementa autenticação + autorização baseada em utilizador.

---

## 📧 Email & Notificações

No `criarReservaAlojamento`, podes adicionar envio de email:

```typescript
// Depois de criar reserva
await enviarEmailConfirmacao({
  destinatario: dados.email_hospede,
  alojamento: dados.nome,
  dataEntrada: dados.data_entrada,
  preco: dados.preco_total,
});
```

---

## 🧪 Testes

Para testar localmente, executa:

```bash
# Aplicar SQL
psql -U postgres -d otiodojoca -f sql/ALOJAMENTOS.sql

# Ou via Supabase SQL Editor
# Copia conteúdo de sql/ALOJAMENTOS.sql e executa

# Depois, testa no browser
http://localhost:3000/alojamento
```

---

## 📊 Dados de Teste

O SQL inclui um alojamento de teste:

```
Casa Rural Ronfe
├── Localização: Rua do Ave, Ronfe, Guimarães
├── Preço: €89.50/noite
├── Quartos: 4
├── Camas: 8
├── Rating: 4.5 ⭐
└── Refeições: Pequeno-almoço, Almoço, Jantar
```

---

## 🔄 Próximos Passos

1. **Implementar autenticação**
   - Só proprietários podem gerir alojamentos
   - Hóspedes podem ver histórico de reservas

2. **Sistema de avaliações**
   - Hóspedes avaliam alojamentos
   - Proprietários respondem

3. **Pagamentos**
   - Integrar Stripe ou PayPal
   - Processar pagamento ao fazer reserva

4. **Confirmação de email**
   - Enviar confirmação ao hóspede
   - Enviar notificação ao proprietário

5. **Cancelamento e reembolso**
   - Política de cancelamento
   - Automação de reembolsos

---

## 📞 Suporte

Para dúvidas sobre o módulo, consulta:

- **Auditoria:** AUDITORIA-LOCALIZACOES-OTJ-20260814.md
- **Padrão:** PADRAO-REUTILIZAVEL-LOCALIZACOES.md
- **Código:** Comentários inline em cada ficheiro

---

**Módulo ALOJAMENTO | Versão 1.0**  
**Criado:** 14 de Agosto de 2026  
**Status:** ✅ Pronto para usar
