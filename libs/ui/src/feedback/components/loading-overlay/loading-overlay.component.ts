import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ProgressSpinner } from 'primeng/progressspinner';

import { LoadingService } from '../../services/loading.service';

@Component({
  selector: 'daqiq-loading-overlay',
  imports: [ProgressSpinner],
  templateUrl: './loading-overlay.component.html',
  styleUrl: './loading-overlay.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoadingOverlayComponent {
  protected readonly loading = inject(LoadingService);
}
