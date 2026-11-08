/**
 * Sistema de Gerenciamento de Pagamento de Contas Diário
 * Camada de Acesso a Dados (Storage Service / Repository Pattern)
 * 
 * NOTA DE ARQUITETURA PARA MIGRAÇÃO:
 * Esta camada foi implementada com métodos assíncronos baseados em Promises.
 * Para substituir o LocalStorage pelo Supabase, Firebase ou uma API REST (Node/Python/Go),
 * basta trocar o corpo dos métodos abaixo pela respectiva chamada de rede,
 * sem necessidade de alterar nenhuma linha da camada de UI ou regras de negócio!
 * 
 * Exemplo com Supabase:
 *   async getAll() {
 *     const { data, error } = await supabase.from('bills').select('*').order('due_date', { ascending: true });
 *     if (error) throw error;
 *     return data;
 *   }
 */

(function (window) {
  'use strict';

  class StorageService {
    constructor() {
      this.storageKey = window.AppConfig.STORAGE_KEY;
      this.settingsKey = window.AppConfig.SETTINGS_KEY;
      this._init();
    }

    /**
     * Inicializa o armazenamento garantindo que todas as contas anteriores sejam removidas
     * @private
     */
    _init() {
      try {
        const wipeKey = 'contadiaria_wiped_all_bills_v1';
        if (!localStorage.getItem(wipeKey)) {
          // Limpa todas as contas existentes na primeira execução desta versão
          localStorage.setItem(this.storageKey, JSON.stringify([]));
          localStorage.setItem(wipeKey, 'true');
        } else {
          const existingData = localStorage.getItem(this.storageKey);
          if (!existingData) {
            localStorage.setItem(this.storageKey, JSON.stringify([]));
          }
        }

        const existingSettings = localStorage.getItem(this.settingsKey);
        if (!existingSettings) {
          const defaultSettings = {
            theme: 'system', // 'light', 'dark', 'system'
            monthlyBudget: 8000.00,
            autoMarkOverdue: true
          };
          localStorage.setItem(this.settingsKey, JSON.stringify(defaultSettings));
        }
      } catch (err) {
        console.error('Erro ao inicializar LocalStorage:', err);
      }
    }

    /**
     * Lê com segurança o array de contas do LocalStorage
     * @private
     * @returns {Array<Object>}
     */
    _getStoredBills() {
      try {
        const raw = localStorage.getItem(this.storageKey);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
      } catch (err) {
        console.error('Erro ao ler bills do localStorage:', err);
        return [];
      }
    }

    /**
     * Retorna todas as contas cadastradas
     * @returns {Promise<Array<Object>>}
     */
    async getAll() {
      return new Promise((resolve) => {
        try {
          let bills = this._getStoredBills();
          // Migração transparente de registros legados: CG -> LD e campos de despesas fixas
          let migrated = false;
          bills = bills.map((b) => {
            if (b.location === 'CG') {
              b.location = 'LD';
              migrated = true;
            }
            const isFixed = b.expenseType === 'fixa' || b.category === 'fixas';
            if (isFixed) {
              if (!b.launchDueDate && b.dueDate) {
                b.launchDueDate = b.dueDate;
                migrated = true;
              }
              if (!b.startMonthKey) {
                const orig = b.launchDueDate || b.dueDate;
                b.startMonthKey = orig && orig.includes('-') ? orig.substring(0, 7) : '';
                migrated = true;
              }
              if (!b.dueDay && b.dueDate && b.dueDate.includes('-')) {
                b.dueDay = parseInt(b.dueDate.split('-')[2], 10) || 1;
                migrated = true;
              }
              if (!b.monthlyOverrides && b.monthlyStatus) {
                b.monthlyOverrides = { ...b.monthlyStatus };
                migrated = true;
              } else if (!b.monthlyOverrides) {
                b.monthlyOverrides = {};
                migrated = true;
              }
            }
            return b;
          });
          if (migrated) {
            localStorage.setItem(this.storageKey, JSON.stringify(bills));
          }
          resolve(bills);
        } catch (err) {
          console.error('Falha ao ler contas do storage:', err);
          resolve([]);
        }
      });
    }

    /**
     * Retorna uma conta específica pelo ID
     * @param {string} id
     * @returns {Promise<Object|null>}
     */
    async getById(id) {
      const bills = await this.getAll();
      const found = bills.find((b) => b.id === id);
      return found || null;
    }

    /**
     * Salva uma nova conta
     * @param {Object} billData
     * @returns {Promise<Object>}
     */
    async create(billData) {
      return new Promise((resolve, reject) => {
        try {
          const bills = this._getStoredBills();
          const dueDate = billData.dueDate;
          const dueDay = billData.dueDay || (dueDate && dueDate.includes('-') ? parseInt(dueDate.split('-')[2], 10) : 1);
          const startMonthKey = billData.startMonthKey || (dueDate && dueDate.includes('-') ? dueDate.substring(0, 7) : window.AppConfig.utils.toISODateString().substring(0, 7));
          
          const isFixed = ['fixa', 'variavel'].includes(billData.expenseType)
            ? billData.expenseType === 'fixa'
            : (billData.category === 'fixas');

          const finalStatus = billData.status || 'pendente';
          const finalPaymentDate = finalStatus === 'pago' ? (billData.paymentDate || window.AppConfig.utils.toISODateString()) : null;

          const monthlyOverrides = billData.monthlyOverrides || {};
          if (isFixed && startMonthKey) {
            monthlyOverrides[startMonthKey] = {
              amount: Number(billData.amount) || 0,
              description: String(billData.description || '').trim(),
              dueDate: dueDate,
              dueDay: dueDay,
              location: ['LD', 'REC', 'SE'].includes(billData.location) ? billData.location : (billData.location === 'CG' ? 'LD' : 'LD'),
              category: billData.category || 'outros',
              paymentMethod: billData.paymentMethod || 'pix',
              status: finalStatus,
              paymentDate: finalPaymentDate,
              invoiceNumber: String(billData.invoiceNumber || '').trim(),
              documentNumber: String(billData.documentNumber || '').trim(),
              notes: String(billData.notes || '').trim()
            };
          }

          const newBill = {
            id: billData.id || window.AppConfig.utils.generateId(),
            description: String(billData.description || '').trim(),
            location: ['LD', 'REC', 'SE'].includes(billData.location) ? billData.location : (billData.location === 'CG' ? 'LD' : 'LD'),
            expenseType: isFixed ? 'fixa' : 'variavel',
            dueDay,
            startMonthKey,
            launchDueDate: dueDate,
            invoiceNumber: String(billData.invoiceNumber || '').trim(),
            documentNumber: String(billData.documentNumber || '').trim(),
            amount: Number(billData.amount) || 0,
            dueDate,
            category: billData.category || 'outros',
            status: finalStatus,
            paymentMethod: billData.paymentMethod || 'pix',
            invoiceStatus: billData.invoiceStatus || 'aguardando',
            notes: String(billData.notes || '').trim(),
            paymentDate: finalPaymentDate,
            monthlyOverrides,
            monthlyStatus: monthlyOverrides,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          bills.unshift(newBill); // Insere no início
          localStorage.setItem(this.storageKey, JSON.stringify(bills));
          resolve(newBill);
        } catch (err) {
          reject(err);
        }
      });
    }

    /**
     * Atualiza uma conta existente
     * REGRA DE ISOLAMENTO TEMPORAL (DESPESAS FIXAS):
     * Qualquer alteração realizada em um determinado mês não altera as informações
     * dos meses anteriores e nem dos meses seguintes.
     * @param {string} id
     * @param {Object} updates
     * @returns {Promise<Object>}
     */
    async update(id, updates) {
      return new Promise((resolve, reject) => {
        try {
          const bills = this._getStoredBills();
          const index = bills.findIndex((b) => b.id === id);

          if (index === -1) {
            return reject(new Error(`Conta com id "${id}" não encontrada.`));
          }

          const existing = bills[index];
          const isFixed = existing.expenseType === 'fixa' || updates.expenseType === 'fixa' || existing.category === 'fixas';

          // Determina a chave do mês de referência (YYYY-MM)
          const targetMonthKey = updates.monthKey || (updates.dueDate && updates.dueDate.includes('-') ? updates.dueDate.substring(0, 7) : null);

          // Se a conta for FIXA e houver um mês de referência informado (sem conversão para variável):
          // ISOLAMENTO TOTAL: A alteração só afeta ESSE MÊS ESPECÍFICO.
          // Não altera meses anteriores e nem meses seguintes!
          if (isFixed && targetMonthKey && updates.expenseType !== 'variavel') {
            const monthlyOverrides = existing.monthlyOverrides || existing.monthlyStatus || {};
            const prevMonth = monthlyOverrides[targetMonthKey] || {};

            let monthStatus = updates.status !== undefined ? updates.status : (prevMonth.status || 'pendente');
            let monthPaymentDate = updates.paymentDate !== undefined ? updates.paymentDate : (prevMonth.paymentDate || null);

            if (monthStatus === 'pago' && !monthPaymentDate) {
              monthPaymentDate = window.AppConfig.utils.toISODateString();
            } else if (monthStatus !== 'pago') {
              monthPaymentDate = null;
            }

            const monthData = {
              ...prevMonth,
              status: monthStatus,
              paymentDate: monthPaymentDate,
              amount: updates.amount !== undefined ? Number(updates.amount) : (prevMonth.amount !== undefined ? Number(prevMonth.amount) : Number(existing.amount || 0)),
              description: updates.description !== undefined ? String(updates.description).trim() : (prevMonth.description || existing.description || ''),
              location: updates.location !== undefined ? (updates.location === 'CG' ? 'LD' : updates.location) : (prevMonth.location || existing.location || 'LD'),
              category: updates.category !== undefined ? updates.category : (prevMonth.category || existing.category || 'outros'),
              paymentMethod: updates.paymentMethod !== undefined ? updates.paymentMethod : (prevMonth.paymentMethod || existing.paymentMethod || 'pix'),
              notes: updates.notes !== undefined ? String(updates.notes).trim() : (prevMonth.notes !== undefined ? prevMonth.notes : (existing.notes || '')),
              invoiceNumber: updates.invoiceNumber !== undefined ? String(updates.invoiceNumber).trim() : (prevMonth.invoiceNumber !== undefined ? prevMonth.invoiceNumber : (existing.invoiceNumber || '')),
              documentNumber: updates.documentNumber !== undefined ? String(updates.documentNumber).trim() : (prevMonth.documentNumber !== undefined ? prevMonth.documentNumber : (existing.documentNumber || ''))
            };

            if (updates.dueDate && updates.dueDate.includes('-')) {
              monthData.dueDate = updates.dueDate;
              monthData.dueDay = parseInt(updates.dueDate.split('-')[2], 10);
            }

            monthlyOverrides[targetMonthKey] = monthData;
            existing.monthlyOverrides = monthlyOverrides;
            existing.monthlyStatus = monthlyOverrides; // Mantém compatibilidade total
            existing.updatedAt = new Date().toISOString();

            // Parâmetros de exclusão temporal se houver
            if (updates.excludeFromMonthKey !== undefined) existing.excludeFromMonthKey = updates.excludeFromMonthKey;
            if (updates.endMonthKey !== undefined) existing.endMonthKey = updates.endMonthKey;
            if (updates.excludedMonths !== undefined) existing.excludedMonths = updates.excludedMonths;

            bills[index] = existing;
            localStorage.setItem(this.storageKey, JSON.stringify(bills));
            return resolve(existing);
          }

          // Se for conta VARIÁVEL ou alteração estrutural global:
          const updated = {
            ...existing,
            ...updates,
            updatedAt: new Date().toISOString()
          };

          if (updated.location === 'CG') {
            updated.location = 'LD';
          }

          if (updates.dueDate && updates.dueDate.includes('-')) {
            const parts = updates.dueDate.split('-');
            if (parts.length === 3) {
              updated.dueDay = parseInt(parts[2], 10);
            }
          }

          if (updated.status === 'pago' && !updated.paymentDate) {
            updated.paymentDate = window.AppConfig.utils.toISODateString();
          } else if (updated.status !== 'pago') {
            updated.paymentDate = null;
          }

          bills[index] = updated;
          localStorage.setItem(this.storageKey, JSON.stringify(bills));
          resolve(updated);
        } catch (err) {
          reject(err);
        }
      });
    }

    /**
     * Remove uma conta pelo ID
     * @param {string} id
     * @returns {Promise<boolean>}
     */
    async delete(id) {
      return new Promise((resolve, reject) => {
        try {
          const bills = this._getStoredBills();
          const filtered = bills.filter((b) => b.id !== id);
          localStorage.setItem(this.storageKey, JSON.stringify(filtered));
          resolve(true);
        } catch (err) {
          reject(err);
        }
      });
    }

    /**
     * Exclui despesa fixa a partir de determinado mês em diante (daquele mês para frente)
     * Preserva integralmente o histórico de todos os meses anteriores ao mês informado.
     * @param {string} id
     * @param {string} fromMonthKey YYYY-MM
     * @returns {Promise<Object|boolean>}
     */
    async excludeFixedFromMonth(id, fromMonthKey) {
      const bill = await this.getById(id);
      if (!bill) {
        throw new Error(`Conta não encontrada: ${id}`);
      }

      const isFixed = bill.expenseType === 'fixa' || bill.category === 'fixas';
      if (!isFixed) {
        // Se for despesa variável, exclui completamente
        return this.delete(id);
      }

      const origDueDate = bill.launchDueDate || bill.dueDate;
      const startMonthKey = bill.startMonthKey || (origDueDate && origDueDate.includes('-') ? origDueDate.substring(0, 7) : fromMonthKey);

      // Se o mês de exclusão for menor ou igual ao mês inicial de lançamento,
      // a conta não possui histórico anterior -> remove totalmente
      if (fromMonthKey <= startMonthKey) {
        return this.delete(id);
      }

      // Calcula o mês anterior (endMonthKey)
      const parts = fromMonthKey.split('-');
      let y = parseInt(parts[0], 10);
      let m = parseInt(parts[1], 10) - 1; // 0 a 11
      m--;
      if (m < 0) {
        m = 11;
        y--;
      }
      const pad = (n) => String(n).padStart(2, '0');
      const endMonthKey = `${y}-${pad(m + 1)}`;

      // Atualiza o registro marcando o término a partir de fromMonthKey
      return this.update(id, {
        excludeFromMonthKey: fromMonthKey,
        endMonthKey: endMonthKey
      });
    }

    /**
     * Restaura os dados de exemplo dinâmicos
     * @returns {Promise<Array<Object>>}
     */
    async resetWithMock() {
      return new Promise((resolve) => {
        const mock = window.MockData.generate();
        localStorage.setItem(this.storageKey, JSON.stringify(mock));
        resolve(mock);
      });
    }

    /**
     * Limpa todas as contas
     * @returns {Promise<void>}
     */
    async clearAll() {
      return new Promise((resolve) => {
        localStorage.setItem(this.storageKey, JSON.stringify([]));
        resolve();
      });
    }

    /**
     * Lê as configurações de usuário
     * @returns {Promise<Object>}
     */
    async getSettings() {
      return new Promise((resolve) => {
        try {
          const raw = localStorage.getItem(this.settingsKey);
          resolve(raw ? JSON.parse(raw) : { theme: 'system', monthlyBudget: 8000.00 });
        } catch {
          resolve({ theme: 'system', monthlyBudget: 8000.00 });
        }
      });
    }

    /**
     * Salva as configurações de usuário
     * @param {Object} settings
     * @returns {Promise<Object>}
     */
    async saveSettings(settings) {
      return new Promise((resolve) => {
        localStorage.setItem(this.settingsKey, JSON.stringify(settings));
        resolve(settings);
      });
    }
  }

  window.StorageService = new StorageService();
})(window);
