import { authService } from '../services/auth.service';
import { lancamentoService } from '../services/lancamento.service';
import { Usuario } from '../models/usuario.model';
import { Lancamento } from '../models/lancamento.model';

const tiposPagamento: string[] = ['Cartão de Crédito', 'Boleto', 'PIX', 'Dinheiro', 'Transferência Bancária', 'Outro'];
let currentLoggedInUser: Usuario | null = null;

export function initLancamentosForm(viewContainer: HTMLElement) {
  const form = viewContainer.querySelector('#novoLancamentoForm') as HTMLFormElement | null;
  const userInfoDiv = viewContainer.querySelector('#userInfo') as HTMLDivElement | null;

  const formDescricao = viewContainer.querySelector('#formDescricao') as HTMLInputElement | null;
  const formValor = viewContainer.querySelector('#formValor') as HTMLInputElement | null;
  const formData = viewContainer.querySelector('#formData') as HTMLInputElement | null;
  const formTipo = viewContainer.querySelector('#formTipo') as HTMLSelectElement | null;
  const formTipoPagamento = viewContainer.querySelector('#formTipoPagamento') as HTMLSelectElement | null;
  const categoriaFieldContainer = viewContainer.querySelector('#categoriaFieldContainer') as HTMLDivElement | null;
  const formCategoria = viewContainer.querySelector('#formCategoria') as HTMLInputElement | null;

  const descricaoError = viewContainer.querySelector('#descricaoError') as HTMLDivElement | null;
  const valorError = viewContainer.querySelector('#valorError') as HTMLDivElement | null;
  const dataError = viewContainer.querySelector('#dataError') as HTMLDivElement | null;
  const tipoError = viewContainer.querySelector('#tipoError') as HTMLDivElement | null;
  const tipoPagamentoError = viewContainer.querySelector('#tipoPagamentoError') as HTMLDivElement | null;

  const formSuccessMessage = viewContainer.querySelector('#formSuccessMessage') as HTMLDivElement | null;
  const formErrorMessage = viewContainer.querySelector('#formErrorMessage') as HTMLDivElement | null;

  if (!form || !userInfoDiv || !formDescricao || !formValor || !formData || !formTipo || !formTipoPagamento || !categoriaFieldContainer || !formCategoria || !formSuccessMessage || !formErrorMessage || !descricaoError || !valorError || !dataError || !tipoError || !tipoPagamentoError) {
    console.error("One or more form elements not found in lancamentosFormView.");
    return;
  }

  // Populate Tipo de Pagamento
  tiposPagamento.forEach(tipo => {
    const option = document.createElement('option');
    option.value = tipo;
    option.textContent = tipo;
    formTipoPagamento.appendChild(option);
  });

  // Set defaults
  const resetFormDefaults = () => {
    if (formData) formData.valueAsDate = new Date(); // Today's date
    if (formTipo) formTipo.value = 'despesa';
    if (formDescricao) formDescricao.value = '';
    if (formValor) formValor.value = '';
    if (formTipoPagamento) formTipoPagamento.value = '';
    if (formCategoria) formCategoria.value = '';
    updateCategoriaVisibility();
    clearAllValidationMessages();
  };

  function updateCategoriaVisibility() {
    if (formTipo && categoriaFieldContainer) {
      categoriaFieldContainer.style.display = formTipo.value === 'despesa' ? 'block' : 'none';
    }
  }

  if (formTipo) {
    formTipo.addEventListener('change', updateCategoriaVisibility);
  }

  resetFormDefaults(); // Initial setup

  authService.onAuthStateChangedWrapper(user => {
    currentLoggedInUser = user;
    if (user) {
      userInfoDiv.textContent = `Logado como: ${user.nome || user.email || 'Usuário Desconhecido'}`;
      form.style.display = 'block';
    } else {
      userInfoDiv.textContent = 'Você precisa estar logado para adicionar lançamentos.';
      form.style.display = 'none';
      currentLoggedInUser = null;
    }
  });

  function validateField(input: HTMLInputElement | HTMLSelectElement, errorDiv: HTMLDivElement, message: string): boolean {
    if (!input.value.trim()) {
      input.classList.add('is-invalid');
      errorDiv.textContent = message;
      errorDiv.style.display = 'block';
      return false;
    }
    input.classList.remove('is-invalid');
    errorDiv.style.display = 'none';
    return true;
  }

  function clearAllValidationMessages() {
    [formDescricao, formValor, formData, formTipo, formTipoPagamento].forEach(input => input?.classList.remove('is-invalid'));
    [descricaoError, valorError, dataError, tipoError, tipoPagamentoError].forEach(div => {
      if (div) div.style.display = 'none';
    });
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (formSuccessMessage) formSuccessMessage.style.display = 'none';
    if (formErrorMessage) formErrorMessage.style.display = 'none';
    clearAllValidationMessages();

    if (!currentLoggedInUser) {
      if (formErrorMessage) {
        formErrorMessage.textContent = "Usuário não autenticado. Faça login para continuar.";
        formErrorMessage.style.display = 'block';
      }
      return;
    }

    let isValid = true;
    isValid = validateField(formDescricao, descricaoError!, "Descrição é obrigatória.") && isValid;
    isValid = validateField(formValor, valorError!, "Valor é obrigatório.") && isValid;
    if (formValor && parseFloat(formValor.value) <= 0) {
        formValor.classList.add('is-invalid');
        valorError!.textContent = "Valor deve ser positivo.";
        valorError!.style.display = 'block';
        isValid = false;
    }
    isValid = validateField(formData, dataError!, "Data é obrigatória.") && isValid;
    isValid = validateField(formTipo, tipoError!, "Tipo é obrigatório.") && isValid;
    isValid = validateField(formTipoPagamento, tipoPagamentoError!, "Tipo de pagamento é obrigatório.") && isValid;

    if (!isValid) {
      return;
    }

    const lancamentoData: Omit<Lancamento, 'id' | 'data'> & { data: Date } = {
      descricao: formDescricao.value,
      valor: parseFloat(formValor.value),
      data: new Date(formData.value + "T00:00:00"), // Ensure it's parsed as local date, not UTC midnight. Add time for correct Date object.
      tipo: formTipo.value as 'receita' | 'despesa',
      tipoPagamento: formTipoPagamento.value,
      usuarioId: currentLoggedInUser.id,
      nomeUsuario: currentLoggedInUser.nome || currentLoggedInUser.email || undefined,
      categoria: formTipo.value === 'despesa' ? (formCategoria.value || undefined) : undefined,
    };

    try {
      const newId = await lancamentoService.addLancamento(lancamentoData);
      if (formSuccessMessage) {
        formSuccessMessage.textContent = `Lançamento "${lancamentoData.descricao}" salvo com sucesso (ID: ${newId})!`;
        formSuccessMessage.style.display = 'block';
      }
      resetFormDefaults();
      formDescricao.focus(); // Focus on the first field for the next entry
    } catch (error) {
      console.error("Erro ao salvar lançamento:", error);
      if (formErrorMessage) {
        formErrorMessage.textContent = "Erro ao salvar lançamento. Tente novamente.";
        formErrorMessage.style.display = 'block';
      }
    }
  });
}
