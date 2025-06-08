import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {
  trackingId = '';
  showSearch = false;
  notificationCount = 0;

  constructor(
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.notificationService.getUnreadCount().subscribe((count) => {
      this.notificationCount = count;
    });
  }

  toggleSearch(): void {
    this.showSearch = !this.showSearch;
  }

  trackFromNavbar(): void {
    const id = this.trackingId.trim();
    if (id) {
      this.router.navigate(['/track', id]);
    }
  }
}
