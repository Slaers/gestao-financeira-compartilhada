import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  onAuthStateChanged, 
  GoogleAuthProvider, 
  signInWithPopup, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  User
} from "firebase/auth";
import { getFirestore, collection, addDoc, query, where, getDocs, doc, onSnapshot } from "firebase/firestore";
import Chart from 'chart.js/auto';

// *********************************************************************************
// Configuração do Firebase com as suas credenciais
// *********************************************************************************
const firebaseConfig = {
    apiKey: "AIzaSyBeJyVD0Os7WWpEiObShsYzE2qoNRV3PY0",
    authDomain: "gestao-finc-compartilhada.firebaseapp.com",
    projectId: "gestao-finc-compartilhada",
    storageBucket: "gestao-finc-compartilhada.appspot.com",
    messagingSenderId: "988873226213",
    appId: "1:988873226213:web:8cb05b07ba7c48e574e10c",
    measurementId: "G-WGWJJXRT71"
};

// Inicialização do Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// --- Seleção de Elementos DOM ---
const mainNav = document.getElementById('mainNav');
const userStatus = document.getElementById('userStatus');
const logoutBtn = document.getElementById('logoutBtn');

// Vistas Principais
const authView = document.getElementById('authView');
const lancamentosFormView = document.getElementById('lancamentosFormView');
const dashboardView = document.getElementById('dashboardView');

// Formulários de Autenticação
const loginFormContainer = document.getElementById('loginFormContainer');
const registerFormContainer = document.getElementById('registerFormContainer');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const loginGoogleBtn = document.getElementById('loginGoogleBtn');

// Links para alternar formulários
const showRegisterLink = document.getElementById('showRegisterLink');
const showLoginLink = document.getElementById('showLoginLink');

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
 * Alterna a visibilidade entre os formulários de login e cadastro.
 * @param showRegister {boolean} - Se true, mostra o formulário de cadastro; senão, mostra o de login.
 */
function toggleAuthForms(showRegister: boolean): void {
  if (loginFormContainer && registerFormContainer) {
    loginFormContainer.style.display = showRegister ? 'none' : 'block';
    registerFormContainer.style.display = showRegister ? 'block' : 'none';
  }
}

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
 * @param user {User | null} - O objeto do utilizador do Firebase, ou null se não estiver autenticado.
 */
function updateUiForAuthState(user: User | null): void {
  if (user) {
    // Utilizador está autenticado
    userStatus!.textContent = `Bem-vindo, ${user.email}`;
    userStatus!.style.display = 'block';
    mainNav!.style.display = 'block';
    switchMainView('dashboard'); // Mostra o dashboard como vista inicial após o login
    fetchAndRenderCharts(user.uid);
  } else {
    // Utilizador não está autenticado
    userStatus!.style.display = 'none';
    mainNav!.style.display = 'none';
    switchMainView('auth');
  }
}

// --- Event Listeners de Autenticação ---

// Link para mostrar o formulário de cadastro
showRegisterLink?.addEventListener('click', (e) => {
  e.preventDefault();
  toggleAuthForms(true);
});

// Link para mostrar o formulário de login
showLoginLink?.addEventListener('click', (e) => {
  e.preventDefault();
  toggleAuthForms(false);
});

// Submissão do formulário de login com email/senha
loginForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = (document.getElementById('loginEmail') as HTMLInputElement).value;
  const password = (document.getElementById('loginPassword') as HTMLInputElement).value;

  try {
    await signInWithEmailAndPassword(auth, email, password);
    console.log('Login bem-sucedido!');
    (loginForm as HTMLFormElement).reset();
  } catch (error: any) {
    console.error('Erro de login:', error);
    alert(`Erro ao fazer login: ${error.message}`);
  }
});

// Submissão do formulário de cadastro com email/senha
registerForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = (document.getElementById('registerEmail') as HTMLInputElement).value;
  const password = (document.getElementById('registerPassword') as HTMLInputElement).value;

   if (password.length < 6) {
    alert("A senha deve ter pelo menos 6 caracteres.");
    return;
  }

  try {
    await createUserWithEmailAndPassword(auth, email, password);
    console.log('Cadastro bem-sucedido!');
    (registerForm as HTMLFormElement).reset();
  } catch (error: any) {
    console.error('Erro de cadastro:', error);
    alert(`Erro ao cadastrar: ${error.message}`);
  }
});

// Botão de login com Google
loginGoogleBtn?.addEventListener('click', async () => {
  try {
    await signInWithPopup(auth, provider);
    console.log('Login com Google bem-sucedido!');
  } catch (error: any) {
    console.error('Erro de login com Google:', error);
    alert(`Erro com o Google: ${error.message}`);
  }
});

// Botão de logout
logoutBtn?.addEventListener('click', async () => {
  try {
    await signOut(auth);
    console.log('Logout bem-sucedido.');
  } catch (error: any) {
    console.error('Erro de logout:', error);
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
    if (!auth.currentUser) {
        alert("Você precisa estar logado para fazer um lançamento.");
        return;
    }

    const formData = new FormData(novoLancamentoForm as HTMLFormElement);
    const lancamento = {
        uid: auth.currentUser.uid,
        descricao: formData.get('descricao'),
        valor: parseFloat(formData.get('valor') as string),
        data: formData.get('data'),
        tipo: formData.get('tipo'),
        tipoPagamento: formData.get('tipoPagamento'),
        categoria: formData.get('categoria') || 'Sem Categoria',
        createdAt: new Date()
    };
    
    try {
        await addDoc(collection(db, "lancamentos"), lancamento);
        formSuccessMessage!.textContent = "Lançamento salvo com sucesso!";
        formSuccessMessage!.style.display = "block";
        formErrorMessage!.style.display = "none";
        (novoLancamentoForm as HTMLFormElement).reset();
        setTimeout(() => { formSuccessMessage!.style.display = "none"; }, 3000);
        
        // Atualiza os gráficos após novo lançamento
        fetchAndRenderCharts(auth.currentUser.uid);

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
    const q = query(collection(db, "lancamentos"), where("uid", "==", uid));
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
onAuthStateChanged(auth, (user) => {
  updateUiForAuthState(user);
});
