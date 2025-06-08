import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TrackingService, TrackingResponse } from '../tracking/services/tracking.service';

@Component({
  selector: 'app-track-by-mail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './track-by-mail.component.html',
  styleUrls: ['./track-by-mail.component.scss']
})
export class TrackByMailComponent {
  form: FormGroup;
  result: TrackingResponse | null = null;

  constructor(private fb: FormBuilder, private trackingService: TrackingService) {
    this.form = this.fb.group({
      trackingNumber: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      packageName: ['']
    });
  }

  submit() {
    if (this.form.invalid) {
      return;
    }
    const { trackingNumber, email, packageName } = this.form.value;
    this.trackingService.trackNumber(trackingNumber, packageName).subscribe(() => {
      this.trackingService.trackByEmail(trackingNumber, email).subscribe(res => {
        this.result = res;
      });
    });
  }
}
