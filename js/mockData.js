/**
 * Sistema de Gerenciamento de Pagamento de Contas Diário
 * Gerador de Dados de Demonstração (Mock Data Dinâmico)
 * Garante que os dados sejam sempre relativos à data de execução atual.
 */

(function (window) {
  'use strict';

  /**
   * Helper para somar/subtrair dias da data atual e formatar em YYYY-MM-DD
   */
  function getRelativeDate(offsetDays) {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return window.AppConfig.utils.toISODateString(d);
  }

  const MockData = {
    /**
     * Retorna lista realista de contas de teste com datas dinâmicas
     * @returns {Array<Object>}
     */
    generate() {
      return [
        {
          id: 'bill_demo_1',
          description: 'Energia Elétrica (Enel / Neoenergia)',
          location: 'LD',
          expenseType: 'fixa',
          invoiceNumber: '10452',
          documentNumber: 'ENEL-2026/11',
          amount: 284.50,
          dueDate: getRelativeDate(0), // Vence HOJE
          category: 'moradia',
          status: 'pendente',
          paymentMethod: 'pix',
          invoiceStatus: 'recebida',
          notes: 'Código PIX copiado do app da distribuidora. Não esquecer de pagar até as 18h.',
          paymentDate: null,
          createdAt: new Date().toISOString()
        },
        {
          id: 'bill_demo_2',
          description: 'Internet Fibra Óptica 600 Mega',
          location: 'REC',
          expenseType: 'fixa',
          invoiceNumber: '89211',
          documentNumber: 'FAT-600',
          amount: 129.90,
          dueDate: getRelativeDate(0), // Vence HOJE (mas já foi paga)
          category: 'fixas',
          status: 'pago',
          paymentMethod: 'debito_automatico',
          invoiceStatus: 'recebida',
          notes: 'Débito automático confirmado em conta corrente.',
          paymentDate: getRelativeDate(0),
          createdAt: new Date().toISOString()
        },
        {
          id: 'bill_demo_3',
          description: 'Hospedagem Cloud & Servidores (AWS)',
          location: 'SE',
          expenseType: 'fixa',
          invoiceNumber: '44810',
          documentNumber: 'AWS-992',
          amount: 450.00,
          dueDate: getRelativeDate(-3), // ATRASADO HÁ 3 DIAS
          category: 'negocios',
          status: 'pendente', // Virará atrasado pela regra de negócio
          paymentMethod: 'cartao_credito',
          invoiceStatus: 'recebida',
          notes: 'Fatura de serviços em nuvem pendente de autorização do financeiro.',
          paymentDate: null,
          createdAt: new Date().toISOString()
        },
        {
          id: 'bill_demo_4',
          description: 'Fornecedor de Embalagens e Insumos',
          location: 'LD',
          expenseType: 'variavel',
          invoiceNumber: '',
          documentNumber: '',
          amount: 1150.00,
          dueDate: getRelativeDate(-1), // ATRASADO HÁ 1 DIA
          category: 'negocios',
          status: 'pendente', // Atrasado
          paymentMethod: 'boleto',
          invoiceStatus: 'aguardando',
          notes: 'Boleto bancário emitido pelo banco Santander. Segunda via solicitada.',
          paymentDate: null,
          createdAt: new Date().toISOString()
        },
        {
          id: 'bill_demo_5',
          description: 'Aluguel do Imóvel / Condomínio',
          location: 'REC',
          expenseType: 'fixa',
          invoiceNumber: '33100',
          documentNumber: 'LOC-2450',
          amount: 2450.00,
          dueDate: getRelativeDate(2), // Vence em 2 dias
          category: 'moradia',
          status: 'pendente',
          paymentMethod: 'transferencia',
          invoiceStatus: 'recebida',
          notes: 'Transferência direta para a imobiliária ou PIX chave CNPJ.',
          paymentDate: null,
          createdAt: new Date().toISOString()
        },
        {
          id: 'bill_demo_6',
          description: 'Plano de Saúde Familiar',
          location: 'SE',
          expenseType: 'fixa',
          invoiceNumber: '',
          documentNumber: '',
          amount: 890.00,
          dueDate: getRelativeDate(4), // Vence em 4 dias
          category: 'saude',
          status: 'pendente',
          paymentMethod: 'boleto',
          invoiceStatus: 'aguardando',
          notes: 'Reajuste anual aplicado.',
          paymentDate: null,
          createdAt: new Date().toISOString()
        },
        {
          id: 'bill_demo_7',
          description: 'Supermercado Mensal (Compras da Família)',
          location: 'LD',
          expenseType: 'variavel',
          invoiceNumber: '12984',
          documentNumber: 'CUP-742',
          amount: 742.60,
          dueDate: getRelativeDate(-5), // Pago há 5 dias
          category: 'alimentacao',
          status: 'pago',
          paymentMethod: 'cartao_credito',
          invoiceStatus: 'recebida',
          notes: 'Compras de mantimentos e produtos de limpeza.',
          paymentDate: getRelativeDate(-5),
          createdAt: new Date().toISOString()
        },
        {
          id: 'bill_demo_8',
          description: 'Combustível e Estacionamento',
          location: 'REC',
          expenseType: 'variavel',
          invoiceNumber: '99201',
          documentNumber: 'POSTO-220',
          amount: 220.00,
          dueDate: getRelativeDate(-2), // Pago há 2 dias
          category: 'transporte',
          status: 'pago',
          paymentMethod: 'pix',
          invoiceStatus: 'recebida',
          notes: 'Abastecimento posto Ipiranga.',
          paymentDate: getRelativeDate(-2),
          createdAt: new Date().toISOString()
        },
        {
          id: 'bill_demo_9',
          description: 'Assinatura Streaming & Games (Netflix + Spotify)',
          location: 'SE',
          expenseType: 'fixa',
          invoiceNumber: '',
          documentNumber: '',
          amount: 79.80,
          dueDate: getRelativeDate(7), // Vence em 7 dias
          category: 'lazer',
          status: 'pendente',
          paymentMethod: 'cartao_credito',
          invoiceStatus: 'aguardando',
          notes: 'Cobrança recorrente no cartão virtual.',
          paymentDate: null,
          createdAt: new Date().toISOString()
        },
        {
          id: 'bill_demo_10',
          description: 'Curso de Especialização & Certificação Tech',
          location: 'LD',
          expenseType: 'fixa',
          invoiceNumber: '22190',
          documentNumber: 'PARC-4/12',
          amount: 320.00,
          dueDate: getRelativeDate(10), // Vence em 10 dias
          category: 'educacao',
          status: 'pendente',
          paymentMethod: 'boleto',
          invoiceStatus: 'aguardando',
          notes: 'Parcela 4/12.',
          paymentDate: null,
          createdAt: new Date().toISOString()
        }
      ];
    }
  };

  window.MockData = MockData;
})(window);
