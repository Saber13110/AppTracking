import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { of, throwError } from 'rxjs';

import { BarcodeUploadComponent } from './barcode-upload.component';
import { TrackingService } from '../tracking/services/tracking.service';
import * as notificationUtil from '../../shared/services/notification.util';

describe('BarcodeUploadComponent', () => {
  let component: BarcodeUploadComponent;
  let trackingService: jasmine.SpyObj<TrackingService>;

  beforeEach(async () => {
    trackingService = jasmine.createSpyObj('TrackingService', ['decodeBarcodeServer', 'decodeBarcodeClient']);

    await TestBed.configureTestingModule({
      imports: [BarcodeUploadComponent],
      providers: [{ provide: TrackingService, useValue: trackingService }]
    }).compileComponents();

    component = TestBed.createComponent(BarcodeUploadComponent).componentInstance;
    spyOn(notificationUtil, 'showNotification');
  });

  afterEach(() => {
    (notificationUtil.showNotification as jasmine.Spy).calls.reset();
    trackingService.decodeBarcodeServer.calls.reset();
    trackingService.decodeBarcodeClient.calls.reset();
  });

  it('should set control value with server decoded barcode', () => {
    const control = new FormControl('');
    component.control = control;
    const file = new File(['dummy'], 'code.png');
    trackingService.decodeBarcodeServer.and.returnValue(of({ barcode: 'SERVER123' }));

    (component as any).decode(file);

    expect(control.value).toBe('SERVER123');
  });

  it('should fallback to client decoding and notify on server error', fakeAsync(() => {
    const control = new FormControl('');
    component.control = control;
    const file = new File(['dummy'], 'code.png');
    trackingService.decodeBarcodeServer.and.returnValue(throwError(() => ({ status: 400 })));
    trackingService.decodeBarcodeClient.and.returnValue(Promise.resolve('CLIENT123'));

    (component as any).decode(file);
    tick();

    expect(trackingService.decodeBarcodeClient).toHaveBeenCalledWith(file);
    expect(control.value).toBe('CLIENT123');
    expect(notificationUtil.showNotification).toHaveBeenCalledWith('Unable to decode barcode', 'error');
  }));
});
