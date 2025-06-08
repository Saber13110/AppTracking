import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { TrackingService } from '../tracking/services/tracking.service';

@Component({
  selector: 'app-advanced-shipment-tracking',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  templateUrl: './advanced-shipment-tracking.component.html',
  styleUrls: ['./advanced-shipment-tracking.component.scss']
})
export class AdvancedShipmentTrackingComponent implements OnInit {
  form: FormGroup;
  dataSource = new MatTableDataSource<any>([]);
  displayedColumns = ['tracking_number', 'status', 'carrier', 'created_at'];
  total = 0;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private fb: FormBuilder, private service: TrackingService) {
    this.form = this.fb.group({
      tracking_number: [''],
      reference: [''],
      sender: [''],
      recipient: [''],
      start_date: [''],
      end_date: ['']
    });
  }

  ngOnInit(): void {
    this.search();
  }

  search(): void {
    const filters = {
      tracking_number: this.form.value.tracking_number || undefined,
      reference: this.form.value.reference || undefined,
      sender: this.form.value.sender || undefined,
      recipient: this.form.value.recipient || undefined,
      start_date: this.form.value.start_date || undefined,
      end_date: this.form.value.end_date || undefined,
      page: this.paginator ? this.paginator.pageIndex + 1 : 1,
      page_size: this.paginator ? this.paginator.pageSize : 10,
      sort_by: this.sort ? this.sort.active : undefined,
      sort_order: this.sort && this.sort.direction ? this.sort.direction : 'desc'
    } as any;
    this.service.searchShipments(filters).subscribe(res => {
      this.dataSource.data = res.items;
      this.total = res.total;
    });
  }

  export(format: string): void {
    const filters = this.form.value;
    this.service.exportShipments(filters, format).subscribe(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `shipments.${format === 'excel' ? 'xlsx' : format}`;
      a.click();
      window.URL.revokeObjectURL(url);
    });
  }
}
