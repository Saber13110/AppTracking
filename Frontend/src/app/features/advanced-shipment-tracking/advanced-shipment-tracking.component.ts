import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TrackingService, TrackingResponse } from '../tracking/services/tracking.service';

@Component({
  selector: 'app-advanced-shipment-tracking',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './advanced-shipment-tracking.component.html',
  styleUrls: ['./advanced-shipment-tracking.component.scss']
})
export class AdvancedShipmentTrackingComponent {
  form: FormGroup;
  results: TrackingResponse[] | null = null;
  error: string | null = null;

  constructor(private fb: FormBuilder, private trackingService: TrackingService) {
    this.form = this.fb.group({
      numbers: ['', Validators.required]
    });
  }

  submit(): void {
    if (this.form.invalid) {
      return;
    }

    this.error = null;
    this.results = null;

    const raw = this.form.value.numbers as string;
    const identifiers = raw
      .split(/[\n,]+/)
      .map(v => v.trim())
      .filter(v => v);

    if (identifiers.length === 0) {
      this.error = 'Please enter at least one identifier';
      return;
    }

    if (identifiers.length > 30) {
      this.error = 'You can track up to 30 numbers at a time';
      return;
    }

    this.trackingService.trackBatch(identifiers).subscribe({
      next: res => this.results = res,
      error: () => this.error = 'Failed to track packages'
    });
  }
}
