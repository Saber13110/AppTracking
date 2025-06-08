import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BreadcrumbComponent } from '../../shared/components/breadcrumb/breadcrumb.component';
import { SimpleTabsComponent, TabItem } from '../../shared/components/simple-tabs/simple-tabs.component';
import { QuickSearchComponent } from './quick-search/quick-search.component';
import { FaqListComponent, Faq } from './faq-list/faq-list.component';

@Component({
  selector: 'app-help-center',
  standalone: true,
  imports: [
    CommonModule,
    BreadcrumbComponent,
    SimpleTabsComponent,
    QuickSearchComponent,
    FaqListComponent
  ],
  templateUrl: './help-center.component.html',
  styleUrls: ['./help-center.component.scss']
})
export class HelpCenterComponent {
  tabs: TabItem[] = [
    { id: 'advice', label: 'Advice' },
    { id: 'tools', label: 'Tracking Tools' },
    { id: 'faq', label: 'FAQs' },
    { id: 'contact', label: 'Contact' }
  ];
  activeTab = 'advice';

  faqs: Faq[] = [
    { question: 'Comment suivre mon colis ?', answer: "Entrez votre numéro de suivi dans la barre de recherche en haut de la page pour suivre votre colis en temps réel." },
    { question: 'Quels sont les délais de livraison ?', answer: 'Les délais de livraison varient selon le service choisi : Express (24h), Standard (2-3 jours), Économique (3-5 jours).' },
    { question: 'Comment contacter le service client ?', answer: 'Notre service client est disponible 24/7 par téléphone au +212 522-123456 ou par email à support@globex.ma.' }
  ];

  selectTab(id: string) {
    this.activeTab = id;
  }

  onSearch(query: string) {
    // For now simply log the query. A real implementation could filter results.
    console.log('Help search:', query);
  }
}
