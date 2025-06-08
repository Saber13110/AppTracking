import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-verify-twofa',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './verify-twofa.component.html',
  styleUrls: ['./verify-twofa.component.scss']
})
export class VerifyTwofaComponent {
  form: FormGroup;
  message: string | null = null;

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {
    this.form = this.fb.group({
      code: ['', Validators.required]
    });
  }

  onSubmit() {
    if (this.form.valid) {
      this.authService.verifyTwofa(this.form.value.code).subscribe({
        next: () => this.router.navigate(['/home']),
        error: () => this.message = 'Code invalide'
      });
    } else {
      this.form.markAllAsTouched();
    }
  }
}
