import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';

@Component({
  selector: 'app-geo-button',
  templateUrl: './geo-button.component.html',
  styleUrls: ['./geo-button.component.scss']
})
export class GeoButtonComponent {
  responseData: any[] = [];
  bloodGroup!: string;
  bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  loading = false;
  emptyResponse = false;

  private apiUrl = 'http://localhost:3001/geo';

  constructor(private http: HttpClient) { }

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

