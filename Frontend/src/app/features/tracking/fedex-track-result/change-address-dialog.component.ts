import { Component } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-change-address-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule],
  template: `
    <h1 mat-dialog-title>Change Delivery Address</h1>
    <div mat-dialog-content>
      <p>This feature will allow updating the destination address.</p>
    </div>
    <div mat-dialog-actions>
      <button mat-button mat-dialog-close>Close</button>
    </div>
  `
})
export class ChangeAddressDialogComponent {
  constructor(public dialogRef: MatDialogRef<ChangeAddressDialogComponent>) {}
}
