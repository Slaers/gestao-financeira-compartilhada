import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { LancamentosComponent } from './components/lancamentos/lancamentos.component';
// Assuming other components will be added later
// import { InvestimentosComponent } from './components/investimentos/investimentos.component';
// import { GruposComponent } from './components/grupos/grupos.component';
// import { HistoricoComponent } from './components/historico/historico.component';

const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' }, // Redirects empty path to dashboard
  { path: 'dashboard', component: DashboardComponent },
  { path: 'lancamentos', component: LancamentosComponent },
  // Add other routes here as needed
  // { path: 'investimentos', component: InvestimentosComponent },
  // { path: 'grupos', component: GruposComponent },
  // { path: 'historico', component: HistoricoComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
