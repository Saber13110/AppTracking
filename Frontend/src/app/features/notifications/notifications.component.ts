import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { NotificationService, Notification, NotificationPreferences } from '../../core/services/notification.service';
import { showNotification } from '../../shared/services/notification.util';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss']
})
export class NotificationsComponent implements OnInit {
  notifications: Notification[] = [];
  loading = false;
  prefsForm: FormGroup;

  constructor(private notificationService: NotificationService, private fb: FormBuilder) {
    this.prefsForm = this.fb.group({
      email_updates: [true],
      addresses: this.fb.array([this.fb.control('')]),
      preferred_language: ['en'],
      event_settings: this.fb.group({
        delivery: this.fb.group({ email: [true], sms: [false] }),
        exception: this.fb.group({ email: [true], sms: [false] })
      })
    });
  }

  ngOnInit() {
    this.fetchNotifications();
    this.notificationService.getPreferences().subscribe(p => {
      this.prefsForm.patchValue({
        email_updates: p.email_updates,
        preferred_language: p.preferred_language,
        event_settings: p.event_settings || { delivery: { email: true, sms: false }, exception: { email: true, sms: false } }
      });
      this.setAddresses(p.addresses || []);
    });
  }

  setAddresses(addrs: string[]) {
    this.addresses.clear();
    if (!addrs.length) {
      this.addresses.push(this.fb.control(''));
    } else {
      addrs.slice(0, 5).forEach(a => this.addresses.push(this.fb.control(a)));
    }
  }

  get addresses() {
    return this.prefsForm.get('addresses') as FormArray;
  }

  addAddress() {
    if (this.addresses.length < 5) {
      this.addresses.push(this.fb.control(''));
    }
  }

  removeAddress(index: number) {
    if (this.addresses.length > 1) {
      this.addresses.removeAt(index);
    }
  }

  fetchNotifications() {
    this.loading = true;
    this.notificationService.getUnreadNotifications().subscribe({
      next: (notifs) => {
        this.notifications = notifs;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  markAllAsRead() {
    this.notificationService.markAllAsRead().subscribe(() => {
      this.fetchNotifications();
      showNotification('All notifications marked as read', 'success');
    });
  }

  savePrefs() {
    const prefs: NotificationPreferences = this.prefsForm.value;
    prefs.addresses = this.addresses.value.filter((a: string) => a);
    this.notificationService.updatePreferences(prefs).subscribe(() => {
      showNotification('Preferences saved', 'success');
    });
  }
}
