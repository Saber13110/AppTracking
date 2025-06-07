import { Injectable } from '@angular/core';
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, switchMap, catchError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService, private router: Router) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = localStorage.getItem('token');
    const tokenType = localStorage.getItem('tokenType') || 'Bearer';
    const authReq = token
      ? req.clone({ setHeaders: { Authorization: `${tokenType} ${token}` } })
      : req;

    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          return this.authService.refreshToken().pipe(
            switchMap((resp: any) => {
              if (resp && resp.access_token) {
                const retryReq = req.clone({
                  setHeaders: { Authorization: `Bearer ${resp.access_token}` }
                });
                return next.handle(retryReq);
              } else {
                this.router.navigate(['/auth/login']);
                return throwError(() => error);
              }
            }),
            catchError(refreshErr => {
              this.router.navigate(['/auth/login']);
              return throwError(() => refreshErr);
            })
          );
        }
        return throwError(() => error);
      })
    );
  }
}
