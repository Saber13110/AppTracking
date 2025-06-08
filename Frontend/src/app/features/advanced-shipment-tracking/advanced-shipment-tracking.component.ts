import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TrackingService, TrackingInfo } from '../tracking/services/tracking.service';
import { TrackingHistoryService } from '../../core/services/tracking-history.service';

@Component({
  selector: 'app-advanced-shipment-tracking',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './advanced-shipment-tracking.component.html',
  styleUrls: ['./advanced-shipment-tracking.component.scss']
})
export class AdvancedShipmentTrackingComponent {
  form: FormGroup;
  result: TrackingInfo | null = null;
  error: string | null = null;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private trackingService: TrackingService,
    private history: TrackingHistoryService
  ) {
    this.form = this.fb.group({
      trackingNumber: ['', Validators.required],
      packageName: ['']
    });
  }

  submit() {
    if (this.form.invalid) {
      return;
    }
    const { trackingNumber, packageName } = this.form.value;
    this.loading = true;
    this.error = null;
    this.trackingService.trackPackage(trackingNumber).subscribe({
      next: res => {
        if (res.success && res.data) {
          this.result = res.data;
          this.history.addIdentifier(trackingNumber);
        } else {
          this.error = res.error || 'Tracking failed';
          this.result = null;
        }
        this.loading = false;
      },
      error: err => {
        this.error = err.error?.error || 'Tracking failed';
        this.loading = false;
        this.result = null;
      }
    });
  }
}
