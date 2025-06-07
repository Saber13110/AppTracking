import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './verify-email.component.html',
  styleUrls: ['./verify-email.component.scss']
})
export class VerifyEmailComponent implements OnInit {
  status: 'loading' | 'success' | 'error' = 'loading';
  message = '';

  constructor(private route: ActivatedRoute, private authService: AuthService) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const token = params['token'];
      if (token) {
        this.authService.verifyEmail(token).pipe(
          catchError(err => {
            console.error('Verification failed', err);
            this.status = 'error';
            this.message = 'La vérification a échoué.';
            return of(null);
          })
        ).subscribe(res => {
          if (res) {
            this.status = 'success';
            this.message = 'Votre email a été vérifié avec succès.';
          }
        });
      } else {
        this.status = 'error';
        this.message = 'Token manquant.';
      }
    });
  }
}
