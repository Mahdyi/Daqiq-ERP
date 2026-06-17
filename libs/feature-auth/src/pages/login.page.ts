import {Component, signal, ChangeDetectionStrategy} from '@angular/core';
import { AuthFacade } from '../facades/auth.facade';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.page.html',
  styleUrl:'./login.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginPage {
    email = signal('');
    password = signal('');

    constructor(public auth: AuthFacade) {}

      async login() {
        await this.auth.login({
            email: this.email(),
            password: this.password()
        });
  
    }
}