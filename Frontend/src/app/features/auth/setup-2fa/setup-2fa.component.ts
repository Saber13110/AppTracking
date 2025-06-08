import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-setup-2fa',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './setup-2fa.component.html',
  styleUrls: ['./setup-2fa.component.scss']
})
export class Setup2faComponent implements OnInit {
  qrData: string | null = null;
  codeForm: FormGroup;

  constructor(private authService: AuthService, private fb: FormBuilder, private router: Router) {
    this.codeForm = this.fb.group({
      code: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.authService.setup2fa().subscribe(res => {
      this.qrData = 'data:image/png;base64,' + res.qr;
    });
  }

  verify() {
    if (this.codeForm.valid) {
      this.authService.verify2fa(this.codeForm.value.code).subscribe(() => {
        this.router.navigate(['/home']);
      });
    }
  }
}
