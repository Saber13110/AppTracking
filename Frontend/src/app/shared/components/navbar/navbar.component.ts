import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {
  showSearch = false;
  notificationCount = 0;

  ngOnInit(): void {
    // TODO: Intégrer NotificationService pour récupérer le vrai count
    this.notificationCount = 3; // simulation temporaire
  }

  toggleSearch(): void {
    this.showSearch = !this.showSearch;
  }
}
