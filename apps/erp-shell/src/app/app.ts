import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { GlobalFeedbackOutletComponent } from '@daqiq/ui';

@Component({
  selector: 'app-root',
  imports: [GlobalFeedbackOutletComponent, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App {
}
