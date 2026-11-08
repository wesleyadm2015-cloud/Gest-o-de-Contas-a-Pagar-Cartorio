/**
 * Sistema de Gerenciamento de Pagamento de Contas Diário
 * Serviço de Exportação de Dados (CSV e Resumo em Texto Formatado)
 */

(function (window) {
  'use strict';

  class ExportService {
    /**
     * Exporta a lista de contas para um arquivo CSV formatado para Excel
     * @param {Array<Object>} bills
     * @param {string} filename
     */
    exportToCSV(bills, filename = null) {
      if (!bills || bills.length === 0) {
        alert('Não há contas para exportar.');
        return;
      }

      const headers = [
        'ID',
        'Local',
        'Tipo de Despesa',
        'Descrição',
        'Nota Fiscal',
        'Número do Documento',
        'Valor (R$)',
        'Data de Vencimento',
        'Data de Pagamento',
        'Status',
        'Categoria',
        'Método de Pagamento',
        'Observações'
      ];

      const rows = bills.map((b) => {
        const catLabel = (b.categoryMeta && b.categoryMeta.label) || b.category || '';
        const payLabel = (b.paymentMeta && b.paymentMeta.label) || b.paymentMethod || '';
        const statusLabel = (b.statusMeta && b.statusMeta.label) || b.status || '';
        const loc = b.location === 'CG' ? 'LD' : (b.location || 'LD');
        const expenseTypeLabel = b.expenseType === 'variavel' ? 'V (Variável)' : 'F (Fixa)';
        const nf = (b.invoiceNumber || '').replace(/"/g, '""');
        const doc = (b.documentNumber || '').replace(/"/g, '""');
        const notes = (b.notes || '').replace(/"/g, '""');
        const desc = (b.description || '').replace(/"/g, '""');

        return [
          `"${b.id}"`,
          `"${loc}"`,
          `"${expenseTypeLabel}"`,
          `"${desc}"`,
          `"${nf}"`,
          `"${doc}"`,
          `"${b.amount.toFixed(2).replace('.', ',')}"`,
          `"${window.AppConfig.utils.formatDate(b.dueDate)}"`,
          `"${b.paymentDate ? window.AppConfig.utils.formatDate(b.paymentDate) : 'Não quitada'}"`,
          `"${statusLabel}"`,
          `"${catLabel}"`,
          `"${payLabel}"`,
          `"${notes}"`
        ].join(';');
      });

      // BOM UTF-8 (\uFEFF) para garantir que caracteres acentuados funcionem perfeitamente no Excel
      const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);

      const today = window.AppConfig.utils.toISODateString();
      const exportName = filename || `relatorio_contas_${today}.csv`;

      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', exportName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }

    /**
     * Gera um resumo em texto puro formatado para colar em WhatsApp, E-mail ou Bloco de Notas
     * @param {Array<Object>} bills
     * @param {Object} kpis
     * @returns {string}
     */
    generateFormattedSummary(bills, kpis) {
      const today = window.AppConfig.utils.toISODateString();
      const dateFormatted = window.AppConfig.utils.formatDate(today);

      let text = `📊 RELATÓRIO DE CONTAS - CONTA DIÁRIA\n`;
      text += `📅 Data de Emissão: ${dateFormatted}\n`;
      text += `--------------------------------------------------\n\n`;

      text += `💰 RESUMO FINANCEIRO GERAL:\n`;
      text += `• Total Comprometido: ${window.AppConfig.utils.formatBRL(kpis.totalAmount)} (${kpis.totalBillsCount} contas)\n`;
      text += `• Total Pago: ${window.AppConfig.utils.formatBRL(kpis.totalPaid)} (${kpis.paidPercentage}% quitado)\n`;
      text += `• Total a Pagar: ${window.AppConfig.utils.formatBRL(kpis.totalPending)} (${kpis.pendingCount} pendentes)\n\n`;

      text += `🚨 STATUS DE ATENÇÃO:\n`;
      text += `• Contas Atrasadas / Vencidas: ${kpis.overdueCount} (${window.AppConfig.utils.formatBRL(kpis.overdueTotal)})\n`;
      text += `• Contas Vencendo Hoje: ${kpis.dueTodayPendingCount} pendentes (${window.AppConfig.utils.formatBRL(kpis.dueTodayTotal)})\n\n`;

      // Categorias
      const categories = window.BillService.getCategoryBreakdown(bills);
      if (categories.length > 0) {
        text += `📂 DESPESAS POR CATEGORIA:\n`;
        categories.forEach((c) => {
          text += `• ${c.meta.label}: ${window.AppConfig.utils.formatBRL(c.total)} (${c.percentage}% | ${c.count} contas)\n`;
        });
        text += `\n`;
      }

      // Contas Detalhadas
      text += `📋 LISTAGEM DAS CONTAS:\n`;
      bills.forEach((b) => {
        let tag = '[⏳ PENDENTE]';
        if (b.effectiveStatus === 'pago') tag = '[✅ PAGO]';
        else if (b.effectiveStatus === 'atrasado') tag = '[🚨 ATRASADO]';

        const cat = (b.categoryMeta && b.categoryMeta.label) || '';
        const pay = (b.paymentMeta && b.paymentMeta.label) || '';
        const tipo = b.expenseType === 'variavel' ? 'Variável' : 'Fixa';
        const val = window.AppConfig.utils.formatBRL(b.amount);
        const venc = window.AppConfig.utils.formatDate(b.dueDate);
        const pag = b.effectiveStatus === 'pago' && b.paymentDate ? ` | Pago em: ${window.AppConfig.utils.formatDate(b.paymentDate)}` : ' | Pagamento: Pendente';

        text += `${tag} ${val} - ${b.description} [${tipo}] | Venc: ${venc}${pag} | Cat: ${cat} | Meio: ${pay}\n`;
      });

      text += `\n--------------------------------------------------\n`;
      text += `Gerado automaticamente via ContaDiária App.`;

      return text;
    }

    /**
     * Copia o resumo formatado diretamente para a área de transferência do usuário
     * @param {Array<Object>} bills
     * @param {Object} kpis
     * @returns {Promise<boolean>}
     */
    async copySummaryToClipboard(bills, kpis) {
      const summary = this.generateFormattedSummary(bills, kpis);
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(summary);
          return true;
        } else {
          // Fallback para navegadores legados ou ambientes sem clipboard API
          const textArea = document.createElement('textarea');
          textArea.value = summary;
          textArea.style.position = 'fixed';
          textArea.style.left = '-999999px';
          textArea.style.top = '-999999px';
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          const successful = document.execCommand('copy');
          document.body.removeChild(textArea);
          return successful;
        }
      } catch (err) {
        console.error('Falha ao copiar para clipboard:', err);
        return false;
      }
    }

    /**
     * Exporta as despesas de um mês selecionado para planilha Excel (.csv formatado para Excel em português)
     * @param {Array<Object>} bills Todas as contas cadastradas
     * @param {number} year Ano
     * @param {number} monthIndex Mês (0 a 11)
     * @param {string} monthLabel Rótulo amigável (ex: 'Novembro de 2026')
     */
    exportMonthToExcel(bills, year, monthIndex, monthLabel) {
      const monthBills = window.BillService.getMonthBills(bills, year, monthIndex);
      if (!monthBills || monthBills.length === 0) {
        window.UIManager.showToast(`Não há despesas cadastradas para o mês de ${monthLabel}.`, 'info');
        return;
      }

      const cleanMonth = (monthLabel || `mes_${monthIndex + 1}_${year}`)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '_');
      const filename = `despesas_pagas_${cleanMonth}.csv`;

      this.exportToCSV(monthBills, filename);
      window.UIManager.showToast(`Planilha Excel de ${monthLabel} exportada com sucesso!`, 'success');
    }
  }

  window.ExportService = new ExportService();
})(window);
