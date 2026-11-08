/**
 * Sistema de Gerenciamento de Pagamento de Contas Diário
 * Gerenciador de Gráficos e Visualizações (ChartService com Chart.js)
 */

(function (window) {
  'use strict';

  class ChartService {
    constructor() {
      this.categoryChart = null;
      this.statusChart = null;
      this.annualChart = null;
    }

    /**
     * Retorna se o tema atual é dark
     * @returns {boolean}
     */
    isDarkMode() {
      return document.documentElement.classList.contains('dark');
    }

    /**
     * Cores de tema para os gráficos (Integradas com o Tema Verde Claro)
     */
    getThemeColors() {
      const dark = this.isDarkMode();
      return {
        textColor: dark ? '#d1fae5' : '#064e3b',
        gridColor: dark ? 'rgba(6, 78, 59, 0.2)' : 'rgba(6, 78, 59, 0.08)',
        tooltipBg: dark ? '#0a2318' : '#f5fcf8',
        tooltipTitle: dark ? '#d1fae5' : '#064e3b',
        tooltipBody: dark ? '#a7f3d0' : '#134e35',
        tooltipBorder: dark ? '#065f46' : '#bce7ce'
      };
    }

    /**
     * Renderiza ou atualiza o gráfico de despesas por categoria (Doughnut)
     * @param {string} canvasId
     * @param {Array<Object>} categoryData
     */
    renderCategoryChart(canvasId, categoryData) {
      const canvas = document.getElementById(canvasId);
      if (!canvas || !window.Chart) return;

      const theme = this.getThemeColors();

      if (categoryData.length === 0) {
        if (this.categoryChart) {
          this.categoryChart.destroy();
          this.categoryChart = null;
        }
        return;
      }

      const labels = categoryData.map((c) => c.meta.label);
      const values = categoryData.map((c) => c.total);
      const colors = categoryData.map((c) => c.meta.color);

      if (this.categoryChart) {
        this.categoryChart.data.labels = labels;
        this.categoryChart.data.datasets[0].data = values;
        this.categoryChart.data.datasets[0].backgroundColor = colors;
        this.categoryChart.options.plugins.legend.labels.color = theme.textColor;
        this.categoryChart.update();
        return;
      }

      const ctx = canvas.getContext('2d');
      this.categoryChart = new window.Chart(ctx, {
        type: 'doughnut',
        data: {
          labels,
          datasets: [
            {
              data: values,
              backgroundColor: colors,
              borderWidth: 2,
              borderColor: this.isDarkMode() ? '#0f172a' : '#ffffff',
              hoverOffset: 6
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '70%',
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                boxWidth: 12,
                boxHeight: 12,
                padding: 14,
                color: theme.textColor,
                font: {
                  family: "'Plus Jakarta Sans', sans-serif",
                  size: 12,
                  weight: '500'
                }
              }
            },
            tooltip: {
              backgroundColor: theme.tooltipBg,
              titleColor: theme.tooltipTitle,
              bodyColor: theme.tooltipBody,
              borderColor: theme.tooltipBorder,
              borderWidth: 1,
              padding: 12,
              boxPadding: 6,
              usePointStyle: true,
              callbacks: {
                label(context) {
                  const val = context.raw || 0;
                  const total = context.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                  const pct = total > 0 ? ((val / total) * 100).toFixed(1) : 0;
                  return ` ${context.label}: ${window.AppConfig.utils.formatBRL(val)} (${pct}%)`;
                }
              }
            }
          }
        }
      });
    }

    /**
     * Renderiza ou atualiza o gráfico comparativo de Pagas vs Pendentes vs Atrasadas (Bar)
     * @param {string} canvasId
     * @param {Object} kpis
     */
    renderStatusChart(canvasId, kpis) {
      const canvas = document.getElementById(canvasId);
      if (!canvas || !window.Chart) return;

      const theme = this.getThemeColors();
      const labels = ['Pago', 'Pendente', 'Atrasado'];
      const values = [kpis.totalPaid || 0, kpis.totalPending || 0, kpis.overdueTotal || 0];
      const counts = [kpis.paidCount || 0, kpis.pendingCount || 0, kpis.overdueCount || 0];
      const colors = ['#10b981', '#f59e0b', '#f43f5e'];

      if (this.statusChart) {
        this.statusChart.data.datasets[0].data = values;
        this.statusChart.options.scales.x.ticks.color = theme.textColor;
        this.statusChart.options.scales.y.ticks.color = theme.textColor;
        this.statusChart.options.scales.y.grid.color = theme.gridColor;
        this.statusChart.update();
        return;
      }

      const ctx = canvas.getContext('2d');
      this.statusChart = new window.Chart(ctx, {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              label: 'Total (R$)',
              data: values,
              backgroundColor: colors,
              borderRadius: 8,
              borderSkipped: false,
              barThickness: 36
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              backgroundColor: theme.tooltipBg,
              titleColor: theme.tooltipTitle,
              bodyColor: theme.tooltipBody,
              borderColor: theme.tooltipBorder,
              borderWidth: 1,
              padding: 12,
              callbacks: {
                label(context) {
                  const idx = context.dataIndex;
                  return [
                    ` Valor: ${window.AppConfig.utils.formatBRL(context.raw)}`,
                    ` Quantidade: ${counts[idx]} contas`
                  ];
                }
              }
            }
          },
          scales: {
            x: {
              grid: {
                display: false
              },
              ticks: {
                color: theme.textColor,
                font: {
                  family: "'Plus Jakarta Sans', sans-serif",
                  size: 12,
                  weight: '600'
                }
              }
            },
            y: {
              grid: {
                color: theme.gridColor
              },
              ticks: {
                color: theme.textColor,
                font: {
                  family: "'Plus Jakarta Sans', sans-serif",
                  size: 11
                },
                callback(val) {
                  if (val >= 1000) return 'R$ ' + (val / 1000).toFixed(0) + 'k';
                  return 'R$ ' + val;
                }
              }
            }
          }
        }
      });
    }

    /**
     * Renderiza ou atualiza o gráfico em formato de coluna com o período de 12 meses do ano vigente:
     * Exibe as despesas mensais e os valores pagos em cada mês lado a lado
     * @param {string} canvasId
     * @param {Array<Object>} monthlyData Lista com os 12 meses do ano vigente
     * @param {number} year Ano vigente
     */
    renderAnnualBreakdownChart(canvasId, monthlyData, year) {
      const canvas = document.getElementById(canvasId);
      if (!canvas || !window.Chart) return;

      const theme = this.getThemeColors();
      const labels = monthlyData.map((m) => m.shortName || m.label.substring(0, 3));
      const fullLabels = monthlyData.map((m) => m.label);
      const totalExpenses = monthlyData.map((m) => m.total || 0);
      const totalPaid = monthlyData.map((m) => m.paid || 0);
      const totalPending = monthlyData.map((m) => m.pending || 0);
      const billCounts = monthlyData.map((m) => m.count || 0);
      const paidCounts = monthlyData.map((m) => m.paidCount || 0);

      const colorExpenses = '#2563eb'; // Azul profissional corporativo
      const colorPaid = '#10b981'; // Verde Esmeralda quitado

      if (this.annualChart) {
        this.annualChart.data.labels = labels;
        this.annualChart.data.datasets[0].data = totalExpenses;
        this.annualChart.data.datasets[1].data = totalPaid;
        this.annualChart.options.scales.x.ticks.color = theme.textColor;
        this.annualChart.options.scales.y.ticks.color = theme.textColor;
        this.annualChart.options.scales.y.grid.color = theme.gridColor;
        this.annualChart.options.plugins.legend.labels.color = theme.textColor;
        this.annualChart.update();
        return;
      }

      const ctx = canvas.getContext('2d');
      this.annualChart = new window.Chart(ctx, {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              label: 'Despesas Mensais (Total)',
              data: totalExpenses,
              backgroundColor: colorExpenses,
              hoverBackgroundColor: '#1d4ed8',
              borderRadius: 6,
              borderSkipped: false,
              barPercentage: 0.85,
              categoryPercentage: 0.72
            },
            {
              label: 'Valores Pagos (Quitado)',
              data: totalPaid,
              backgroundColor: colorPaid,
              hoverBackgroundColor: '#059669',
              borderRadius: 6,
              borderSkipped: false,
              barPercentage: 0.85,
              categoryPercentage: 0.72
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            mode: 'index',
            intersect: false
          },
          plugins: {
            legend: {
              display: true,
              position: 'top',
              align: 'end',
              labels: {
                boxWidth: 14,
                boxHeight: 14,
                padding: 16,
                color: theme.textColor,
                font: {
                  family: "'Plus Jakarta Sans', sans-serif",
                  size: 12,
                  weight: '600'
                }
              }
            },
            tooltip: {
              backgroundColor: theme.tooltipBg,
              titleColor: theme.tooltipTitle,
              bodyColor: theme.tooltipBody,
              borderColor: theme.tooltipBorder,
              borderWidth: 1,
              padding: 12,
              usePointStyle: true,
              callbacks: {
                title(items) {
                  const idx = items[0]?.dataIndex ?? 0;
                  return fullLabels[idx] || items[0]?.label || '';
                },
                label(context) {
                  const idx = context.dataIndex;
                  const val = context.raw || 0;
                  const format = window.AppConfig.utils.formatBRL;
                  if (context.datasetIndex === 0) {
                    return ` Despesas do Mês: ${format(val)} (${billCounts[idx]} contas)`;
                  } else {
                    const monthTotal = totalExpenses[idx] || 0;
                    const pct = monthTotal > 0 ? ((val / monthTotal) * 100).toFixed(0) : 0;
                    return ` Valores Pagos: ${format(val)} (${paidCounts[idx]} pagas • ${pct}%)`;
                  }
                },
                afterBody(items) {
                  const idx = items[0]?.dataIndex ?? 0;
                  const pending = totalPending[idx] || 0;
                  const format = window.AppConfig.utils.formatBRL;
                  return ` Saldo a Pagar: ${format(pending)}`;
                }
              }
            }
          },
          scales: {
            x: {
              grid: {
                display: false
              },
              ticks: {
                color: theme.textColor,
                font: {
                  family: "'Plus Jakarta Sans', sans-serif",
                  size: 11,
                  weight: '600'
                }
              }
            },
            y: {
              grid: {
                color: theme.gridColor
              },
              ticks: {
                color: theme.textColor,
                font: {
                  family: "'Plus Jakarta Sans', sans-serif",
                  size: 11
                },
                callback(val) {
                  if (val >= 1000) return 'R$ ' + (val / 1000).toLocaleString('pt-BR') + 'k';
                  return 'R$ ' + val;
                }
              }
            }
          }
        }
      });
    }

    /**
     * Atualiza os temas dos gráficos quando o usuário alternar Modo Escuro/Claro
     */
    refreshTheme() {
      const theme = this.getThemeColors();

      if (this.annualChart) {
        this.annualChart.options.scales.x.ticks.color = theme.textColor;
        this.annualChart.options.scales.y.ticks.color = theme.textColor;
        this.annualChart.options.scales.y.grid.color = theme.gridColor;
        this.annualChart.options.plugins.legend.labels.color = theme.textColor;
        this.annualChart.update();
      }

      if (this.categoryChart) {
        this.categoryChart.data.datasets[0].borderColor = this.isDarkMode() ? '#0f172a' : '#ffffff';
        this.categoryChart.options.plugins.legend.labels.color = theme.textColor;
        this.categoryChart.update();
      }

      if (this.statusChart) {
        this.statusChart.options.scales.x.ticks.color = theme.textColor;
        this.statusChart.options.scales.y.ticks.color = theme.textColor;
        this.statusChart.options.scales.y.grid.color = theme.gridColor;
        this.statusChart.update();
      }
    }
  }

  window.ChartService = new ChartService();
})(window);
