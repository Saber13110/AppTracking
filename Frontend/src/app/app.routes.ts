import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/home.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { LoginComponent } from './features/auth/login/login.component';
import { TrackResultComponent } from './features/tracking/track-result/track-result.component';
import { authGuard } from './core/guards/auth.guard';

// Assuming you might have other standalone components or lazy-loaded routes
// import { HomeComponent } from './features/home/home.component';

export const routes: Routes = [
  // Route par défaut
  { path: '', redirectTo: '/', pathMatch: 'full' },
  
  // Route vers la page d'accueil
  { path: 'home', component: HomeComponent, canActivate: [authGuard] },

  // Route vers la page d'enregistrement
  { path: 'auth/register', component: RegisterComponent },

  // { path: 'home', component: HomeComponent }, // If you still have a home component

  // Add other routes here, including for other standalone components
  { path: 'track/:identifier', component: TrackResultComponent, canActivate: [authGuard] },
  { path: 'auth/login', component: LoginComponent },
];
