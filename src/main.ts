import { authService } from './services/auth.service';
import { Usuario } from './models/usuario.model';
import { initLancamentosForm } from './views/lancamentos-form';
import { initDashboard, loadDashboardDataAndRenderCharts } from './views/dashboard'; // Import dashboard functions

console.log("App trying to initialize with new AuthService, Lancamento Form, and Dashboard...");

// Auth UI Elements
const loginBtn = document.getElementById('loginBtn') as HTMLButtonElement | null;
const logoutBtn = document.getElementById('logoutBtn') as HTMLButtonElement | null;
const userStatus = document.getElementById('userStatus') as HTMLDivElement | null;

// View Containers
const authView = document.getElementById('authView') as HTMLDivElement | null;
const lancamentosFormView = document.getElementById('lancamentosFormView') as HTMLDivElement | null;
const dashboardView = document.getElementById('dashboardView') as HTMLDivElement | null; // Dashboard view container

// Navigation Buttons
const showDashboardBtn = document.getElementById('showDashboardBtn') as HTMLButtonElement | null;
const showLancamentoFormBtn = document.getElementById('showLancamentoFormBtn') as HTMLButtonElement | null;

let currentAuthUser: Usuario | null = null;
let dashboardInitialized = false;

type ActiveView = 'auth' | 'lancamentoForm' | 'dashboard';

function showView(viewId: ActiveView) {
  if (authView) authView.style.display = viewId === 'auth' ? 'block' : 'none';
  if (lancamentosFormView) lancamentosFormView.style.display = viewId === 'lancamentoForm' ? 'block' : 'none';
  if (dashboardView) dashboardView.style.display = viewId === 'dashboard' ? 'block' : 'none';

  if (viewId === 'dashboard') {
    if (!dashboardInitialized && dashboardView) {
      initDashboard(dashboardView);
      dashboardInitialized = true;
    }
    // Always reload data when dashboard is shown, or manage state more carefully
    loadDashboardDataAndRenderCharts();
  }
}

if (!loginBtn || !logoutBtn || !userStatus || !authView || !lancamentosFormView || !dashboardView || !showDashboardBtn || !showLancamentoFormBtn) {
  console.error("Could not find one or more critical UI elements. App initialization failed.");
} else {
  // Initialize Navigation
  showDashboardBtn.addEventListener('click', () => {
    if (currentAuthUser) showView('dashboard');
    else alert("Você precisa estar logado para ver o dashboard.");
  });
  showLancamentoFormBtn.addEventListener('click', () => {
    if (currentAuthUser) showView('lancamentoForm');
    else alert("Você precisa estar logado para adicionar lançamentos.");
  });

  // Initialize Auth
  loginBtn.addEventListener('click', async () => {
    try {
      await authService.googleSignIn();
    } catch (error) {
      console.error("Error during googleSignIn from UI:", error);
      if (userStatus) userStatus.textContent = "Login failed.";
    }
  });

  logoutBtn.addEventListener('click', async () => {
    try {
      await authService.signOutUser();
    } catch (error) {
      console.error("Error during signOutUser from UI:", error);
      if (userStatus) userStatus.textContent = "Logout failed.";
    }
  });

  authService.onAuthStateChangedWrapper((user: Usuario | null) => {
    currentAuthUser = user;
    if (user) {
      userStatus.innerHTML = `Logged in as: <strong>${user.nome || user.email || user.id}</strong>`;
      loginBtn.style.display = 'none';
      logoutBtn.style.display = 'block';
      showDashboardBtn.style.display = 'inline-block';
      showLancamentoFormBtn.style.display = 'inline-block';
      showView('dashboard'); // Show dashboard on login
    } else {
      userStatus.textContent = 'Not logged in';
      loginBtn.style.display = 'block';
      logoutBtn.style.display = 'none';
      showDashboardBtn.style.display = 'none';
      showLancamentoFormBtn.style.display = 'none';
      showView('auth'); // Show auth view on logout
      if(lancamentosFormView) lancamentosFormView.style.display = 'none';
      if(dashboardView) dashboardView.style.display = 'none';
    }
  });

  // Initialize Lancamentos Form View (it will be hidden until navigated to)
  initLancamentosForm(lancamentosFormView);
  // Dashboard is initialized when its view is first shown

  console.log("App initialized with AuthService, Lancamento Form, Dashboard, and navigation.");
  // Initial view determined by auth state change
}
