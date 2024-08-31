import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-receiver',
  template: `
    <div class="container">
      <button class="btn" (click)="redirectToNearestHospitals()">Find Nearest Hospitals to Your Current Location</button>
    </div>
  `,
  styles: [`
    .container {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
    }
    .btn {
      background-color: #4CAF50;
      border: none;
      color: white;
      padding: 15px 32px;
      text-align: center;
      text-decoration: none;
      display: inline-block;
      font-size: 16px;
      margin: 4px 2px;
      cursor: pointer;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .btn:hover {
      background-color: #45a049;
    }
  `]
})
export class ReceiverComponent {

  constructor(private router: Router) { }

  redirectToNearestHospitals() {
    this.router.navigate(['/nearest-hospitals']);
  }
}

