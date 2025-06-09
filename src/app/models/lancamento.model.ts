export interface Lancamento {
  id?: string; // Optional: Firestore will generate it
  descricao: string;
  valor: number;
  data: Date; // Or string, consider date handling
  tipo: 'receita' | 'despesa'; // Revenue or Expense
  tipoPagamento: string; // e.g., 'Cartão de Crédito', 'Boleto', 'PIX', 'Dinheiro'
  usuarioId: string; // ID of the user who created it
  nomeUsuario?: string; // Name of the user, denormalized for display
  categoria?: string; // Optional: For expense categorization
}
