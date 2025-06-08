import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { HomeComponent } from './features/home/home.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { LoginComponent } from './features/auth/login/login.component';
import { VerifyEmailComponent } from './features/auth/verify-email/verify-email.component';
import { ForgotPasswordComponent } from './features/auth/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './features/auth/reset-password/reset-password.component';
import { TrackResultComponent } from './features/tracking/track-result/track-result.component';
import { GoogleCallbackComponent } from './features/auth/google-callback/google-callback.component';
import { NotificationsComponent } from './features/notifications/notifications.component';
import { TrackByMailComponent } from './features/track-by-mail/track-by-mail.component';
import { NotificationOptionsComponent } from './features/notification-options/notification-options.component';
import { GenerateBarcodeComponent } from './features/generate-barcode/generate-barcode.component';
import { AllTrackingServicesComponent } from './features/all-tracking-services/all-tracking-services.component';
import { SetupTwofaComponent } from './features/auth/setup-twofa/setup-twofa.component';
import { VerifyTwofaComponent } from './features/auth/verify-twofa/verify-twofa.component';
import { ResendVerificationComponent } from './features/auth/resend-verification/resend-verification.component';
import { NewsDetailComponent } from './features/news/news-detail.component';
import { NotFoundComponent } from './shared/not-found.component';

// Assuming you might have other standalone components or lazy-loaded routes
// import { HomeComponent } from './features/home/home.component';

export const routes: Routes = [
  // Route par défaut
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  
  // Route vers la page d'accueil
  { path: 'home', component: HomeComponent, canActivate: [AuthGuard] },

  // Route vers la page d'enregistrement
  { path: 'auth/register', component: RegisterComponent },

  // { path: 'home', component: HomeComponent }, // If you still have a home component

  // Add other routes here, including for other standalone components
  { path: 'track/:identifier', component: TrackResultComponent, canActivate: [AuthGuard] },
  { path: 'notifications', component: NotificationsComponent, canActivate: [AuthGuard] },
  // Service routes
  { path: 'services/track-by-mail', component: TrackByMailComponent, canActivate: [AuthGuard] },
  { path: 'services/notifications', component: NotificationOptionsComponent, canActivate: [AuthGuard] },
  { path: 'services/generate-barcode', component: GenerateBarcodeComponent, canActivate: [AuthGuard] },
  { path: 'services/all-tracking', component: AllTrackingServicesComponent, canActivate: [AuthGuard] },
  { path: 'auth/login', component: LoginComponent },
  { path: 'verify-email', component: VerifyEmailComponent },
  { path: 'auth/callback', component: GoogleCallbackComponent },
  { path: 'auth/forgot-password', component: ForgotPasswordComponent },
  { path: 'auth/reset-password', component: ResetPasswordComponent },
  { path: 'news/:slug', component: NewsDetailComponent },
  { path: 'auth/resend-verification', component: ResendVerificationComponent },
  { path: 'auth/setup-2fa', component: SetupTwofaComponent, canActivate: [AuthGuard] },
  { path: 'auth/verify-2fa', component: VerifyTwofaComponent, canActivate: [AuthGuard] },
  { path: '**', component: NotFoundComponent }
];
