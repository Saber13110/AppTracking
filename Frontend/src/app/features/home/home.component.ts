import { Component, OnInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { TrackingService } from '../tracking/services/tracking.service';
import { TrackingHistoryService } from '../../core/services/tracking-history.service';
import { NotificationService } from '../../core/services/notification.service';
import { AnalyticsService } from '../../core/services/analytics.service';
import { NewsService } from '../news/services/news.service';
import { Subject, Observable } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { BrowserCodeReader, IScannerControls, BrowserMultiFormatReader } from '@zxing/browser';
import { BarcodeUploadComponent } from '../barcode-upload/barcode-upload.component';
import { TrackingOptionsComponent } from '../../shared/components/tracking-options/tracking-options.component';
import { TrackingMobileComponent } from '../../shared/components/tracking-mobile/tracking-mobile.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { TrackingFormComponent } from '../../shared/components/tracking-form/tracking-form.component';
import { GlossaryComponent } from '../../shared/components/glossary/glossary.component';

// Import Google Maps types
declare global {
  interface Window {
    google: any;
  }
}

interface News {
  id: number;
  title: string;
  content: string;
  image: string;
  imageUrl: string;
  date: Date;
  category: string;
  summary: string;
  slug: string;
}

interface Location {
  id: number;
  name: string;
  address: string;
  phone: string;
  email: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  hours: string;
}

interface FAQ {
  question: string;
  answer: string;
  isOpen: boolean;
}

interface Notification {
  id: number;
  type: 'success' | 'warning' | 'error';
  title: string;
  message: string;
}

interface ServiceItem {
  title: string;
  description: string;
  icon: string;
  image: string;
  link: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    BarcodeUploadComponent,
    TrackingOptionsComponent,
    TrackingMobileComponent,
    TrackingFormComponent,
    FooterComponent,
    GlossaryComponent
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms ease-in', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('300ms ease-out', style({ opacity: 0 }))
      ])
    ])
  ]
})
export class HomeComponent implements OnInit, OnDestroy {
  @ViewChild('videoPreview') videoPreview!: ElementRef<HTMLVideoElement>;

  private webcamReader: BrowserMultiFormatReader | null = null;
  private scannerControls?: IScannerControls;
  isScanning = false;
  
  // === Champs du formulaire de tracking
  trackingForm: FormGroup;

  // === Auth pour afficher outils avancés
  isLoggedIn$!: Observable<boolean>;

  // === Notifications en file d'attente
  notifications: Notification[] = [];

  // === Liste d'actualités
  news: News[] = [];

  // === Liste FAQ
  faqList: FAQ[] = [];

  locations: Location[] = [];

  // === Liste des services
  servicesList: ServiceItem[] = [];

  selectedLocation: Location | null = null;
  private map: any = null;
  private markers: any[] = [];
  private destroy$ = new Subject<void>();
  private refreshIntervalId: any;
  private shownNotificationIds = new Set<string>();

  // === GESTION DES CARTES DE FONCTIONNALITÉS HERO
  // Tracks the currently selected feature card in the hero section ('barcode_scan', 'obtain_proof', or null for default track by ID)
  selectedHeroFeature: 'barcode_scan' | 'obtain_proof' | null = null;

  // Form for barcode generation
  barcodeForm: FormGroup;
  barcodeImageUrl: string | null = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private trackingService: TrackingService,
    private notificationService: NotificationService,
    private analytics: AnalyticsService,
    private history: TrackingHistoryService,
    private newsService: NewsService
  ) {
    this.trackingForm = this.fb.group({
      trackingNumber: ['', [Validators.required, Validators.pattern('^[A-Z0-9]{10,}$')]],
      packageName: ['']
    });
    
    this.barcodeForm = this.fb.group({
      trackingId: ['', [Validators.required, Validators.pattern('^[A-Z0-9]{10,}$')]]
    });
  }

  ngOnInit(): void {
    this.isLoggedIn$ = this.authService.isLoggedIn();
    this.fetchUnreadNotifications();
    this.refreshIntervalId = setInterval(() => this.fetchUnreadNotifications(), 60000);
    this.initializeNews();
    this.initializeLocations();
    this.initializeFAQ();
    this.initializeServices();
    
    this.waitForGoogleMaps().then(() => this.initializeMap());
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.refreshIntervalId) {
      clearInterval(this.refreshIntervalId);
    }
    // Clean up map resources
    if (this.map) {
      this.map = null;
    }
    this.markers.forEach(marker => marker.setMap(null));
  }

  private initializeNews(): void {
    this.newsService
      .getArticles()
      .pipe(takeUntil(this.destroy$))
      .subscribe(articles => (this.news = articles));
  }

  private initializeLocations(): void {
    this.locations = [
      {
        id: 1,
        name: "Agence Centrale - Casablanca",
        address: "123 Boulevard Hassan II, Casablanca",
        phone: "+212 522-123456",
        email: "casablanca@globex.ma",
        hours: "Lun-Sam: 8h-20h",
        coordinates: { lat: 33.5731, lng: -7.5898 }
      },
      {
        id: 2,
        name: "Agence Rabat",
        address: "45 Avenue Mohammed V, Rabat",
        phone: "+212 537-123456",
        email: "rabat@globex.ma",
        hours: "Lun-Sam: 8h-20h",
        coordinates: { lat: 34.0209, lng: -6.8416 }
      },
      {
        id: 3,
        name: "Agence Marrakech",
        address: "78 Rue Ibn Sina, Marrakech",
        phone: "+212 524-123456",
        email: "marrakech@globex.ma",
        hours: "Lun-Sam: 8h-20h",
        coordinates: { lat: 31.6295, lng: -7.9811 }
      }
    ];
  }

  private initializeFAQ(): void {
    this.faqList = [
      {
        question: "Comment suivre mon colis ?",
        answer: "Entrez votre numéro de suivi dans la barre de recherche en haut de la page pour suivre votre colis en temps réel.",
        isOpen: false
      },
      {
        question: "Quels sont les délais de livraison ?",
        answer: "Les délais de livraison varient selon le service choisi : Express (24h), Standard (2-3 jours), Économique (3-5 jours).",
        isOpen: false
      },
      {
        question: "Comment contacter le service client ?",
        answer: "Notre service client est disponible 24/7 par téléphone au +212 522-123456 ou par email à support@globex.ma.",
        isOpen: false
      }
    ];
  }

  private initializeServices(): void {
    this.servicesList = [
      {
        title: "Suivi par Email",
        description: "Recevez les mises à jour de suivi en temps réel directement dans votre boîte de réception. Activez les notifications par email pour ne rien manquer des étapes importantes de la livraison de votre colis.",
        icon: "fas fa-envelope",
        image: "assets/images/services/express.jpg",
        link: "/services/track-by-mail"
      },
      {
        title: "Options de Notification",
        description: "Configurez des alertes personnalisées via email ou SMS pour être instantanément informé des étapes clés de la livraison de votre colis, depuis l'expédition jusqu'à la livraison finale.",
        icon: "fas fa-bell",
        image: "assets/images/services/international.jpg",
        link: "/services/notifications"
      },
      {
        title: "Génération de Code-Barres",
        description: "Convertissez facilement vos numéros de suivi en codes-barres pour une gestion plus efficace. Générez des codes-barres personnalisés pour vos colis et suivez-les plus facilement dans notre système.",
        icon: "fas fa-barcode",
        image: "assets/images/services/ecommerce.jpg",
        link: "/services/generate-barcode"
      }
    ];
  }

  private initializeMap() {
    if (typeof window.google !== 'undefined') {
      const moroccoCenter = { lat: 31.7917, lng: -7.0926 };
      
      this.map = new window.google.maps.Map(document.getElementById('map') as HTMLElement, {
        center: moroccoCenter,
        zoom: 6,
        styles: [
          {
            featureType: "all",
            elementType: "geometry",
            stylers: [{ color: "#f5f5f5" }]
          },
          {
            featureType: "water",
            elementType: "geometry",
            stylers: [{ color: "#e9e9e9" }]
          }
        ]
      });

      this.locations.forEach(location => {
        const marker = new window.google.maps.Marker({
          position: location.coordinates,
          map: this.map,
          title: location.name,
          animation: window.google.maps.Animation.DROP
        });

        marker.addListener('click', () => {
          this.selectLocation(location);
        });

        this.markers.push(marker);
      });
    }
  }

  selectLocation(location: Location) {
    this.selectedLocation = location;
    
    if (this.map && typeof window.google !== 'undefined') {
      this.map.setCenter(location.coordinates);
      this.map.setZoom(15);

      this.markers.forEach(marker => {
        marker.setAnimation(null);
        if (marker.getTitle() === location.name) {
          marker.setAnimation(window.google.maps.Animation.BOUNCE);
        }
      });
    }
  }

  onSubmit() {
    this.trackPackage();
  }

  // === TRAITEMENT TRACKING
  trackPackage(): void {
    if (this.trackingForm.invalid) {
      this.trackingForm.markAllAsTouched();
      return;
    }

    this.analytics.logAction('track_package', this.trackingForm.get('trackingNumber')?.value);

    const identifier = this.trackingForm.get('trackingNumber')?.value.trim();
    const name = this.trackingForm.get('packageName')?.value;
    if (!identifier) {
      return;
    }

    this.addNotification(
      'success',
      'Recherche en cours',
      `Recherche du colis #${identifier}...`
    );

    this.trackingService.trackNumber(identifier, name).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.history.addIdentifier(identifier);
          this.router.navigate(['/track', identifier]);
          } else {
          this.addNotification('error', 'Erreur', response.error || 'Erreur inconnue');
        }
      },
      error: (err) => {
        const msg = err.error?.error || 'Erreur lors de la recherche du colis';
        this.addNotification('error', 'Erreur', msg);
        console.error('Erreur de suivi:', err);
      }
    });
  }

  downloadProof(): void {
    const identifier = this.trackingForm.get('trackingNumber')?.value.trim();
    if (!identifier) return;

    this.analytics.logAction('download_proof', identifier);

    this.trackingService.downloadProof(identifier).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `proof_${identifier}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        const msg = err.error?.error || 'Erreur lors du téléchargement de la preuve';
        this.addNotification('error', 'Erreur', msg);
        console.error('Erreur de preuve:', err);
      }
    });
  }

  // === AJOUTER NOTIFICATION FLOTTANTE
  addNotification(type: 'success' | 'warning' | 'error', title: string, message: string): void {
    const notification: Notification = {
      id: Date.now(),
      type,
      title,
      message
    };
    this.notifications.push(notification);
    setTimeout(() => this.removeNotification(notification), 5000);
  }

  // === SUPPRIMER NOTIF
  removeNotification(notification: Notification): void {
    this.notifications = this.notifications.filter(n => n.id !== notification.id);
  }

  // === FETCH SERVER NOTIFICATIONS
  fetchUnreadNotifications(): void {
    this.notificationService.getUnreadNotifications()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (notifs) => {
          notifs.forEach(n => {
            if (!this.shownNotificationIds.has(n.id)) {
              this.shownNotificationIds.add(n.id);
              this.addNotification('success', n.title, n.message);
            }
          });
        },
        error: (err) => {
          console.error('Failed to load notifications', err);
        }
      });
  }

  // === FONCTION POUR FAQ ACCORDÉON
  toggleFaq(faq: FAQ): void {
    faq.isOpen = !faq.isOpen;
  }

  // === SÉLECTIONNER UNE CARTE DE FONCTIONNALITÉ HERO
  selectHeroFeature(feature: 'barcode_scan' | 'obtain_proof' | null): void {
    if (this.isScanning && feature !== 'barcode_scan') {
      this.scannerControls?.stop();
      (this.webcamReader as any)?.reset();
      this.isScanning = false;
    }
    this.selectedHeroFeature = feature;
    // Logique additionnelle si nécessaire (ex: réinitialiser le formulaire de suivi)
    if (feature === null) {
      // Réinitialiser ou focus sur le formulaire de suivi ID si on revient au défaut
      this.trackingForm.reset();
    }
  }

  // === GESTION DU TÉLÉVERSEMENT DE FICHIER DE CODE-BARRES
  onBarcodeFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const codeReader = new BrowserMultiFormatReader();
        const result = await codeReader.decodeFromImageUrl(reader.result as string);
        const decoded = result.getText();
        this.trackingForm.get('trackingNumber')?.setValue(decoded);
        console.log('Barcode decoded:', decoded);
      } catch (err) {
        console.error('Erreur de décodage du code-barres:', err);
        this.addNotification('error', 'Scan failed', 'Impossible de lire le code-barres.');
      }
    };
    reader.readAsDataURL(file);
  }

  // === WEBCAM BARCODE SCAN
  async startWebcamScan(): Promise<void> {
    if (this.isScanning) {
      this.scannerControls?.stop();
      (this.webcamReader as any)?.reset();
      this.isScanning = false;
      this.analytics.logAction('stop_webcam_scan');
      return;
    }

    this.webcamReader = new BrowserMultiFormatReader();
    try {
      const devices = await BrowserCodeReader.listVideoInputDevices();
      const deviceId = devices[0]?.deviceId;
      this.isScanning = true;
      this.analytics.logAction('start_webcam_scan');

      this.scannerControls = await this.webcamReader.decodeFromVideoDevice(
        deviceId,
        this.videoPreview.nativeElement,
        (result, error, controls) => {
          if (result) {
            this.trackingForm.get('trackingNumber')?.setValue(result.getText());
            controls.stop();
            this.isScanning = false;
            this.analytics.logAction('barcode_scanned', result.getText());
          }
        }
      );
    } catch (err) {
      console.error('Webcam scan error:', err);
      this.isScanning = false;
      this.analytics.logAction('webcam_scan_error');
    }
  }
  
  // Method to generate barcode
  generateBarcode(): void {
    if (this.barcodeForm.valid) {
      const trackingId = this.barcodeForm.get('trackingId')?.value;
      this.analytics.logAction('generate_barcode', trackingId);
      this.trackingService.getBarcodeImage(trackingId).subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          this.barcodeImageUrl = url;

          const link = document.createElement('a');
          link.href = url;
          link.download = `${trackingId}.png`;
          link.click();

          // Delay revoking the object URL to ensure the image loads
          // and the download has completed before releasing the blob
          setTimeout(() => {
            window.URL.revokeObjectURL(url);
          }, 1000);

          this.addNotification(
            'success',
            'Barcode Generated',
            `Barcode for tracking ID ${trackingId} has been generated.`
          );
        },
        error: (err) => {
          const msg = err.error?.detail || 'Failed to generate barcode';
          this.addNotification('error', 'Error', msg);
        }
      });
    } else {
      this.addNotification(
        'error',
        'Invalid Input',
        'Please enter a valid tracking ID (minimum 10 alphanumeric characters).'
      );
    }
  }

  private waitForGoogleMaps(): Promise<void> {
    return new Promise(resolve => {
      const check = () => {
        if (typeof window !== 'undefined' && (window as any).google && (window as any).google.maps) {
          resolve();
        } else {
          setTimeout(check, 100);
        }
      };
      check();
    });
  }

  logout(): void {
    this.authService.logout().subscribe();
  }
}
