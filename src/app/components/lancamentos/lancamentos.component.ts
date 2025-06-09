import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Lancamento } from '../../models/lancamento.model';
import { Usuario } from '../../models/usuario.model';
import { LancamentoService } from '../../services/lancamento.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-lancamentos',
  templateUrl: './lancamentos.component.html',
  // Add styleUrls if you create a separate CSS file:
  styleUrls: ['./lancamentos.component.css']
})
export class LancamentosComponent implements OnInit, OnDestroy {
  model: Partial<Lancamento> = {
    tipo: 'despesa', // Default type
    data: new Date().toISOString().substring(0, 10) // Default to today
  };

  tiposPagamento: string[] = ['Cartão de Crédito', 'Boleto', 'PIX', 'Dinheiro', 'Transferência Bancária'];

  currentUser: Usuario | null | undefined;
  private authSubscription: Subscription | undefined;

  successMessage: string | null = null;
  errorMessage: string | null = null;

  constructor(
    private lancamentoService: LancamentoService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.authSubscription = this.authService.getCurrentUser().subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.model.usuarioId = user.id;
        this.model.nomeUsuario = user.nome; // Denormalizing user name
      } else {
        // Handle case where user is not logged in, perhaps redirect or show message
        this.errorMessage = "Usuário não autenticado. Faça login para registrar um lançamento.";
      }
    });
  }

  onSubmit(form?: NgForm): void { // form argument is optional if using #lancamentoForm="ngForm"
    this.successMessage = null;
    this.errorMessage = null;

    if (!this.currentUser || !this.model.usuarioId) {
      this.errorMessage = "Erro: Usuário não identificado. Não é possível salvar o lançamento.";
      console.error("Current user or user ID is missing", this.currentUser);
      return;
    }

    if (!this.model.descricao || !this.model.valor || !this.model.data || !this.model.tipo || !this.model.tipoPagamento) {
        this.errorMessage = "Por favor, preencha todos os campos obrigatórios.";
        return;
    }

    const lancamentoData: Lancamento = {
      descricao: this.model.descricao,
      valor: Number(this.model.valor),
      data: new Date(this.model.data), // Ensure data is a Date object
      tipo: this.model.tipo as 'receita' | 'despesa',
      tipoPagamento: this.model.tipoPagamento,
      usuarioId: this.model.usuarioId,
      nomeUsuario: this.currentUser.nome, // Make sure to capture the current user's name
      categoria: this.model.categoria || undefined
    };

    this.lancamentoService.addLancamento(lancamentoData)
      .then(() => {
        this.successMessage = "Lançamento salvo com sucesso!";
        if (form) {
          form.resetForm({
            tipo: 'despesa',
            data: new Date().toISOString().substring(0, 10)
          });
        } else { // If template-driven form reference is not passed, reset model manually
            this.model = {
                tipo: 'despesa',
                data: new Date().toISOString().substring(0, 10),
                usuarioId: this.currentUser?.id,
                nomeUsuario: this.currentUser?.nome
            };
        }
        // Optionally, re-fetch user info for the model if needed after reset
        if (this.currentUser) {
            this.model.usuarioId = this.currentUser.id;
            this.model.nomeUsuario = this.currentUser.nome;
        }
      })
      .catch(error => {
        this.errorMessage = "Erro ao salvar lançamento. Tente novamente.";
        console.error("Error saving lancamento:", error);
      });
  }

  ngOnDestroy(): void {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }
}
