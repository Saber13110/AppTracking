import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TrackingService } from '../tracking/services/tracking.service';
import { AnalyticsService } from '../../core/services/analytics.service';
import { TrackingFormComponent } from '../../shared/components/tracking-form/tracking-form.component';
import { TrackingTabsComponent } from '../../shared/components/tracking-tabs/tracking-tabs.component';

@Component({
  selector: 'app-all-tracking-services',
  standalone: true,
  imports: [CommonModule,
    ReactiveFormsModule,
    TrackingFormComponent,
    TrackingTabsComponent],
  templateUrl: './all-tracking-services.component.html',
  styleUrls: ['./all-tracking-services.component.scss']
})
export class AllTrackingServicesComponent {
  activeTab: 'number' | 'reference' | 'tcn' | 'proof' = 'number';

  singleForm: FormGroup;
  referenceForm: FormGroup;
  tcnForm: FormGroup;
  proofForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private trackingService: TrackingService,
    private analytics: AnalyticsService
  ) {
    this.singleForm = this.fb.group({
      trackingNumber: ['', [Validators.required, Validators.pattern('^[A-Z0-9]{10,}$')]],
      packageName: ['']
    });
    this.referenceForm = this.fb.group({
      reference: ['', Validators.required]
    });
    this.tcnForm = this.fb.group({
      tcn: ['', Validators.required]
    });
    this.proofForm = this.fb.group({
      trackingNumber: ['', Validators.required]
    });
  }

  switchTab(tab: 'number' | 'reference' | 'tcn' | 'proof'): void {
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

  submitReference(): void {
    if (this.referenceForm.invalid) {
      this.referenceForm.markAllAsTouched();
      return;
    }
    const ref = this.referenceForm.value.reference;
    this.analytics.logAction('submit_reference', ref);
    this.trackingService.trackReference(ref).subscribe();
  }

  submitTcn(): void {
    if (this.tcnForm.invalid) {
      this.tcnForm.markAllAsTouched();
      return;
    }
    const tcn = this.tcnForm.value.tcn;
    this.analytics.logAction('submit_tcn', tcn);
    this.trackingService.trackTcn(tcn).subscribe();
  }

  downloadProof(): void {
    if (this.proofForm.invalid) {
      this.proofForm.markAllAsTouched();
      return;
    }
    const tn = this.proofForm.value.trackingNumber;
    this.analytics.logAction('download_proof', tn);
    this.trackingService.downloadProof(tn).subscribe();
  }
}
