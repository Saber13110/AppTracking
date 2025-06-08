import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { HomeComponent } from './features/home/home.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { LoginComponent } from './features/auth/login/login.component';
import { VerifyEmailComponent } from './features/auth/verify-email/verify-email.component';
import { TrackResultComponent } from './features/tracking/track-result/track-result.component';
import { GoogleCallbackComponent } from './features/auth/google-callback/google-callback.component';
import { Setup2faComponent } from './features/auth/setup-2fa/setup-2fa.component';

// Assuming you might have other standalone components or lazy-loaded routes
// import { HomeComponent } from './features/home/home.component';

export const routes: Routes = [
  // Route par défaut
  { path: '', redirectTo: '/', pathMatch: 'full' },
  
  // Route vers la page d'accueil
  { path: 'home', component: HomeComponent, canActivate: [AuthGuard] },

  // Route vers la page d'enregistrement
  { path: 'auth/register', component: RegisterComponent },

  // { path: 'home', component: HomeComponent }, // If you still have a home component

  // Add other routes here, including for other standalone components
  { path: 'track/:identifier', component: TrackResultComponent, canActivate: [AuthGuard] },
  { path: 'auth/login', component: LoginComponent },
  { path: 'verify-email', component: VerifyEmailComponent },
  { path: 'auth/callback', component: GoogleCallbackComponent },
  { path: 'auth/setup-2fa', component: Setup2faComponent, canActivate: [AuthGuard] },
];
