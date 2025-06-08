import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  error: string | null = null;
  prompt: string | null = null;

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router, private route: ActivatedRoute) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      totp_code: ['']
    });
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['loginRequired']) {
        this.prompt = 'Please log in to continue.';
      }
    });
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.error = null;
      this.authService.login(this.loginForm.value)
        .pipe(switchMap(() => this.authService.me()))
        .subscribe({
          next: () => this.router.navigate(['/home']),
          error: err => {
            console.error('Login failed', err);
            this.error = err?.error?.detail || 'Login failed';
          }
        });
    } else {
      this.loginForm.markAllAsTouched();
    }
  }

  loginWithGoogle() {
    this.authService.googleLogin();
  }
}
