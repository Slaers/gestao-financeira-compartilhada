import { Chart, registerables } from 'chart.js/auto';
import { lancamentoService } from '../services/lancamento.service';
import { Lancamento } from '../models/lancamento.model';
import { Timestamp } from 'firebase/firestore';

Chart.register(...registerables);

let pieChartInstance: Chart | null = null;
let barChartInstance: Chart | null = null;

let pieChartCanvas: HTMLCanvasElement | null = null;
let barChartCanvas: HTMLCanvasElement | null = null;
let dashboardErrorMessageDiv: HTMLDivElement | null = null;
let pieChartNoDataMessageDiv: HTMLDivElement | null = null;
let barChartNoDataMessageDiv: HTMLDivElement | null = null;

const commonChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const,
    },
    tooltip: {
      enabled: true,
    }
  }
};

function getRandomColor() {
  const r = Math.floor(Math.random() * 255);
  const g = Math.floor(Math.random() * 255);
  const b = Math.floor(Math.random() * 255);
  return `rgba(${r}, ${g}, ${b}, 0.7)`;
}

function processLancamentosForPieChart(lancamentos: Lancamento[]) {
  if (!pieChartCanvas || !pieChartNoDataMessageDiv) return;

  const despesasPorCategoria: { [key: string]: number } = {};
  let hasDespesasData = false;

  lancamentos.forEach(lanc => {
    if (lanc.tipo === 'despesa' && lanc.categoria) {
      despesasPorCategoria[lanc.categoria] = (despesasPorCategoria[lanc.categoria] || 0) + lanc.valor;
      hasDespesasData = true;
    }
  });

  if (pieChartInstance) {
    pieChartInstance.destroy();
    pieChartInstance = null;
  }

  if (hasDespesasData) {
    pieChartNoDataMessageDiv.style.display = 'none';
    const pieChartData = {
      labels: Object.keys(despesasPorCategoria),
      datasets: [{
        data: Object.values(despesasPorCategoria),
        backgroundColor: Object.keys(despesasPorCategoria).map(() => getRandomColor()),
      }]
    };
    const ctx = pieChartCanvas.getContext('2d');
    if (ctx) {
      pieChartInstance = new Chart(ctx, {
        type: 'pie',
        data: pieChartData,
        options: { ...commonChartOptions, plugins: { ...commonChartOptions.plugins, legend: { position: 'right' as const }}}
      });
    }
  } else {
    pieChartNoDataMessageDiv.style.display = 'block';
  }
}

function processLancamentosForBarChart(lancamentos: Lancamento[]) {
  if (!barChartCanvas || !barChartNoDataMessageDiv) return;

  const movimentacoesPorMes: {
    [key: string]: { receitas: number, despesas: number }
  } = {};
  let hasMovimentacoesData = false;

  const seisMesesAtras = new Date();
  seisMesesAtras.setMonth(seisMesesAtras.getMonth() - 5); // Include current month + 5 past months
  seisMesesAtras.setDate(1);
  seisMesesAtras.setHours(0,0,0,0);


  lancamentos.forEach(lanc => {
    // Ensure lanc.data is a JS Date object if it's a Firestore Timestamp
    const dataLancamento = lanc.data instanceof Timestamp ? lanc.data.toDate() : new Date(lanc.data);

    if (dataLancamento >= seisMesesAtras) {
        const mesAno = `${dataLancamento.getMonth() + 1}/${dataLancamento.getFullYear()}`;
        if (!movimentacoesPorMes[mesAno]) {
            movimentacoesPorMes[mesAno] = { receitas: 0, despesas: 0 };
        }
        if (lanc.tipo === 'receita') {
            movimentacoesPorMes[mesAno].receitas += lanc.valor;
        } else {
            movimentacoesPorMes[mesAno].despesas += lanc.valor;
        }
        hasMovimentacoesData = true;
    }
  });

  const labels = Object.keys(movimentacoesPorMes).sort((a,b) => {
      const [aMonth, aYear] = a.split('/').map(Number);
      const [bMonth, bYear] = b.split('/').map(Number);
      return new Date(aYear, aMonth -1).getTime() - new Date(bYear, bMonth -1).getTime();
  });


  if (barChartInstance) {
    barChartInstance.destroy();
    barChartInstance = null;
  }

  if (hasMovimentacoesData && labels.length > 0) {
    barChartNoDataMessageDiv.style.display = 'none';
    const barChartData = {
      labels: labels,
      datasets: [
        {
          label: 'Receitas',
          data: labels.map(label => movimentacoesPorMes[label].receitas),
          backgroundColor: 'rgba(75, 192, 192, 0.7)',
        },
        {
          label: 'Despesas',
          data: labels.map(label => movimentacoesPorMes[label].despesas),
          backgroundColor: 'rgba(255, 99, 132, 0.7)',
        }
      ]
    };
    const ctx = barChartCanvas.getContext('2d');
    if (ctx) {
      barChartInstance = new Chart(ctx, {
        type: 'bar',
        data: barChartData,
        options: { ...commonChartOptions, scales: { y: { beginAtZero: true } } }
      });
    }
  } else {
    barChartNoDataMessageDiv.style.display = 'block';
  }
}

export async function loadDashboardDataAndRenderCharts() {
  if (dashboardErrorMessageDiv) dashboardErrorMessageDiv.style.display = 'none';
  if (pieChartNoDataMessageDiv) pieChartNoDataMessageDiv.style.display = 'none';
  if (barChartNoDataMessageDiv) barChartNoDataMessageDiv.style.display = 'none';

  // Optional: Show loading indicator here

  try {
    const lancamentos = await lancamentoService.getLancamentos();
    processLancamentosForPieChart(lancamentos);
    processLancamentosForBarChart(lancamentos);
  } catch (error) {
    console.error("Error loading dashboard data:", error);
    if (dashboardErrorMessageDiv) {
      dashboardErrorMessageDiv.textContent = "Erro ao carregar dados do dashboard. Tente novamente mais tarde.";
      dashboardErrorMessageDiv.style.display = 'block';
    }
    // Destroy charts if they exist to prevent showing stale data on error
    if (pieChartInstance) {
        pieChartInstance.destroy();
        pieChartInstance = null;
    }
    if (barChartInstance) {
        barChartInstance.destroy();
        barChartInstance = null;
    }
  } finally {
    // Optional: Hide loading indicator here
  }
}

export function initDashboard(viewContainer: HTMLElement) {
  pieChartCanvas = viewContainer.querySelector('#pieChartCanvas') as HTMLCanvasElement | null;
  barChartCanvas = viewContainer.querySelector('#barChartCanvas') as HTMLCanvasElement | null;
  dashboardErrorMessageDiv = viewContainer.querySelector('#dashboardErrorMessage') as HTMLDivElement | null;
  pieChartNoDataMessageDiv = viewContainer.querySelector('#pieChartNoDataMessage') as HTMLDivElement | null;
  barChartNoDataMessageDiv = viewContainer.querySelector('#barChartNoDataMessage') as HTMLDivElement | null;

  if (!pieChartCanvas || !barChartCanvas || !dashboardErrorMessageDiv || !pieChartNoDataMessageDiv || !barChartNoDataMessageDiv) {
    console.error("One or more dashboard elements not found.");
    if(dashboardErrorMessageDiv) {
        dashboardErrorMessageDiv.textContent = "Erro na inicialização do dashboard: elementos da UI não encontrados.";
        dashboardErrorMessageDiv.style.display = "block";
    }
    return;
  }
  // Data loading and chart rendering will be triggered when the view is shown.
  // loadDashboardDataAndRenderCharts(); // Initial load if view is visible by default
}
