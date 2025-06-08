import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { TrackingService, TrackingInfo } from '../tracking/services/tracking.service';
import { TrackingHistoryService } from '../../core/services/tracking-history.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-advanced-shipment-tracking',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './advanced-shipment-tracking.component.html',
  styleUrls: ['./advanced-shipment-tracking.component.scss']
})
export class AdvancedShipmentTrackingComponent {
  form: FormGroup;
  result: TrackingInfo | null = null;
  batchResults: TrackingInfo[] | null = null;
  error: string | null = null;
  loading = false;
  accounts: string[] = ['A001', 'A002'];
  selectedAccount = '';

  constructor(
    private fb: FormBuilder,
    private trackingService: TrackingService,
    private history: TrackingHistoryService,
    private notif: NotificationService
  ) {
    this.form = this.fb.group({
      trackingNumber: ['', Validators.required],
      packageName: [''],
      batchNumbers: ['']
    });
    this.notif.getPreferences().subscribe(p => {
      this.selectedAccount = p.default_account || this.accounts[0];
    });
  }

  submit() {
    if (this.form.invalid) {
      return;
    }
    const { trackingNumber, packageName } = this.form.value;
    this.loading = true;
    this.error = null;
    this.trackingService.trackPackage(trackingNumber, this.selectedAccount).subscribe({
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

  submitBatch() {
    const raw = this.form.value.batchNumbers as string;
    if (!raw) {
      return;
    }
    const numbers = raw
      .split(/[,\n]+/)
      .map((n: string) => n.trim())
      .filter((n: string) => n);
    if (numbers.length === 0) {
      return;
    }
    if (numbers.length > 30) {
      this.error = 'Maximum 30 tracking numbers allowed';
      return;
    }
    this.loading = true;
    this.error = null;
    this.trackingService.trackMultiple(numbers, this.selectedAccount).subscribe({
      next: res => {
        this.batchResults = res.filter(r => r.success && r.data).map(r => r.data!) as TrackingInfo[];
        this.loading = false;
      },
      error: err => {
        this.error = err.error?.error || 'Batch tracking failed';
        this.loading = false;
        this.batchResults = null;
      }
    });
  }

  updateAccount() {
    this.notif.updatePreferences({
      email_updates: true,
      addresses: [],
      preferred_language: 'en',
      event_settings: {},
      default_account: this.selectedAccount
    }).subscribe();
  }
}
