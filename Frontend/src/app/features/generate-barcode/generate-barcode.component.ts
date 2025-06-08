import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TrackingService } from '../tracking/services/tracking.service';

@Component({
  selector: 'app-generate-barcode',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './generate-barcode.component.html',
  styleUrls: ['./generate-barcode.component.scss']
})
export class GenerateBarcodeComponent {
  form: FormGroup;
  barcodeUrl: string | null = null;

  constructor(private fb: FormBuilder, private trackingService: TrackingService) {
    this.form = this.fb.group({
      trackingId: ['', Validators.required]
    });
  }

  generate() {
    if (this.form.invalid) {
      return;
    }
    const id = this.form.value.trackingId;
    this.trackingService.getBarcodeImage(id).subscribe(blob => {
      this.barcodeUrl = URL.createObjectURL(blob);
    });
  }
}
