import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './verify-email.component.html',
  styleUrls: ['./verify-email.component.scss']
})
export class VerifyEmailComponent implements OnInit {
  success: boolean | null = null;
  message: string = '';

  constructor(private route: ActivatedRoute, private authService: AuthService) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const token = params['token'];
      if (token) {
        this.authService.verifyEmail(token).subscribe({
          next: () => {
            this.success = true;
            this.message = 'Votre email a été vérifié avec succès.';
          },
          error: () => {
            this.success = false;
            this.message = 'La vérification de l\'email a échoué.';
          }
        });
      } else {
        this.success = false;
        this.message = 'Jeton de vérification manquant.';
      }
    });
  }
}
