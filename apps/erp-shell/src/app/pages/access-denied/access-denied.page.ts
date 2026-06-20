import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonDirective } from 'primeng/button';
import { Card } from 'primeng/card';
import { Message } from 'primeng/message';

@Component({
  selector: 'app-access-denied-page',
  imports: [ButtonDirective, Card, Message, RouterLink],
  templateUrl: './access-denied.page.html',
  styleUrl: './access-denied.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AccessDeniedPage {}
