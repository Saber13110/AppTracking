import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-tracking-options',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './tracking-options.component.html',
  styleUrls: ['./tracking-options.component.scss']
})
export class TrackingOptionsComponent {}
