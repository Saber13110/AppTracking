import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';

import { AddShipmentComponent } from './add-shipment.component';
import { ShipmentService } from '../../core/services/shipment.service';

describe('AddShipmentComponent', () => {
  let component: AddShipmentComponent;
  let fixture: ComponentFixture<AddShipmentComponent>;
  let service: jasmine.SpyObj<ShipmentService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    service = jasmine.createSpyObj('ShipmentService', ['createShipment']);
    router = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [AddShipmentComponent],
      providers: [
        { provide: ShipmentService, useValue: service },
        { provide: Router, useValue: router }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AddShipmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call service on submit', () => {
    service.createShipment.and.returnValue(of({} as any));
    component.form.patchValue({ id: 'X', description: 'Y' });
    component.submit();
    expect(service.createShipment).toHaveBeenCalledWith({ id: 'X', description: 'Y' });
    expect(router.navigate).toHaveBeenCalledWith(['/shipments']);
  });
});
