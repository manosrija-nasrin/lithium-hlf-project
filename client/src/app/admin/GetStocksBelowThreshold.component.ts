// Import necessary modules from Angular
import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-get-stocks-below-threshold',
  template: `
    <div>
      <h2>Stocks Below Threshold</h2>
      <label for="thresholdInput">Enter Threshold:</label>
      <input type="number" id="thresholdInput" [(ngModel)]="threshold" required>
      <button (click)="fetchStocks()">Fetch Stocks</button>

      <div *ngFor="let hospital of stocks">
    <h3>{{ hospital.HospitalName }}</h3>
    <div *ngFor="let bloodGroup of hospital.BloodGroups">
      <p>Blood Group: {{ bloodGroup.BloodGroup }}</p>
      <p>Total Quantity: {{ bloodGroup.TotalQuantity }}</p>
    </div>
    <hr>
  </div>
    </div>
  `,
  styles:[

`div {
  margin: 20px;
}

h2 {
  color: #333;
}

label {
  margin-right: 10px;
  font-weight: bold;
}

input {
  padding: 5px;
  margin-right: 10px;
}

button {
  padding: 8px 12px;
  background-color: #4CAF50;
  color: white;
  border: none;
  cursor: pointer;
}

button:hover {
  background-color: #45a049;
}

div p {
  margin: 5px 0;
}

hr {
  border: 1px solid #ddd;
}`

  ]
})
export class GetStocksBelowThresholdComponent implements OnInit {
  stocks: any[] = [];
  threshold: number | undefined;

  constructor(private http: HttpClient) {}

  ngOnInit() {
  }

  fetchStocks() {
    if (this.threshold === undefined) {
      console.error('Threshold value is required');
      return;
    }

    const apiUrl = `http://localhost:3001/displayStocksBelowThreshold?threshold=${this.threshold}`;

	this.http.get<any[]>(apiUrl).subscribe(
	  (response) => {
        const groupedStocks: { [hospital: string]: any[] } = {};
        response.forEach((stock) => {
          const hospitalName = stock.HospitalName;
          if (!(hospitalName in groupedStocks)) {
            groupedStocks[hospitalName] = [];
          }
          groupedStocks[hospitalName].push(stock);
        });
        this.stocks = Object.keys(groupedStocks).map((hospitalName) => {
          return {
            HospitalName: hospitalName,
            BloodGroups: groupedStocks[hospitalName].map((stock) => {
              return {
                BloodGroup: stock.BloodGroup,
                TotalQuantity: stock.TotalBloodQuantity
              };
            })
          };
        });
	  },
	  (error) => {
	    console.error('Error fetching stocks:', error);
	  }
	);
  }
}

