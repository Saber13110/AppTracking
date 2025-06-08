import { Component, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TrackingService, TrackingResponse } from '../tracking/services/tracking.service';
import { AnalyticsService } from '../../core/services/analytics.service';
import { BrowserCodeReader, BrowserMultiFormatReader, IScannerControls } from '@zxing/browser';

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
  barcodeForm: FormGroup;

  barcodeResult: TrackingResponse | null = null;

  @ViewChild('videoPreview') videoPreview!: ElementRef<HTMLVideoElement>;
  private webcamReader: BrowserMultiFormatReader | null = null;
  private scannerControls?: IScannerControls;
  isScanning = false;

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

    this.barcodeForm = this.fb.group({
      trackingNumber: ['', Validators.required],
      packageName: ['']
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

  submitBarcode(): void {
    if (this.barcodeForm.invalid) {
      this.barcodeForm.markAllAsTouched();
      return;
    }

    const { trackingNumber, packageName } = this.barcodeForm.value;
    this.barcodeResult = null;
    this.analytics.logAction('submit_barcode', trackingNumber);
    this.trackingService.trackNumber(trackingNumber, packageName).subscribe(res => {
      this.barcodeResult = res;
    });
  }

  onBarcodeFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const codeReader = new BrowserMultiFormatReader();
        const result = await codeReader.decodeFromImageUrl(reader.result as string);
        const decoded = result.getText();
        this.barcodeForm.get('trackingNumber')?.setValue(decoded);
        this.submitBarcode();
      } catch (err) {
        console.error('Barcode decode error', err);
      }
    };
    reader.readAsDataURL(file);
  }

  async startBarcodeScan(): Promise<void> {
    if (this.isScanning) {
      this.scannerControls?.stop();
      (this.webcamReader as any)?.reset();
      this.isScanning = false;
      this.analytics.logAction('stop_webcam_scan');
      return;
    }

    this.webcamReader = new BrowserMultiFormatReader();
    try {
      const devices = await BrowserCodeReader.listVideoInputDevices();
      const deviceId = devices[0]?.deviceId;
      this.isScanning = true;
      this.analytics.logAction('start_webcam_scan');

      this.scannerControls = await this.webcamReader.decodeFromVideoDevice(
        deviceId,
        this.videoPreview.nativeElement,
        (result, error, controls) => {
          if (result) {
            this.barcodeForm.get('trackingNumber')?.setValue(result.getText());
            controls.stop();
            this.isScanning = false;
            this.analytics.logAction('barcode_scanned', result.getText());
            this.submitBarcode();
          }
        }
      );
    } catch (err) {
      console.error('Webcam scan error:', err);
      this.isScanning = false;
      this.analytics.logAction('webcam_scan_error');
    }
  }
}
