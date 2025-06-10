import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  onAuthStateChanged, 
  User // Keep User for now, might be replaced by Usuario
} from "firebase/auth"; // createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup, onAuthStateChanged might be removable if not used elsewhere
import { getFirestore, collection, addDoc, query, where, getDocs, doc, onSnapshot } from "firebase/firestore"; // getFirestore might be removable
import Chart from 'chart.js/auto';
import { authService } from './services/auth.service';
import { Usuario } from './models/usuario.model'; // Import Usuario model

// *********************************************************************************
// Configuração do Firebase com as suas credenciais
// *********************************************************************************
const db = authService.getDbInstance(); // Get DB instance from AuthService

// --- Seleção de Elementos DOM ---
// const mainNav = document.getElementById('mainNav'); // Removed
const userStatus = document.getElementById('userStatus'); // userStatus is defined globally but re-fetched in updateUiForAuthState
const logoutBtn = document.getElementById('logoutBtn'); // logoutBtn is defined globally but re-fetched in updateUiForAuthState

// Vistas Principais
const authView = document.getElementById('authView');
const lancamentosFormView = document.getElementById('lancamentosFormView');
const dashboardView = document.getElementById('dashboardView');

// Formulários de Autenticação
// const loginFormContainer = document.getElementById('loginFormContainer');
// const registerFormContainer = document.getElementById('registerFormContainer');
// const loginForm = document.getElementById('loginForm');
// const registerForm = document.getElementById('registerForm');
const loginBtn = document.getElementById('loginBtn'); // Changed from loginGoogleBtn

// Links para alternar formulários
// const showRegisterLink = document.getElementById('showRegisterLink');
// const showLoginLink = document.getElementById('showLoginLink');

// Botões de Navegação Principal
const showDashboardBtn = document.getElementById('showDashboardBtn');
const showLancamentoFormBtn = document.getElementById('showLancamentoFormBtn');

// Formulário de Lançamentos
const novoLancamentoForm = document.getElementById('novoLancamentoForm');
const formSuccessMessage = document.getElementById('formSuccessMessage');
const formErrorMessage = document.getElementById('formErrorMessage');

// Variáveis para os gráficos
let pieChart: Chart | null = null;
let barChart: Chart | null = null;


// --- Lógica de UI ---

/**
 * Alterna a visibilidade das vistas principais da aplicação.
 * @param viewToShow {'auth' | 'dashboard' | 'form'} - A vista a ser exibida.
 */
function switchMainView(viewToShow: 'auth' | 'dashboard' | 'form'): void {
    authView!.style.display = 'none';
    dashboardView!.style.display = 'none';
    lancamentosFormView!.style.display = 'none';

    if (viewToShow === 'auth') {
        authView!.style.display = 'block';
    } else if (viewToShow === 'dashboard') {
        dashboardView!.style.display = 'block';
    } else if (viewToShow === 'form') {
        lancamentosFormView!.style.display = 'block';
    }
}

/**
 * Atualiza a interface do utilizador com base no estado de autenticação.
 * @param user {Usuario | null} - O objeto do utilizador da aplicação, ou null se não estiver autenticado.
 */
function updateUiForAuthState(user: Usuario | null): void {
  const userStatusDiv = document.getElementById('userStatus');
  const loginButton = document.getElementById('loginBtn');
  const logoutButton = document.getElementById('logoutBtn');
  const dashboardButton = document.getElementById('showDashboardBtn');
  const lancamentoFormButton = document.getElementById('showLancamentoFormBtn');

  if (user) {
    // User is authenticated
    if (userStatusDiv) userStatusDiv.textContent = `Bem-vindo, ${user.email || 'Usuário'}`;
    if (loginButton) loginButton.style.display = 'none';
    if (logoutButton) logoutButton.style.display = 'block';
    if (dashboardButton) dashboardButton.style.display = 'inline-block'; // Or 'block' depending on layout
    if (lancamentoFormButton) lancamentoFormButton.style.display = 'inline-block'; // Or 'block'

    switchMainView('dashboard');
    fetchAndRenderCharts(user.id);
  } else {
    // User is not authenticated
    if (userStatusDiv) userStatusDiv.textContent = 'Você não está logado.'; // Clear or set to a default message
    if (loginButton) loginButton.style.display = 'block';
    if (logoutButton) logoutButton.style.display = 'none';
    if (dashboardButton) dashboardButton.style.display = 'none';
    if (lancamentoFormButton) lancamentoFormButton.style.display = 'none';

    switchMainView('auth');

    // Clear charts if they exist
    if (pieChart) {
      pieChart.destroy();
      pieChart = null;
    }
    if (barChart) {
      barChart.destroy();
      barChart = null;
    }
    // Hide no data messages for charts if they are part of auth view cleanup
    // Assuming these elements exist in index.html for when charts are empty
    const pieChartNoData = document.getElementById('pieChartNoDataMessage');
    const barChartNoData = document.getElementById('barChartNoDataMessage');
    if (pieChartNoData) pieChartNoData.style.display = 'none';
    if (barChartNoData) barChartNoData.style.display = 'none';
  }
}

// --- Event Listeners de Autenticação ---

// Link para mostrar o formulário de cadastro
// showRegisterLink?.addEventListener('click', (e) => {
//   e.preventDefault();
//   toggleAuthForms(true);
// });

// Link para mostrar o formulário de login
// showLoginLink?.addEventListener('click', (e) => {
//   e.preventDefault();
//   toggleAuthForms(false);
// });

// Submissão do formulário de login com email/senha
// loginForm?.addEventListener('submit', async (e) => {
//   e.preventDefault();
//   const email = (document.getElementById('loginEmail') as HTMLInputElement).value;
//   const password = (document.getElementById('loginPassword') as HTMLInputElement).value;

//   try {
//     await signInWithEmailAndPassword(auth, email, password);
//     console.log('Login bem-sucedido!');
//     (loginForm as HTMLFormElement).reset();
//   } catch (error: any) {
//     console.error('Erro de login:', error);
//     alert(`Erro ao fazer login: ${error.message}`);
//   }
// });

// Submissão do formulário de cadastro com email/senha
// registerForm?.addEventListener('submit', async (e) => {
//   e.preventDefault();
//   const email = (document.getElementById('registerEmail') as HTMLInputElement).value;
//   const password = (document.getElementById('registerPassword') as HTMLInputElement).value;

//    if (password.length < 6) {
//     alert("A senha deve ter pelo menos 6 caracteres.");
//     return;
//   }

//   try {
//     await createUserWithEmailAndPassword(auth, email, password);
//     console.log('Cadastro bem-sucedido!');
//     (registerForm as HTMLFormElement).reset();
//   } catch (error: any) {
//     console.error('Erro de cadastro:', error);
//     alert(`Erro ao cadastrar: ${error.message}`);
//   }
// });

// Botão de login com Google
loginBtn?.addEventListener('click', async () => { // Changed from loginGoogleBtn
  try {
    await authService.googleSignIn();
    console.log('Login com Google iniciado via authService!');
  } catch (error: any) {
    console.error('Erro de login com Google em main.ts:', error);
    alert(`Erro com o Google: ${error.message}`);
  }
});

// Botão de logout
logoutBtn?.addEventListener('click', async () => {
  try {
    await authService.signOutUser();
    console.log('Logout iniciado via authService.');
  } catch (error: any) {
    console.error('Erro de logout em main.ts:', error);
    alert(`Erro ao sair: ${error.message}`);
  }
});


// --- Event Listeners de Navegação ---

showDashboardBtn?.addEventListener('click', () => switchMainView('dashboard'));
showLancamentoFormBtn?.addEventListener('click', () => switchMainView('form'));


// --- Lógica de Negócio (Lançamentos e Gráficos) ---

// Submissão do formulário de novo lançamento
novoLancamentoForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentUser) { // Use currentUser
        alert("Você precisa estar logado para fazer um lançamento.");
        return;
    }

    const formData = new FormData(novoLancamentoForm as HTMLFormElement);
    const lancamento = {
        uid: currentUser.id, // Use currentUser.id
        descricao: formData.get('descricao'),
        valor: parseFloat(formData.get('valor') as string),
        data: formData.get('data'),
        tipo: formData.get('tipo'),
        tipoPagamento: formData.get('tipoPagamento'),
        categoria: formData.get('categoria') || 'Sem Categoria',
        createdAt: new Date()
    };
    
    try {
        await addDoc(collection(db, "lancamentos"), lancamento); // Uses db from authService
        formSuccessMessage!.textContent = "Lançamento salvo com sucesso!";
        formSuccessMessage!.style.display = "block";
        formErrorMessage!.style.display = "none";
        (novoLancamentoForm as HTMLFormElement).reset();
        setTimeout(() => { formSuccessMessage!.style.display = "none"; }, 3000);
        
        // Atualiza os gráficos após novo lançamento
        if (currentUser) {
            fetchAndRenderCharts(currentUser.id); // Use currentUser.id
        }

    } catch (error: any) {
        formErrorMessage!.textContent = `Erro ao salvar: ${error.message}`;
        formErrorMessage!.style.display = "block";
        formSuccessMessage!.style.display = "none";
        console.error("Erro ao adicionar documento: ", error);
    }
});


/**
 * Busca os dados de lançamentos do utilizador e renderiza os gráficos.
 * @param uid {string} - O ID do utilizador do Firebase.
 */
async function fetchAndRenderCharts(uid: string) {
    const q = query(collection(db, "lancamentos"), where("uid", "==", uid)); // Uses db from authService
    const querySnapshot = await getDocs(q);
    const lancamentos = querySnapshot.docs.map(doc => doc.data());

    // --- Lógica do Gráfico de Pizza (Despesas por Categoria) ---
    const despesas = lancamentos.filter(l => l.tipo === 'despesa');
    const despesasPorCategoria = despesas.reduce((acc, curr) => {
        acc[curr.categoria] = (acc[curr.categoria] || 0) + curr.valor;
        return acc;
    }, {} as { [key: string]: number });

    const pieChartCanvas = document.getElementById('pieChartCanvas') as HTMLCanvasElement;
    if (pieChart) pieChart.destroy();
    pieChart = new Chart(pieChartCanvas, {
        type: 'pie',
        data: {
            labels: Object.keys(despesasPorCategoria),
            datasets: [{
                label: 'Despesas por Categoria',
                data: Object.values(despesasPorCategoria),
                backgroundColor: [
                    'rgba(255, 99, 132, 0.8)',
                    'rgba(54, 162, 235, 0.8)',
                    'rgba(255, 206, 86, 0.8)',
                    'rgba(75, 192, 192, 0.8)',
                    'rgba(153, 102, 255, 0.8)',
                    'rgba(255, 159, 64, 0.8)'
                ],
            }]
        }
    });
    
    // --- Lógica do Gráfico de Barras (Receita vs Despesa) - SIMPLIFICADO ---
    // Esta parte pode ser expandida para agrupar por mês
    const totalReceitas = lancamentos.filter(l => l.tipo === 'receita').reduce((sum, l) => sum + l.valor, 0);
    const totalDespesas = despesas.reduce((sum, l) => sum + l.valor, 0);

    const barChartCanvas = document.getElementById('barChartCanvas') as HTMLCanvasElement;
    if (barChart) barChart.destroy();
    barChart = new Chart(barChartCanvas, {
        type: 'bar',
        data: {
            labels: ['Total'],
            datasets: [
                {
                    label: 'Receitas',
                    data: [totalReceitas],
                    backgroundColor: 'rgba(75, 192, 192, 0.8)',
                },
                {
                    label: 'Despesas',
                    data: [totalDespesas],
                    backgroundColor: 'rgba(255, 99, 132, 0.8)',
                }
            ]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}


// --- Observador Principal de Autenticação ---
// Este é o ponto de entrada principal que reage às mudanças de estado de login/logout.
let currentUser: Usuario | null = null; // Variable to hold the current user state

authService.onAuthStateChangedWrapper((user) => {
  currentUser = user; // Update currentUser whenever auth state changes
  updateUiForAuthState(user);
  // Potentially call fetchAndRenderCharts here if user is logged in
  // if (user) {
  //   fetchAndRenderCharts(user.id);
  // }
});
