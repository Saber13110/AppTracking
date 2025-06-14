import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl } from '@angular/forms';
import { TrackingService } from '../tracking/services/tracking.service';
import { showNotification } from '../../shared/services/notification.util';

@Component({
  selector: 'app-barcode-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './barcode-upload.component.html',
  styleUrls: ['./barcode-upload.component.scss']
})
export class BarcodeUploadComponent {
  @Input() control: AbstractControl | null = null;
  isDragOver = false;
  fileSelected = false;

  constructor(private trackingService: TrackingService) {}

  onFileSelected(event: any): void {
    const file: File = event.target.files?.[0];
    this.fileSelected = !!file;
    if (file) {
      this.decode(file);
    }
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
    const file = event.dataTransfer?.files?.[0];
    this.fileSelected = !!file;
    if (file) {
      this.decode(file);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
  }

  private decode(file: File) {
    this.trackingService.decodeBarcodeServer(file).subscribe({
      next: ({ barcode }) => {
        if (this.control) {
          this.control.setValue(barcode);
          this.control.markAsTouched();
          this.control.updateValueAndValidity();
        }
      },
      error: (err) => {
        if (err?.status === 400) {
          showNotification('Unable to decode barcode', 'error');
        }
        this.trackingService.decodeBarcodeClient(file)
          .then(code => {
            if (this.control) {
              this.control.setValue(code);
              this.control.markAsTouched();
              this.control.updateValueAndValidity();
            }
          })
          .catch(e => console.error('Barcode decode failed', e));
      }
    });
  }
}
