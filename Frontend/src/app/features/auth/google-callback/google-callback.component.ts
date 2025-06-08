import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-google-callback',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './google-callback.component.html',
  styleUrls: ['./google-callback.component.scss']
})
export class GoogleCallbackComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const token = params['token'];
      // Le token est inclus dans l'URL par le backend lors du callback Google.
      // Il peut être utilisé ultérieurement si nécessaire.
      this.authService.me().subscribe({
        next: () => this.router.navigate(['/home']),
        error: () => this.router.navigate(['/auth/login'])
      });
    });
  }
}
