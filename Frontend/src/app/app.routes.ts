import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/home.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { LoginComponent } from './features/auth/login/login.component';
import { TrackResultComponent } from './features/tracking/track-result/track-result.component';
import { GoogleCallbackComponent } from './features/auth/google-callback/google-callback.component';

// Assuming you might have other standalone components or lazy-loaded routes
// import { HomeComponent } from './features/home/home.component';

export const routes: Routes = [
  // Route par défaut
  { path: '', redirectTo: '/', pathMatch: 'full' },
  
  // Route vers la page d'accueil
  { path: 'home', component: HomeComponent },

  // Route vers la page d'enregistrement
  { path: 'auth/register', component: RegisterComponent },

  // { path: 'home', component: HomeComponent }, // If you still have a home component

  // Add other routes here, including for other standalone components
  { path: 'track/:identifier', component: TrackResultComponent },
  { path: 'auth/login', component: LoginComponent },
  { path: 'auth/callback', component: GoogleCallbackComponent },
];
