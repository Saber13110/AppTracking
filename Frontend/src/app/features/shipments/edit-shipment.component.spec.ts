import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';

import { EditShipmentComponent } from './edit-shipment.component';
import { ShipmentService } from '../../core/services/shipment.service';

describe('EditShipmentComponent', () => {
  let component: EditShipmentComponent;
  let fixture: ComponentFixture<EditShipmentComponent>;
  let service: jasmine.SpyObj<ShipmentService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    service = jasmine.createSpyObj('ShipmentService', ['getShipment', 'updateShipment']);
    router = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [EditShipmentComponent],
      providers: [
        { provide: ShipmentService, useValue: service },
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: new Map([['id', '123']]) } } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EditShipmentComponent);
    component = fixture.componentInstance;
    service.getShipment.and.returnValue(of({ id: '123', description: 'd', status: 's', created_at: '', estimated_delivery: '' } as any));
    fixture.detectChanges();
  });

  it('should create and load shipment', () => {
    expect(component).toBeTruthy();
    expect(service.getShipment).toHaveBeenCalledWith('123');
  });

  it('should call update on submit', () => {
    service.updateShipment.and.returnValue(of({} as any));
    component.form.patchValue({ description: 'x', status: 'y' });
    component.submit();
    expect(service.updateShipment).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/shipments']);
  });
});
