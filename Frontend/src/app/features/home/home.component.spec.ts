import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';

import { HomeComponent } from './home.component';
import { AuthService } from '../../core/services/auth.service';
import { TrackingService } from '../tracking/services/tracking.service';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeComponent, RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: { isLoggedIn: () => of(true) } },
        { provide: TrackingService, useValue: { trackPackage: () => of({ success: true, data: {} }) } }
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
});
