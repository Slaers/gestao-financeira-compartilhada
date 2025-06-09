import { Component, OnInit, OnDestroy } from '@angular/core';
import { ChartConfiguration, ChartData, ChartOptions, ChartType } from 'chart.js';
import { Subscription } from 'rxjs';
import { LancamentoService } from '../../services/lancamento.service';
import { Lancamento } from '../../models/lancamento.model';
// Import BaseChartDirective if using ng2-charts v3+
// For ng2-charts v2 or if ChartModule is globally provided, it might not be needed here explicitly.
// import { BaseChartDirective } from 'ng2-charts';


@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'] // If you add specific styles
})
export class DashboardComponent implements OnInit, OnDestroy {
  private lancamentosSubscription: Subscription | undefined;
  errorMessage: string | null = null;

  // Pie Chart for Expenses by Category
  public pieChartOptions: ChartOptions<'pie'> = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: 'top',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed;
            return `${label}: R$ ${value.toFixed(2)}`;
          }
        }
      }
    }
  };
  public pieChartData: ChartData<'pie', number[], string | string[]> = {
    labels: [],
    datasets: [{
      data: [],
      backgroundColor: [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40',
        '#FFCD56', '#C9CBCF', '#32CD32', '#FFD700'
      ],
      hoverBackgroundColor: [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40',
        '#FFCD56', '#C9CBCF', '#32CD32', '#FFD700'
      ],
      hoverBorderColor: 'rgba(0, 0, 0, 0.1)'
    }]
  };
  public hasDespesasData: boolean = false;

  // Bar Chart for Revenue vs Expenses
   public barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    scales: {
      x: {},
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return 'R$ ' + value;
          }
        }
      }
    },
    plugins: {
      legend: {
        display: true,
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(context.parsed.y);
            }
            return label;
          }
        }
      }
    }
  };
  public barChartData: ChartData<'bar'> = {
    labels: [], // e.g., ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
    datasets: [
      { data: [], label: 'Receitas', backgroundColor: 'rgba(75, 192, 192, 0.5)', borderColor: 'rgb(75, 192, 192)', stack: 'a' },
      { data: [], label: 'Despesas', backgroundColor: 'rgba(255, 99, 132, 0.5)', borderColor: 'rgb(255, 99, 132)', stack: 'a' }
    ]
  };
  public hasMovimentacoesData: boolean = false;


  constructor(private lancamentoService: LancamentoService) {}

  ngOnInit(): void {
    this.loadLancamentos();
  }

  loadLancamentos(): void {
    this.lancamentosSubscription = this.lancamentoService.getLancamentos().subscribe({
      next: (lancamentos) => {
        this.processLancamentosForCharts(lancamentos);
      },
      error: (err) => {
        console.error('Error loading lancamentos for dashboard:', err);
        this.errorMessage = 'Erro ao carregar dados para o dashboard.';
      }
    });
  }

  processLancamentosForCharts(lancamentos: Lancamento[]): void {
    // Process for Pie Chart (Expenses by Category)
    const expenses = lancamentos.filter(l => l.tipo === 'despesa');
    if (expenses.length > 0) {
        const categoryTotals: { [key: string]: number } = {};
        expenses.forEach(e => {
            const category = e.categoria || 'Sem Categoria';
            categoryTotals[category] = (categoryTotals[category] || 0) + e.valor;
        });
        this.pieChartData.labels = Object.keys(categoryTotals);
        this.pieChartData.datasets[0].data = Object.values(categoryTotals);
        this.hasDespesasData = true;
    } else {
        this.pieChartData.labels = [];
        this.pieChartData.datasets[0].data = [];
        this.hasDespesasData = false;
    }


    // Process for Bar Chart (Revenue vs Expenses - last 6 months)
    const now = new Date();
    const lastSixMonths: string[] = [];
    const monthlyData: { [month: string]: { receitas: number, despesas: number } } = {};

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = d.toLocaleString('default', { month: 'short' });
      const yearMonth = `${monthName}/${d.getFullYear().toString().slice(-2)}`; // e.g., Jan/23
      lastSixMonths.push(yearMonth);
      monthlyData[yearMonth] = { receitas: 0, despesas: 0 };
    }

    let movimentacoesFound = false;
    lancamentos.forEach(l => {
      const lancamentoDate = new Date(l.data);
      const monthName = lancamentoDate.toLocaleString('default', { month: 'short' });
      const yearMonth = `${monthName}/${lancamentoDate.getFullYear().toString().slice(-2)}`;

      if (monthlyData[yearMonth]) {
        movimentacoesFound = true;
        if (l.tipo === 'receita') {
          monthlyData[yearMonth].receitas += l.valor;
        } else if (l.tipo === 'despesa') {
          monthlyData[yearMonth].despesas += l.valor;
        }
      }
    });

    this.barChartData.labels = lastSixMonths;
    this.barChartData.datasets[0].data = lastSixMonths.map(m => monthlyData[m]?.receitas || 0);
    this.barChartData.datasets[1].data = lastSixMonths.map(m => monthlyData[m]?.despesas || 0);
    this.hasMovimentacoesData = movimentacoesFound;

    // Important: To make ng2-charts update, we might need to create new objects for chart data/labels
    // or use the chart instance to call update(). For simplicity, direct assignment is used first.
    // If charts don't update, will need to trigger change detection or re-assign chart objects.
    this.pieChartData = { ...this.pieChartData };
    this.barChartData = { ...this.barChartData };

  }

  ngOnDestroy(): void {
    if (this.lancamentosSubscription) {
      this.lancamentosSubscription.unsubscribe();
    }
  }
}
