import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-all-tracking-services',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './all-tracking-services.component.html',
  styleUrls: ['./all-tracking-services.component.scss']
})
export class AllTrackingServicesComponent {
  activeTab: 'single' | 'bulk' | 'barcode' = 'single';

  singleForm: FormGroup;
  bulkForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.singleForm = this.fb.group({
      trackingNumber: ['', [Validators.required, Validators.pattern('^[A-Z0-9]{10,}$')]]
    });
    this.bulkForm = this.fb.group({
      trackingNumbers: ['', Validators.required]
    });
  }

  switchTab(tab: 'single' | 'bulk' | 'barcode'): void {
    this.activeTab = tab;
  }

  submitSingle(): void {
    if (this.singleForm.invalid) {
      this.singleForm.markAllAsTouched();
      return;
    }
    // Placeholder for single tracking logic
    console.log('Track single', this.singleForm.value.trackingNumber);
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
    // Placeholder for bulk tracking logic
  }

  startBarcodeScan(): void {
    // Placeholder for barcode scanning implementation
    console.log('Barcode scan feature coming soon');
  }
}
