import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { Toast } from 'primeng/toast';

import { LoadingOverlayComponent } from '../loading-overlay/loading-overlay.component';

@Component({
  selector: 'daqiq-global-feedback-outlet',
  imports: [ConfirmDialog, LoadingOverlayComponent, Toast],
  templateUrl: './global-feedback-outlet.component.html',
  styleUrl: './global-feedback-outlet.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GlobalFeedbackOutletComponent {}
