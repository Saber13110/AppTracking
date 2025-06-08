import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { BrowserMultiFormatReader } from '@zxing/browser';

import { HomeComponent } from './home.component';
import { AuthService } from '../../core/services/auth.service';
import { TrackingService } from '../tracking/services/tracking.service';
import { NotificationService } from '../../core/services/notification.service';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeComponent, RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: { isLoggedIn: () => of(true) } },
        { provide: TrackingService, useValue: { trackPackage: () => of({ success: true, data: {} }) } },
        { provide: NotificationService, useValue: { getUnreadNotifications: () => of([]) } }
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should navigate to /track/:id on form submit', () => {
    const spy = spyOn(router, 'navigate');
    component.trackingForm.setValue({ trackingNumber: 'ABC123' });
    component.onSubmit();
    expect(spy).toHaveBeenCalledWith(['/track', 'ABC123']);
  });

  it('should navigate to /track/:id after tracking', () => {
    const spy = spyOn(router, 'navigate');
    component.trackingForm.setValue({ trackingNumber: 'XYZ789' });
    component.trackPackage();
    expect(spy).toHaveBeenCalledWith(['/track', 'XYZ789']);
  });

  it('should decode barcode file and populate form', fakeAsync(() => {
    const decodeSpy = spyOn(BrowserMultiFormatReader.prototype, 'decodeFromImageUrl')
      .and.returnValue(Promise.resolve({ getText: () => 'DECODED123' } as any));

    const fakeReader: any = {
      onload: () => {},
      readAsDataURL: function () {
        this.result = 'data:image/png;base64,FAKE';
        this.onload();
      },
      result: ''
    };

    spyOn(window as any, 'FileReader').and.returnValue(fakeReader);

    const file = new File(['dummy'], 'code.png', { type: 'image/png' });
    const event = { target: { files: [file] } } as any;

    component.onBarcodeFileSelected(event);
    tick();

    expect(decodeSpy).toHaveBeenCalled();
    expect(component.trackingForm.get('trackingNumber')?.value).toBe('DECODED123');
  }));

  it('should call TrackingService.downloadProof when downloading', () => {
    const trackingService = TestBed.inject(TrackingService);
    const spy = spyOn(trackingService, 'downloadProof').and.returnValue(of(new Blob()));
    component.trackingForm.setValue({ trackingNumber: 'ABC999' });
    component.downloadProof();
    expect(spy).toHaveBeenCalledWith('ABC999');
  });

  it('should display correct hero feature section', () => {
    component.selectedHeroFeature = 'barcode_scan';
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.barcode-scan-option')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.obtain-proof-option')).toBeNull();

    component.selectedHeroFeature = 'obtain_proof';
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.obtain-proof-option')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.barcode-scan-option')).toBeNull();

    component.selectedHeroFeature = null;
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.tracking-form')).toBeTruthy();
  });
});
