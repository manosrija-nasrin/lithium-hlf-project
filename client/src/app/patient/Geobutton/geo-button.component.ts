import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-geo-button',
  template: `
    <div>
      <form (ngSubmit)="getLocation()">
        <div class="form-group">
          <label for="bloodGroup">Blood Group:</label>
          <select id="bloodGroup" name="bloodGroup" class="select-blood-group" [(ngModel)]="bloodGroup" required>
            <option value="" disabled selected>Select a blood group</option>
            <option *ngFor="let group of bloodGroups" [value]="group">{{ group }}</option>
          </select>
        </div>
        <button type="submit" class="geo-btn" [disabled]="!bloodGroup || loading">Get nearest hospitals</button>
      </form>
      <div *ngIf="loading" class="loading-message">Getting all nearest hospitals. Please wait for some time...</div>
    </div>
    
    <div *ngIf="responseData && responseData.length > 0" class="response-container">
      <h3>Nearest hospitals from your current location:</h3>
      <ul>
        <li *ngFor="let hospital of responseData">
          <div>
            <strong>Hospital Name: </strong> {{ hospital.HospitalName }}
          </div>
          <div>
            <strong>Address: </strong> {{ hospital.Address }}
          </div>
          <div>
            <strong>Total Quantity: </strong> {{ hospital.TotalQuantity }}
          </div>
        </li>
      </ul>
    </div>
    <div *ngIf="emptyResponse" class="empty-response-message">No hospitals found nearby.</div>
  `,
  styles: [`
    .geo-btn {
      background-color: #4CAF50;
      color: white;
      margin-top: 20px;
      padding: 10px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }

    .geo-btn:hover {
      background-color: #45a049;
    }

    .response-container {
      margin-top: 20px;
    }

    .form-group {
      margin-bottom: 10px;
    }
    
    .select-blood-group {
      padding: 8px;
      margin: 5px 0;
      border: 1px solid #ccc;
      border-radius: 4px;
      width: 100%; 
      box-sizing: border-box;
    
    .loading-message, .empty-response-message {
      margin-top: 10px;
      font-style: italic;
    }
  `]
})
export class GeoButtonComponent {
  responseData: any[] = [];
  bloodGroup!: string;
  bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  loading = false;
  emptyResponse = false;

  private apiUrl = 'http://localhost:3001/geo';

  constructor(private http: HttpClient) {}

  getLocation() {
    this.responseData = [];
    this.loading = true;
    this.emptyResponse = false;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;
	  const bloodGroup = encodeURIComponent(this.bloodGroup);
          const url = `${this.apiUrl}/${latitude}/${longitude}?bloodGroup=${bloodGroup}`;
          this.http.get<any[]>(url).subscribe(
            (response: any[]) => {
              console.log('Coordinates sent successfully:', response);
              this.responseData = response;
              this.loading = false;
              this.emptyResponse = response.length === 0;
            },
            (error) => {
              console.error('Error sending coordinates:', error);
              this.loading = false;
            }
          );
        },
        (error) => {
          console.error('Error getting location:', error);
          this.loading = false;
        }
      );
    } else {
      console.error('Geolocation is not supported by this browser.');
      this.loading = false;
    }
  }
}

