import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ShipmentService, ShipmentUpdate } from '../../core/services/shipment.service';

@Component({
  selector: 'app-edit-shipment',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './edit-shipment.component.html',
  styleUrls: ['./edit-shipment.component.scss']
})
export class EditShipmentComponent implements OnInit {
  form: FormGroup;
  shipmentId = '';

  constructor(
    private fb: FormBuilder,
    private service: ShipmentService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.form = this.fb.group({
      description: ['', Validators.required],
      status: ['']
    });
  }

  ngOnInit(): void {
    this.shipmentId = this.route.snapshot.paramMap.get('id') || '';
    if (this.shipmentId) {
      this.service.getShipment(this.shipmentId).subscribe(s => {
        this.form.patchValue({
          description: s.description,
          status: s.status
        });
      });
    }
  }

  submit() {
    if (this.form.invalid) return;
    const update: ShipmentUpdate = this.form.value;
    this.service.updateShipment(this.shipmentId, update).subscribe(() => {
      this.router.navigate(['/shipments']);
    });
  }
}
