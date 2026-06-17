import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { Button } from 'primeng/button';
import { Card } from 'primeng/card';
import { Message } from 'primeng/message';
import { Skeleton } from 'primeng/skeleton';

import { DashboardFacade } from '../../facades/dashboard.facade';

@Component({
  selector: 'daqiq-dashboard-page',
  imports: [Button, Card, Message, Skeleton],
  providers: [DashboardFacade],
  templateUrl: './dashboard.page.html',
  styleUrl: './dashboard.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardPage implements OnInit {
  protected readonly facade = inject(DashboardFacade);
  protected readonly skeletonItems = [1, 2, 3, 4] as const;

  ngOnInit(): void {
    this.facade.load();
  }

  protected reload(): void {
    this.facade.load();
  }

  protected getTrendIcon(direction: 'up' | 'down' | 'neutral'): string {
    if (direction === 'up') {
      return 'pi pi-arrow-up';
    }

    if (direction === 'down') {
      return 'pi pi-arrow-down';
    }

    return 'pi pi-minus';
  }
}
