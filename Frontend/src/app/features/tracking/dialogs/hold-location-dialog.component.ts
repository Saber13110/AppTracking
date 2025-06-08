import { Component } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-hold-location-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule
  ],
  template: `
    <h1 mat-dialog-title>Hold at Location</h1>
    <div mat-dialog-content>
      <mat-form-field appearance="fill">
        <mat-label>Select Location</mat-label>
        <mat-select [(ngModel)]="location">
          <mat-option *ngFor="let loc of locations" [value]="loc">{{ loc }}</mat-option>
        </mat-select>
      </mat-form-field>
    </div>
    <div mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close()">Cancel</button>
      <button mat-button color="primary" [disabled]="!location" (click)="confirm()">Confirm</button>
    </div>
  `
})
export class HoldLocationDialogComponent {
  locations = ['Main Office', 'Depot 1', 'Depot 2'];
  location: string | null = null;
  constructor(public dialogRef: MatDialogRef<HoldLocationDialogComponent>) {}

  confirm() {
    if (this.location) {
      this.dialogRef.close(this.location);
    }
  }
}
