import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-delivery-instructions-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  templateUrl: './delivery-instructions-dialog.component.html',
  styleUrls: ['./delivery-instructions-dialog.component.scss']
})
export class DeliveryInstructionsDialogComponent {
  constructor(public dialogRef: MatDialogRef<DeliveryInstructionsDialogComponent>) {}

  confirm(): void {
    this.dialogRef.close(true);
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
