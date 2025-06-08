import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';

import { HomeComponent } from './home.component';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouterTestingModule, HomeComponent]
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

  it('navigates after tracking number submission', () => {
    const navigateSpy = spyOn(router, 'navigate');
    component.trackingForm.setValue({ trackingNumber: 'ABC1234567' });
    component.onSubmit();
    expect(navigateSpy).toHaveBeenCalledWith(['/tracking', 'ABC1234567']);
  });

  it('displays sections based on list content', () => {
    component.servicesList = [{ title: 't', description: 'd', icon: 'i', image: 'img', link: '#' }];
    component.news = [{ id: 1, title: 'a', content: 'c', image: 'i', imageUrl: 'i', date: new Date(), category: 'cat', summary: 's', slug: 'slug' }];
    component.faqList = [{ question: 'q', answer: 'a', isOpen: false }];
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelectorAll('.service-item').length).toBe(1);
    expect(compiled.querySelectorAll('.news__card').length).toBe(1);
    expect(compiled.querySelectorAll('.faq__item').length).toBe(1);

    component.servicesList = [];
    component.news = [];
    component.faqList = [];
    fixture.detectChanges();

    expect(compiled.querySelectorAll('.service-item').length).toBe(0);
    expect(compiled.querySelectorAll('.news__card').length).toBe(0);
    expect(compiled.querySelectorAll('.faq__item').length).toBe(0);
  });

  it('initializes map with Google Maps mock', () => {
    const mapInstance = {};
    const markerSpy = jasmine.createSpy('Marker').and.callFake(() => ({ addListener: () => {}, setMap: () => {}, getTitle: () => '' }));
    (window as any).google = {
      maps: {
        Map: jasmine.createSpy('Map').and.returnValue(mapInstance),
        Marker: markerSpy,
        Animation: { DROP: 'DROP', BOUNCE: 'BOUNCE' }
      }
    };

    component.locations = [{ id: 1, name: 'loc', address: '', phone: '', email: '', hours: '', coordinates: { lat: 0, lng: 0 } }];
    (component as any).initializeMap();

    expect((component as any).map).toBe(mapInstance);
    expect(markerSpy).toHaveBeenCalledTimes(1);
  });
});
