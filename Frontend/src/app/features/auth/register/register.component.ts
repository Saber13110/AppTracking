import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent {
  showContactInfo: boolean = false;

  identifierForm: FormGroup;
  contactInfoForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.identifierForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    this.contactInfoForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      agreeTerms: [false, Validators.requiredTrue]
    });
  }

  createIdentifier() {
    if (this.identifierForm.valid) {
      this.showContactInfo = true;
    } else {
      this.identifierForm.markAllAsTouched();
    }
  }

  onSubmit() {
    if (this.identifierForm.valid && this.contactInfoForm.valid) {
      const userData = {
        email: this.identifierForm.get('email')?.value,
        password: this.identifierForm.get('password')?.value,
        full_name: `${this.contactInfoForm.get('firstName')?.value} ${this.contactInfoForm.get('lastName')?.value}`
      };

      this.authService.register(userData).pipe(
        catchError((error: any) => {
          console.error('Registration failed', error);
          return of(null);
        })
      ).subscribe(
        (response: any) => {
          if (response) {
            console.log('Registration successful', response);
            this.router.navigate(['/auth/login']);
          }
        }
      );
    } else {
      this.identifierForm.markAllAsTouched();
      this.contactInfoForm.markAllAsTouched();
    }
  }

  hasError(controlName: string, errorName: string, formGroup: FormGroup) {
    return formGroup.get(controlName)?.hasError(errorName) && formGroup.get(controlName)?.touched;
  }

  isInvalidAndTouched(controlName: string, formGroup: FormGroup) {
    return formGroup.get(controlName)?.invalid && formGroup.get(controlName)?.touched;
  }
} 
