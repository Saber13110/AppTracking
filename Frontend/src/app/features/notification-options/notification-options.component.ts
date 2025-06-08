import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { NotificationService, NotificationPreferences } from '../../core/services/notification.service';
import { showNotification } from '../../shared/show-notification';

@Component({
  selector: 'app-notification-options',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './notification-options.component.html',
  styleUrls: ['./notification-options.component.scss']
})
export class NotificationOptionsComponent implements OnInit {
  form: FormGroup;

  constructor(private fb: FormBuilder, private notifService: NotificationService) {
    this.form = this.fb.group({
      email_updates: [true]
    });
  }

  ngOnInit() {
    this.notifService.getPreferences().subscribe(p => {
      this.form.patchValue(p);
    });
  }

  save() {
    const prefs: NotificationPreferences = this.form.value;
    this.notifService.updatePreferences(prefs).subscribe({
      next: () => {
        showNotification('Preferences saved', 'success');
      },
      error: () => {
        showNotification('Failed to save preferences', 'error');
      }
    });
  }
}
