import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-schedule-delivery-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  templateUrl: './schedule-delivery-dialog.component.html',
  styleUrls: ['./schedule-delivery-dialog.component.scss']
})
export class ScheduleDeliveryDialogComponent {
  constructor(private dialogRef: MatDialogRef<ScheduleDeliveryDialogComponent>) {}

  confirm(): void {
    this.dialogRef.close(true);
  }

  cancel(): void {
    this.dialogRef.close(false);
  }
}
