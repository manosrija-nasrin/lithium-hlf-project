import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-blood-request',
  template: `
    <div class="blood-request-form-container">
      <div *ngIf="apiResponse" class="api-response">
        <ng-container *ngIf="apiResponse.success; else failureBlock">
          <h4 [style.color]="'green'">{{ apiResponse.message }}</h4>
        </ng-container>
        <ng-template #failureBlock>
          <h4 [style.color]="'red'">{{ apiResponse.message }}</h4>
        </ng-template>
      </div>
      <form [formGroup]="bloodRequestForm" (submit)="submitForm()">
        <div class="form-group">
          <label for="technicianId">Technician ID:</label>
          <input type="text" id="technicianId" formControlName="technicianId" [attr.disabled]="true" />
        </div>
        
        <div class="form-group">
          <label for="slipNumber">Slip Number:</label>
          <input type="text" id="slipNumber" formControlName="slipNumber" required />
        </div>
        
        <div class="form-group">
          <label for="receiverAadhar">Receiver Aadhar:</label>
          <input type="text" id="receiverAadhar" formControlName="receiverAadhar" required />
        </div>
        
        <div class="form-group">
          <label for="receiverName">Receiver Name:</label>
          <input type="text" id="receiverName" formControlName="receiverName" required />
        </div>
        
        <div class="form-group">
          <label for="receiverAddress">Receiver Address:</label>
          <input type="text" id="receiverAddress" formControlName="receiverAddress" required />
        </div>
        
        <div class="form-group">
          <label for="bloodGroup">Blood Group:</label>
          <select id="bloodGroup" formControlName="bloodGroup" required>
            <option value="" disabled selected>Select Blood Group</option>
            <option value="A+">A+</option>
            <option value="A-">A-</option>
            <option value="B+">B+</option>
            <option value="B-">B-</option>
            <option value="AB+">AB+</option>
            <option value="AB-">AB-</option>
            <option value="O+">O+</option>
            <option value="O-">O-</option>
          </select>
        </div>

        <div class="form-group">
          <label for="quantity">Quantity(ml):</label>
          <input type="number" id="quantity" formControlName="quantity" required />
        </div>

        <div class="button-container">
          <button type="submit" [disabled]="bloodRequestForm.invalid">Submit</button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .blood-request-form-container {
      max-width: 400px;
      margin: auto;
      padding: 20px;
      border: 1px solid #eee;
      border-radius: 8px;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    }

    .form-group {
      margin-bottom: 20px;
    }

    label {
      display: block;
      font-weight: bold;
      margin-bottom: 8px;
    }

    input {
      width: 100%;
      padding: 10px;
      border: 1px solid #ccc;
      border-radius: 4px;
      box-sizing: border-box;
      font-size: 14px;
    }

    .button-container {
      display: flex;
      justify-content: flex-start;
      align-items: center;
      margin-top: 20px;
    }

    select {
      width: 100%;
      padding: 8px;
      border: 1px solid #ccc;
      border-radius: 4px;
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

    .api-response {
      margin-top: 20px;
    }

    .api-response h4 {
      font-size: 18px;
      margin-bottom: 10px;
    }
  `]
})
export class BloodRequestComponent implements OnInit {
  apiResponse!: any;
  bloodRequestForm!: FormGroup;
  technicianId!: string;

  constructor(
    private formBuilder: FormBuilder,
    private http: HttpClient,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.bloodRequestForm = this.formBuilder.group({
      technicianId: [{ value: '', disabled: true }, Validators.required],
      slipNumber: ['', Validators.required],
      receiverAadhar: ['', Validators.required],
      receiverName: ['', Validators.required],
      receiverAddress: ['', Validators.required],
      bloodGroup: ['', Validators.required],
      quantity: ['', Validators.required]
    });
    
    this.route.params.subscribe(params => {
      this.technicianId = params['technicianId'];
      this.bloodRequestForm.controls['technicianId'].setValue(this.technicianId);
    });
  }

  submitForm() {
    if (this.bloodRequestForm.valid) {
      const formValue = { ...this.bloodRequestForm.getRawValue(), technicianId: this.technicianId };
      console.log('Form submitted:', formValue);
    
      const apiUrl = 'http://localhost:3001/technician/bloodrequest';

      this.http.post(apiUrl, formValue).subscribe(
  (response: any) => {
    console.log('API Response:', response);
    if (response && response.message === "Insufficient blood available.") {
      this.apiResponse = { success: false, message: response.message };
    } else {
      this.apiResponse = { success: true, message: 'Blood Request submitted successfully!' };
    }
  },
  (error) => {
    console.error('API Error:', error);
    this.apiResponse = { success: false, message: error?.message || 'Blood Request submission failed!' };
  }
);

    }
  }
}

