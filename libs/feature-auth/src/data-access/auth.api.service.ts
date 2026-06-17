//Reception desk pretending to be secyrity system Fake backend system
import { Injectable } from '@angular/core';
import { LoginRequest, LoginResponse } from '../models/login.model';

@Injectable({
  providedIn: 'root'
})
export class AuthApiService {

  constructor() { }

  login(req: LoginRequest): Promise<LoginResponse> {
    // Simulate an API call - replace with actual API implementation
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (req.email === 'admin@erp.com' && req.password === 'admin') {
          resolve({
            user: {
            id: 1,
            name: 'Admin User',
            email: req.email,
            roles: ['admin']
            },
            token: 'fake-jwt-token-123'
          });
        } else {
          reject(new Error('Invalid credentials'));
        }
      }, 1000); //simulate backend delay
    });
  }
}