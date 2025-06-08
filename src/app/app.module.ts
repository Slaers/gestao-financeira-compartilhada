import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { LancamentosComponent } from './components/lancamentos/lancamentos.component';
// Import other components/modules if known or leave placeholders

@NgModule({
  declarations: [
    AppComponent,
    DashboardComponent,
    LancamentosComponent
    // Declare other components here
  ],
  imports: [
    BrowserModule,
    AppRoutingModule
    // Import other modules here
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
