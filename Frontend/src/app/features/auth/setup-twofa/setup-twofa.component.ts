import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-setup-twofa',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './setup-twofa.component.html',
  styleUrls: ['./setup-twofa.component.scss']
})
export class SetupTwofaComponent implements OnInit {
  otpauthUrl: string | null = null;
  secret: string | null = null;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.setupTwofa().subscribe(res => {
      this.otpauthUrl = res.otpauth_url;
      this.secret = res.secret;
    });
  }
}
