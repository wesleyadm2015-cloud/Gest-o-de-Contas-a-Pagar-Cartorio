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
          
          const newBill = {
            id: billData.id || window.AppConfig.utils.generateId(),
            description: String(billData.description || '').trim(),
            location: ['LD', 'REC', 'SE'].includes(billData.location) ? billData.location : (billData.location === 'CG' ? 'LD' : 'LD'),
            expenseType: ['fixa', 'variavel'].includes(billData.expenseType) ? billData.expenseType : (billData.category === 'fixas' ? 'fixa' : 'variavel'),
            dueDay,
            startMonthKey,
            launchDueDate: dueDate,
            invoiceNumber: String(billData.invoiceNumber || '').trim(),
            documentNumber: String(billData.documentNumber || '').trim(),
            amount: Number(billData.amount) || 0,
            dueDate,
            category: billData.category || 'outros',
            status: billData.status || 'pendente',
            paymentMethod: billData.paymentMethod || 'pix',
            invoiceStatus: billData.invoiceStatus || 'aguardando',
            notes: String(billData.notes || '').trim(),
            paymentDate: billData.status === 'pago' ? (billData.paymentDate || window.AppConfig.utils.toISODateString()) : null,
            monthlyStatus: billData.monthlyStatus || {},
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

          const isFixed = updated.expenseType === 'fixa' || updated.category === 'fixas';
          if (isFixed) {
            if (!updated.startMonthKey) {
              const origDueDate = existing.launchDueDate || existing.dueDate || updates.dueDate;
              updated.startMonthKey = existing.startMonthKey || (origDueDate && origDueDate.includes('-') ? origDueDate.substring(0, 7) : window.AppConfig.utils.toISODateString().substring(0, 7));
            }
            if (!updated.launchDueDate) {
              updated.launchDueDate = existing.launchDueDate || existing.dueDate || updates.dueDate;
            }
          }

          // Se a conta for fixa e houver monthKey informada, salva o status daquele mês específico
          if (isFixed && updates.monthKey) {
            updated.monthlyStatus = updated.monthlyStatus || {};
            updated.monthlyStatus[updates.monthKey] = {
              status: updates.status !== undefined ? updates.status : (updated.monthlyStatus[updates.monthKey]?.status || updated.status || 'pendente'),
              paymentDate: updates.paymentDate !== undefined ? updates.paymentDate : (updated.monthlyStatus[updates.monthKey]?.paymentDate || updated.paymentDate || null),
              invoiceNumber: updates.invoiceNumber !== undefined ? updates.invoiceNumber : (updated.monthlyStatus[updates.monthKey]?.invoiceNumber || ''),
              documentNumber: updates.documentNumber !== undefined ? updates.documentNumber : (updated.monthlyStatus[updates.monthKey]?.documentNumber || '')
            };
          }

          // Regra de consistência para data de pagamento no lançamento base
          if (!isFixed || !updates.monthKey) {
            if (updated.status === 'pago' && !updated.paymentDate) {
              updated.paymentDate = window.AppConfig.utils.toISODateString();
            } else if (updated.status !== 'pago') {
              updated.paymentDate = null;
            }
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
