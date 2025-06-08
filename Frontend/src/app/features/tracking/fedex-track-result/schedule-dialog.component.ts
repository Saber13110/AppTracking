import { Component } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-schedule-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule],
  template: `
    <h1 mat-dialog-title>Schedule Delivery</h1>
    <div mat-dialog-content>
      <p>Scheduling options will be available here.</p>
    </div>
    <div mat-dialog-actions>
      <button mat-button mat-dialog-close>Close</button>
    </div>
  `
})
export class ScheduleDialogComponent {
  constructor(public dialogRef: MatDialogRef<ScheduleDialogComponent>) {}
}
