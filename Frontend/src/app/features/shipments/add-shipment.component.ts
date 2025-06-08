import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { ShipmentService, ShipmentCreate } from '../../core/services/shipment.service';

@Component({
  selector: 'app-add-shipment',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './add-shipment.component.html',
  styleUrls: ['./add-shipment.component.scss']
})
export class AddShipmentComponent implements OnInit {
  form: FormGroup;

  constructor(private fb: FormBuilder, private service: ShipmentService, private router: Router) {
    this.form = this.fb.group({
      id: ['', Validators.required],
      description: ['']
    });
  }

  ngOnInit(): void {}

  submit() {
    if (this.form.invalid) return;
    const payload: ShipmentCreate = this.form.value;
    this.service.createShipment(payload).subscribe(() => {
      this.router.navigate(['/shipments']);
    });
  }
}
