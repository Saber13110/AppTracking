import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl } from '@angular/forms';
import { TrackingService } from '../tracking/services/tracking.service';

@Component({
  selector: 'app-barcode-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './barcode-upload.component.html',
  styleUrls: ['./barcode-upload.component.scss']
})
export class BarcodeUploadComponent {
  @Input() control: AbstractControl | null = null;

  constructor(private trackingService: TrackingService) {}

  onFileSelected(event: any): void {
    const file: File = event.target.files?.[0];
    if (file) {
      this.decode(file);
    }
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    const file = event.dataTransfer?.files?.[0];
    if (file) {
      this.decode(file);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  private decode(file: File) {
    this.trackingService.decodeBarcode(file)
      .then(code => {
        if (this.control) {
          this.control.setValue(code);
          this.control.markAsTouched();
          this.control.updateValueAndValidity();
        }
      })
      .catch(err => console.error('Barcode decode failed', err));
  }
}
