import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private lang = 'en';
  private translations: Record<string, Record<string, string>> = {
    en: {
      HERO_TITLE: 'Track your packages in real-time',
      HERO_SUBTITLE: 'Enter your tracking number to know the status of your delivery',
      LOGOUT: 'Logout',
      SCAN_BARCODE: 'Scan\nBarcode',
      TRACK: 'TRACK',
      OBTAIN_PROOF: 'Obtain your\nproof',
      TRACK_PLACEHOLDER: 'Enter your tracking number',
      PACKAGE_NAME_PLACEHOLDER: 'Package name (optional)',
      TRACK_BUTTON: 'Track',
      REQUIRED_ERROR: 'Tracking number is required.',
      PATTERN_ERROR: 'Tracking number must be alphanumeric.',
      UPLOAD_TEXT: 'Upload a barcode image or use Pro Scan to track your package.',
      DRAG_TEXT: 'Drag and drop or click to upload',
      STOP_SCAN: 'Stop Scan',
      PRO_SCAN: 'Pro Scan (Webcam)',
      ENTER_ID: 'Enter tracking ID to download your proof of delivery.',
      ENTER_ID_PLACEHOLDER: 'Enter tracking ID',
      DOWNLOAD_PROOF: 'Download Proof',
      SHARE: 'Share',
      PRINT: 'Print',
      SAVE: 'Save',
      COPY: 'Copy',
      CONTACT_SUPPORT: 'Contact support',
      GENERATE_TITLE: 'Enter a tracking ID to generate its barcode.',
      GENERATE_PLACEHOLDER: 'Enter tracking ID',
      GENERATE_BUTTON: 'Generate'
    },
    fr: {
      HERO_TITLE: 'Suivez vos colis en temps r\u00e9el',
      HERO_SUBTITLE: 'Saisissez votre num\u00e9ro pour conna\u00eetre le statut de votre livraison',
      LOGOUT: 'Se d\u00e9connecter',
      SCAN_BARCODE: 'Scanner\nle code-barres',
      TRACK: 'SUIVRE',
      OBTAIN_PROOF: 'Obtenir votre\npreuve',
      TRACK_PLACEHOLDER: 'Num\u00e9ro de suivi',
      PACKAGE_NAME_PLACEHOLDER: 'Nom du colis (optionnel)',
      TRACK_BUTTON: 'Rechercher',
      REQUIRED_ERROR: 'Le num\u00e9ro de suivi est obligatoire.',
      PATTERN_ERROR: 'Le num\u00e9ro de suivi doit \u00eatre alphanum\u00e9rique.',
      UPLOAD_TEXT: 'T\u00e9l\u00e9chargez une image de code-barres ou utilisez Pro Scan pour suivre votre colis.',
      DRAG_TEXT: 'Glissez-d\u00e9posez ou cliquez pour importer',
      STOP_SCAN: 'Arr\u00eater le scan',
      PRO_SCAN: 'Pro Scan (Webcam)',
      ENTER_ID: "Entrez l'identifiant pour t\u00e9l\u00e9charger votre preuve de livraison.",
      ENTER_ID_PLACEHOLDER: 'ID de suivi',
      DOWNLOAD_PROOF: 'T\u00e9l\u00e9charger la preuve',
      SHARE: 'Partager',
      PRINT: 'Imprimer',
      SAVE: 'Enregistrer',
      COPY: 'Copier',
      CONTACT_SUPPORT: 'Contacter le support',
      GENERATE_TITLE: 'Entrez un identifiant pour g\u00e9n\u00e9rer son code-barres.',
      GENERATE_PLACEHOLDER: 'ID de suivi',
      GENERATE_BUTTON: 'G\u00e9n\u00e9rer'
    }
  };

  detectBrowserLang(): void {
    const browserLang = navigator.language.startsWith('fr') ? 'fr' : 'en';
    this.lang = browserLang;
  }

  setLang(lang: string): void {
    this.lang = lang;
  }

  get currentLang(): string {
    return this.lang;
  }

  t(key: string): string {
    return this.translations[this.lang][key] || key;
  }
}
