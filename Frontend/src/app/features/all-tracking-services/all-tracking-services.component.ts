import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { TrackingService } from '../tracking/services/tracking.service';
import { AnalyticsService } from '../../core/services/analytics.service';
import { TrackingFormComponent } from '../../shared/components/tracking-form/tracking-form.component';
import { TrackingTabsComponent } from '../../shared/components/tracking-tabs/tracking-tabs.component';
import { BarcodeUploadComponent } from '../barcode-upload/barcode-upload.component';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { BreadcrumbComponent } from '../../shared/components/breadcrumb/breadcrumb.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { TrackingOptionsComponent } from '../../shared/components/tracking-options/tracking-options.component';
import { TrackingMobileComponent } from '../../shared/components/tracking-mobile/tracking-mobile.component';

@Component({
  selector: 'app-all-tracking-services',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    NavbarComponent,
    BreadcrumbComponent,
    TrackingFormComponent,
    TrackingTabsComponent,
    BarcodeUploadComponent,
    TrackingOptionsComponent,
    TrackingMobileComponent,
    FooterComponent
  ],
  templateUrl: './all-tracking-services.component.html',
  styleUrls: ['./all-tracking-services.component.scss']
})
export class AllTrackingServicesComponent {
  activeTab: 'number' | 'reference' | 'tcn' = 'number';

  numberForm: FormGroup;
  referenceForm: FormGroup;
  tcnForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private trackingService: TrackingService,
    private analytics: AnalyticsService,
    private router: Router
  ) {
    this.numberForm = this.fb.group({
      trackingNumber: ['', [Validators.required, Validators.pattern('^[A-Z0-9]{10,}$')]],
      packageName: ['']
    });
    this.referenceForm = this.fb.group({
      reference: ['', Validators.required]
    });
    this.tcnForm = this.fb.group({
      tcn: ['', Validators.required]
    });
  }

  switchTab(tab: 'number' | 'reference' | 'tcn'): void {
    this.activeTab = tab;
    this.analytics.logAction('switch_tab', tab);
  }

  submitNumber(): void {
    if (this.numberForm.invalid) {
      this.numberForm.markAllAsTouched();
      return;
    }
    const { trackingNumber, packageName } = this.numberForm.value;
    this.analytics.logAction('submit_number', trackingNumber);
    this.trackingService.trackNumber(trackingNumber, packageName).subscribe(() => {
      this.router.navigate(['/track', trackingNumber]);
    });
  }

  submitReference(): void {
    if (this.referenceForm.invalid) {
      this.referenceForm.markAllAsTouched();
      return;
    }
    const { reference } = this.referenceForm.value;
    this.analytics.logAction('submit_reference', reference);
    this.trackingService.trackReference(reference).subscribe(() => {
      this.router.navigate(['/track', reference]);
    });
  }

  submitTcn(): void {
    if (this.tcnForm.invalid) {
      this.tcnForm.markAllAsTouched();
      return;
    }
    const { tcn } = this.tcnForm.value;
    this.analytics.logAction('submit_tcn', tcn);
    this.trackingService.trackTcn(tcn).subscribe(() => {
      this.router.navigate(['/track', tcn]);
    });
  }
}
