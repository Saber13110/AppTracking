import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TrackingService } from '../tracking/services/tracking.service';
import { AnalyticsService } from '../../core/services/analytics.service';
import { BarcodeUploadComponent } from '../barcode-upload/barcode-upload.component';
import { TrackingFormComponent } from '../../shared/components/tracking-form/tracking-form.component';

@Component({
  selector: 'app-all-tracking-services',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, BarcodeUploadComponent, TrackingFormComponent],
  templateUrl: './all-tracking-services.component.html',
  styleUrls: ['./all-tracking-services.component.scss']
})
export class AllTrackingServicesComponent {
  activeTab: 'single' | 'bulk' | 'barcode' = 'single';

  singleForm: FormGroup;
  bulkForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private trackingService: TrackingService,
    private analytics: AnalyticsService
  ) {
    this.singleForm = this.fb.group({
      trackingNumber: ['', [Validators.required, Validators.pattern('^[A-Z0-9]{10,}$')]],
      packageName: ['']
    });
    this.bulkForm = this.fb.group({
      trackingNumbers: ['', Validators.required]
    });
  }

  switchTab(tab: 'single' | 'bulk' | 'barcode'): void {
    this.activeTab = tab;
    this.analytics.logAction('switch_tab', tab);
  }

  submitSingle(): void {
    if (this.singleForm.invalid) {
      this.singleForm.markAllAsTouched();
      return;
    }
    const { trackingNumber, packageName } = this.singleForm.value;
    this.analytics.logAction('submit_single', trackingNumber);
    this.trackingService.trackNumber(trackingNumber, packageName).subscribe();
  }

  submitBulk(): void {
    if (this.bulkForm.invalid) {
      this.bulkForm.markAllAsTouched();
      return;
    }
    const numbers = this.bulkForm.value.trackingNumbers
      .split(/\r?\n/)
      .map((n: string) => n.trim())
      .filter((n: string) => n);
    console.log('Track bulk', numbers);
    this.analytics.logAction('submit_bulk', numbers.length);
    // Placeholder for bulk tracking logic
  }

  startBarcodeScan(): void {
    // Placeholder for barcode scanning implementation
    this.analytics.logAction('start_barcode_scan');
    console.log('Barcode scan feature coming soon');
  }
}
