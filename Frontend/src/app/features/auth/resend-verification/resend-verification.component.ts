import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-resend-verification',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './resend-verification.component.html',
  styleUrls: ['./resend-verification.component.scss']
})
export class ResendVerificationComponent {
  form: FormGroup;
  message: string | null = null;

  constructor(private fb: FormBuilder, private authService: AuthService) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit() {
    if (this.form.valid) {
      this.authService.resendVerification(this.form.value.email).subscribe({
        next: res => this.message = res.message,
        error: () => this.message = "Erreur lors de l'envoi"
      });
    } else {
      this.form.markAllAsTouched();
    }
  }
}
