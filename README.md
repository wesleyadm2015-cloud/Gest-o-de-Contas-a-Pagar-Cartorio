# 💳 ContaDiária - Sistema de Gerenciamento de Pagamento de Contas Diário

Aplicação web moderna no formato **SPA (Single-Page Application)**, desenvolvida sob os mais altos padrões de **Engenharia de Software** e **Design de Experiência do Usuário (UX/UI)** para gestão e controle diário de contas a pagar, alertas de vencimento e relatórios de fluxo financeiro.

---

## 🌟 Destaques de Arquitetura e UX/UI

- **Zero Configuração / Execução Instantânea**: Não requer instalação prévia de Node.js, compiladores ou bancos de dados complexos para começar a usar. Basta abrir no navegador!
- **Camada de Dados Abstrata (Repository Pattern)**: Implementada com métodos assíncronos baseados em `Promise` sobre `LocalStorage`. Permite plugar **Supabase**, **Firebase** ou uma **API REST** substituindo apenas o arquivo `storage.js` sem alterar a interface gráfica.
- **Design Moderno (Fintech Polish)**: Tipografia limpa (*Plus Jakarta Sans*), microinterações fluidas, paleta de cores moderna (Tailwind CSS), suporte completo a **Modo Escuro (Dark Mode)** e **Modo Claro (Light Mode)**.
- **Feedback Visual Inteligente**:
  - **1-Clique para Pagar**: Alterne entre pendente e pago diretamente na tabela ou cards.
  - **Destaque Dinâmico de Urgência**: Alertas no topo, badge no sino e cartões com aviso de contas vencidas ou com vencimento para o dia atual.
  - **Gráficos Interativos**: Donut de gastos por categoria e barras comparativas (Pagas vs. Pendentes vs. Atrasadas) via Chart.js.
  - **Exportação Dual**: Baixe relatórios em formato CSV compatível com Microsoft Excel (com UTF-8 BOM) ou copie um resumo formatado para o WhatsApp/E-mail com 1 clique.

---

## 📁 Estrutura do Projeto

```text
sistema-gestao-contas/
│
├── index.html               # Ponto de entrada SPA (Tailwind CDN, Lucide Icons, Chart.js)
│
├── css/
│   └── custom.css           # Estilos adicionais, animações de modal/toast e scrollbars
│
├── js/
│   ├── config.js            # Definições de domínio (categorias, métodos, formatações de moeda e data)
│   ├── mockData.js          # Gerador dinâmico de dados de teste relativos à data atual
│   ├── storage.js           # StorageService (Repository assíncrono para persistência de dados)
│   ├── billService.js       # Regras de negócio (cálculo de atrasos, KPIs, filtros, agrupamentos)
│   ├── chartService.js      # Integração e renderização temática com Chart.js
│   ├── exportService.js     # Gerador de planilhas CSV e texto formatado para clipboard
│   ├── ui.js                # UIManager (manipulação de DOM, toasts, modais, tema escuro/claro)
│   └── app.js               # Orquestrador principal (event listeners e ciclo de vida)
│
└── README.md                # Documentação técnica e guia de migração
```

---

## 🚀 Como Executar o Projeto Localmente

Você tem várias maneiras simples de abrir e testar a aplicação:

### Método 1: Execução Direta (Sem Instalação)
1. Abra o Windows Explorer e navegue até a pasta do projeto:
   ```text
   C:\Users\WESLEY PARANHOS\.gemini\antigravity\scratch\sistema-gestao-contas
   ```
2. Dê **duplo-clique no arquivo `index.html`** (ou clique com botão direito > *Abrir com* > *Google Chrome* ou *Microsoft Edge*).
3. A aplicação carregará instantaneamente com dados de demonstração dinâmicos baseados no dia atual!

### Método 2: Usando a Extensão Live Server do VS Code
1. Abra a pasta `sistema-gestao-contas` no Visual Studio Code.
2. Clique com o botão direito no arquivo `index.html` e selecione **"Open with Live Server"**.
3. A aplicação abrirá no endereço local `http://127.0.0.1:5500/index.html`.

### Método 3: Servidor Local via Linha de Comando (Opcional)
Se tiver Node ou Python instalado em sua máquina:
- **Node.js (npx)**:
  ```bash
  npx serve .
  ```
- **Python**:
  ```bash
  python -m http.server 8000
  ```

---

## 📋 Funcionalidades Implementadas

### 1. Dashboard Financeiro Diário
- **KPIs Principais**:
  - **Total a Pagar / Pendente**: Soma de valores a vencer com contagem de títulos.
  - **Total Quitado**: Soma das despesas já pagas e porcentagem de adimplência.
  - **Total do Período**: Montante total comprometido.
  - **Atrasadas (Crítico)**: Alerta com destaque avermelhado para despesas vencidas.
- **Balanço Visual**: Barra de progresso comparando o percentual já liquidado em relação ao total.
- **Seletor de Período Rápido**:
  - `Hoje`, `Esta Semana`, `Este Mês`, `Todos` e `Personalizado` (intervalo livre de datas).

### 2. Gestão de Contas (CRUD Completo e Alta Densidade)
- **Coluna de Status com Lista Suspensa (Dropdown Interativo)**:
  - Substitui a coluna antiga por um menu suspenso em cada linha com duas opções diretas: **✅ Pago** e **⏳ Aguardando Pagamento**.
  - **Sincronização Bidirecional**: Ao selecionar "Pago", preenche automaticamente a data de quitação com o dia atual; ao selecionar "Aguardando Pagamento", limpa a data de quitação e recalcula os alertas de vencimento em tempo real.
- **Colunas Distintas de Datas**:
  - **Data de Vencimento**: Exibe a data limite com cálculo e badge relativo (ex: *Vence Hoje*, *Atrasada há X dias*).
  - **Data de Pagamento (Editável Diretamente)**: Coluna dedicada com campo de data embutido diretamente na tabela para ajuste rápido sem necessidade de abrir modais.
- **Botão Destacado para Edição**:
  - Botão dedicado **"Editar"** com ícone de lápis em cada linha da tabela e nos cards mobile para abrir instantaneamente o formulário com todos os dados da despesa carregados.
- **Cadastro e Edição Intuitivos**:
  - Descrição da Conta (ex: Conta de Luz, Internet Fibra, Aluguel).
  - Valor em Reais (R$) com validação monetária.
  - Data de Vencimento com cálculo automático de dias restantes.
  - Data de Pagamento editável.
  - Status da despesa (**Pago** ou **Aguardando Pagamento**).
  - Categorias padronizadas (*Moradia, Alimentação, Fixas, Variáveis, Negócios, Lazer, Transporte, Saúde, Educação, Outros*).
  - Observações e anotações adicionais (código PIX, link de boleto, etc.).
- **Quitação com 1-Clique**:
  - Botão de atalho rápido na listagem para dar baixa imediata na conta (registrando a data atual) ou reabri-la se necessário.
- **Exclusão Segura**:
  - Modal de confirmação exibindo descrição e valor antes de apagar qualquer lançamento.
  - Botão de atalho rápido na listagem para dar baixa imediata na conta (registrando a data atual) ou reabri-la se necessário.
- **Exclusão Segura**:
  - Modal de confirmação exibindo descrição e valor antes de apagar qualquer lançamento.

### 3. Filtros, Busca e Ordenação
- Busca textual em tempo real por descrição, observações, categoria e valor.
- Filtro rápido por status (*Todas, Pendentes, Pagas, Atrasadas*).
- Dropdown por categorias e por métodos de pagamento.
- Ordenação por:
  - Vencimento mais próximo ou mais distante.
  - Maior valor ou menor valor.
  - Ordem alfabética (A-Z).

### 4. Relatórios, Gráficos e Exportação
- **Gráfico Donut (Chart.js)**: Distribuição percentual das despesas por categoria.
- **Gráfico de Barras**: Comparativo direto de valores entre Pagas, Pendentes e Atrasadas.
- **Tabela de Detalhamento**: Resumo com barras de progresso proporcionais para cada categoria.
- **Exportação CSV**: Arquivo estruturado com separador `;` e codificação UTF-8 com BOM, ideal para abrir diretamente no Microsoft Excel ou Google Sheets.
- **Copiar Resumo Formatado**: Cria um texto amigável pronto para envio no WhatsApp ou e-mail com indicadores visuais e emojis.

### 5. Recursos Adicionais de UX
- **Modo Escuro / Claro**: Alternador na barra superior com persistência no LocalStorage e respeito às preferências do sistema operacional.
- **Centro de Notificações**: Sino com badge animado listando todas as contas críticas com ação de quitação direta.
- **Dados Demo Dinâmicos**: Botão para restaurar uma base de exemplo coerente com a data em que o sistema está sendo executado.

---

## 🔌 Guia de Migração para Banco de Dados (Supabase / Firebase)

A aplicação foi desenvolvida utilizando o padrão **Repository** assíncrono em `js/storage.js`. Toda a aplicação consome os seguintes métodos que retornam Promises:
- `StorageService.getAll()`
- `StorageService.getById(id)`
- `StorageService.create(data)`
- `StorageService.update(id, updates)`
- `StorageService.delete(id)`

### Exemplo de Migração para Supabase

1. Crie a tabela no SQL Editor do Supabase:
```sql
create table public.bills (
  id uuid default gen_random_uuid() primary key,
  description text not null,
  amount numeric(12,2) not null,
  due_date date not null,
  category text not null default 'outros',
  status text not null default 'pendente',
  payment_method text not null default 'pix',
  payment_date date,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS (Row Level Security) conforme suas regras
alter table public.bills enable row level security;
create policy "Allow all operations for authenticated users" on public.bills
  for all using (true);
```

2. No arquivo `index.html`, adicione a CDN do Supabase no `<head>`:
```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
```

3. No arquivo `js/storage.js`, inicialize o cliente e substitua os métodos:
```javascript
const supabaseUrl = 'https://SUA_URL.supabase.co';
const supabaseKey = 'SUA_ANON_KEY';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// Exemplo de implementação no StorageService:
async getAll() {
  const { data, error } = await supabase
    .from('bills')
    .select('*')
    .order('due_date', { ascending: true });
  if (error) throw error;
  return data.map(item => ({
    id: item.id,
    description: item.description,
    amount: parseFloat(item.amount),
    dueDate: item.due_date,
    category: item.category,
    status: item.status,
    paymentMethod: item.payment_method,
    paymentDate: item.payment_date,
    notes: item.notes
  }));
}
```

Nenhuma outra linha dos componentes ou regras de negócio precisará ser alterada!

---

## 💡 Dicas de Uso

1. **Testando Alertas de Vencimento**:
   - Abra a página e veja os cards de "Atrasadas" e "Vencendo Hoje" pré-populados.
   - Clique em **"Ver Contas Urgentes"** no banner para aplicar o filtro imediatamente.
2. **Quitação de Conta**:
   - Clique no ícone verde de check (<i class="text-emerald-500">✓</i>) em qualquer conta da tabela para ver a atualização instantânea do total pago e da barra de progresso.
3. **Exportação**:
   - Clique em **"Copiar Resumo"** e cole no Bloco de Notas ou WhatsApp para conferir a formatação automática.
