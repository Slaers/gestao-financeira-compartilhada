import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms'; // For ngModel and template-driven forms

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

// Firebase Setup
import { AngularFireModule } from '@angular/fire/compat';
import { AngularFirestoreModule } from '@angular/fire/compat/firestore';
import { AngularFireAuthModule } from '@angular/fire/compat/auth';
import { environment } from '../environments/environment'; // Make sure this path is correct

// Charting
import { NgChartsModule } from 'ng2-charts';

// Custom Components
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { LancamentosComponent } from './components/lancamentos/lancamentos.component';
// Services LancamentoService and AuthService are provided in root.

@NgModule({
  declarations: [
    AppComponent,
    DashboardComponent,
    LancamentosComponent
    // Declare other components here
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,          // Added
    AngularFireModule.initializeApp(environment.firebase), // Added/Ensured
    AngularFirestoreModule, // Added/Ensured
    AngularFireAuthModule,  // Added/Ensured
    NgChartsModule        // Added
  ],
  providers: [
    // Services are provided in root, so no need to list them here normally
    // LancamentoService, AuthService (if not providedIn: 'root')
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
