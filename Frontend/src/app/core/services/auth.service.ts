import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Utilisation de l'URL adaptée à l'environnement
  private apiUrl = `${environment.apiUrl}/auth`;

  constructor(private http: HttpClient) { }

  register(userData: any): Observable<any> {
    // Endpoint pour l'enregistrement
    return this.http.post(`${this.apiUrl}/register`, userData);
  }

  login(credentials: any): Observable<any> {
    // Endpoint pour la connexion avec envoi en x-www-form-urlencoded
    let params = new HttpParams()
      .set('username', credentials.email)
      .set('password', credentials.password);
    if (credentials.totp_code) {
      params = params.set('totp_code', credentials.totp_code);
    }

    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded'
    });

    return this.http.post(
      `${this.apiUrl}/token`,
      params.toString(),
      { headers, withCredentials: true }
    );
  }

  googleLogin(): void {
    window.location.href = `${this.apiUrl}/google/login`;
  }

  verifyEmail(token: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/verify-email`, { token });
  }

  me(): Observable<any> {
    return this.http.get(`${this.apiUrl}/me`, { withCredentials: true });
  }

  logout(): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/logout`,
      {},
      { withCredentials: true }
    );
  }

  isLoggedIn(): Observable<boolean> {
    return this.me().pipe(
      map(() => true),
      catchError(() => of(false))
    );
  }

  refreshToken(): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/refresh-token`,
      {},
      { withCredentials: true }
    );
  }

  requestPasswordReset(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/request-reset`, { email });
  }

  resendVerification(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/resend-verification`, { email });
  }

  resetPassword(token: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/reset-password`, {
      token,
      new_password: newPassword,
    });
  }

  setupTwofa(): Observable<any> {
    return this.http.post(`${this.apiUrl}/setup-2fa`, {}, { withCredentials: true });
  }

  verifyTwofa(code: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/verify-2fa`, { code }, { withCredentials: true });
  }

  // Vous pourriez ajouter d'autres méthodes ici, comme logout, getUserInfo, etc.
} 
