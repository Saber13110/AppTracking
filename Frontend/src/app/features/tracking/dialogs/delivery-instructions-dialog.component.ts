import { Component } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-delivery-instructions-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  template: `
    <h1 mat-dialog-title>Delivery Instructions</h1>
    <div mat-dialog-content>
      <mat-form-field appearance="fill" class="w-full">
        <mat-label>Instructions</mat-label>
        <textarea matInput rows="3" [(ngModel)]="instructions"></textarea>
      </mat-form-field>
    </div>
    <div mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close()">Cancel</button>
      <button mat-button color="primary" [disabled]="!instructions" (click)="confirm()">Confirm</button>
    </div>
  `
})
export class DeliveryInstructionsDialogComponent {
  instructions = '';
  constructor(public dialogRef: MatDialogRef<DeliveryInstructionsDialogComponent>) {}

  confirm() {
    const value = this.instructions.trim();
    if (value) {
      this.dialogRef.close(value);
    }
  }
}
