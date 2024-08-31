// read-receiver-blood-bag.component.ts

import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-read-allocated-blood-bag',
  template: `
    <div class="blood-bag-form-container">
      <form [formGroup]="bloodBagForm" (ngSubmit)="submitForm()">
        <div class="form-group">
          <label for="slipNumber">Slip Number:</label>
          <input type="text" id="slipNumber" formControlName="slipNumber" required />
        </div>
        <button type="submit" [disabled]="bloodBagForm.invalid">Submit</button>
      </form>
      <div *ngIf="responseData" class="response-container">
        <h3>Blood Bags selected for the above Slip Number:</h3>
        <p><strong>Bags Left for cross match:</strong> {{ responseData.left }}</p>
        <p><strong>LT Approval:</strong> {{ responseData.LTapproval }}</p>
        <p><strong>MOC Approval:</strong> {{ responseData.MOCapproval }}</p>
        <p><strong>Status:</strong> {{ responseData.status }}</p>
        <table class="blood-bag-table">
          <thead>
            <tr>
              <th>Unit No - Segment No</th>
              <th>Is Cross-Matched</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let bag of responseData.bags">
              <td>{{ bag.key }}</td>
              <td>{{ bag.value }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
   styles: [`
    .blood-bag-form-container {
      max-width: 400px;
      margin: auto;
      padding: 20px;
      border: 1px solid #eee;
      border-radius: 8px;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    }

    .blood-bag-table th {
      font-size: 12px; 
      font-weight: normal; 
      padding: 8px; 
      text-align: left; 
     }

    .blood-bag-table td {
      padding: 8px; 
      border-top: 1px solid #ddd;
     }
     
    .form-group {
      margin-bottom: 15px;
    }

    label {
      display: block;
      font-weight: bold;
    }

    input, select {
      width: 100%;
      padding: 8px;
      box-sizing: border-box;
    }

    button {
      background-color: #4CAF50;
      color: white;
      padding: 12px 20px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 16px;
      transition: background-color 0.3s;
    }

    button:disabled {
      background-color: #ddd;
      cursor: not-allowed;
    }

    button:hover:not([disabled]) {
      background-color: #45a049;
    }

    .response-container {
      margin-top: 20px;
      border-top: 1px solid #eee;
      padding-top: 20px;
    }
  `],
})

export class ReadAllocatedBloodBagComponent implements OnInit {
  
  bloodBagForm!: FormGroup;
  responseData: any;

  constructor(private fb: FormBuilder, private http: HttpClient) {}

  ngOnInit(): void {
    this.bloodBagForm = this.fb.group({
      slipNumber: ['', Validators.required]
    });
  }

  submitForm(): void {
    if (this.bloodBagForm.valid) {
      const formData = this.bloodBagForm.value;
      console.log(formData);
      const apiEndpoint = 'http://localhost:3001/technician/readallocatedbloodbag';

      this.http.post<any>(apiEndpoint, formData).subscribe(
        (response) => {
          console.log('Post request successful', response);
          this.responseData = {
            left: response.left,
            LTapproval: response.LTapproval,
            MOCapproval: response.MOCapproval,
            status: response.status,
            bags: Object.entries(response.bags).map(([key, value]) => ({ key, value }))
          };
        },
        (error) => {
          console.error('Error in post request', error);
          this.responseData = `Blood Bag not found. Please check again!!`;
        }
      );
    }
  }
}

