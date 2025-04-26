// screendonor.component.ts
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-screendonor',
  template: `
    <div class="container">
    <div *ngIf="apiResponse">
    <ng-container *ngIf="apiResponse.success; else failureBlock">
    <h4 [style.color]="'green'">Screening successful !!</h4>
    </ng-container>
    <ng-template #failureBlock>
    <h4 [style.color]="'red'">Screening Failed !!</h4>
    </ng-template>
    </div>
      <h2>Screen Donor</h2>

      <form [formGroup]="screeningForm" (ngSubmit)="onSubmit()">
        <div class="form-group">
          <label for="donorId">Donor ID:</label>
          <input type="text" id="donorId" formControlName="donorId" [attr.disabled]="true">
        </div>

        <div class="form-group">
          <label for="doctorId">Doctor ID:</label>
          <input type="text" id="doctorId" formControlName="doctorId" [attr.disabled]="true">
        </div>

        <div class="form-group">
          <label for="dob">DOB:</label>
          <input type="text" id="dob" formControlName="dob" [attr.disabled]="true">
        </div>

        <div class="form-group">
          <label for="pulse">Pulse (per minute): </label>
          <input type="text" id="pulse" formControlName="pulse" required>
        </div>

        <div class="form-group">
          <label for="systolic">Systolic Pressure (mmHg):</label>
          <input type="text" id="systolic" formControlName="systolic" required>
        </div>

        <div class="form-group">
          <label for="diastolic">Diastolic Pressure (mmHg):</label>
          <input type="text" id="diastolic" formControlName="diastolic" required>
        </div>

        <div class="form-group">
          <label for="haemoglobin">Haemoglobin Level (in g/dl):</label>
          <input type="text" id="haemoglobin" formControlName="haemoglobin" required>
        </div>
        <div class="form-group">
          <label for="weight">Weight:</label>
          <input type="text" id="weight" formControlName="weight" required>
        </div>

        <div class="form-group">
          <label for="anaemia">Anaemia:</label>
          <select formControlName="anaemia">
            <option value="true">Chronic</option>
            <option value="temp-defer">Under Investigation</option>
            <option value="false">Not present</option>
          </select>
        </div>

        <div class="form-group">
          <label for="haemophiliaA">Haemophilia A:</label>
          <select formControlName="haemophiliaA">
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </div>

        <div class="form-group">
          <label for="haemophiliaB">Haemophilia B:</label>
          <select formControlName="haemophiliaB">
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </div>

        <div class="form-group">
          <label for="cardiovascular">Cardiovascular Disease:</label>
          <select formControlName="cardiovascular">
            <option value="true">Symptomatic</option>
            <option value="false">Asymptomatic</option>
          </select>
        </div>

        <div class="form-group">
          <label for="hypertension">Hypertension:</label>
          <select formControlName="hypertension">
            <option value="true">Hypertensive heart/renal disease</option>
            <option value="false">Recently started taking medication</option>
            <option value="false">Not present</option>
          </select>
        </div>

        <div class="form-group">
          <label for="asthma">Asthma:</label>
          <select formControlName="asthma">
            <option value="true">Chronic Symptomatic</option>
            <option value="temp-defer">Asthma with acute exacerbation</option>
            <option value="false">Asymptomatic</option>
          </select>
        </div>

        <button type="submit" [disabled]="screeningForm.invalid">Submit</button>
      </form>
    </div>
    
  `,
  styles: [`
    .container {
      max-width: 400px;
      margin: 0 auto;
      padding: 20px;
      border: 1px solid #ccc;
      border-radius: 5px;
    }

    .form-group {
      margin-bottom: 15px;
    }

    label {
      display: block;
      margin-bottom: 5px;
    }

    input {
      width: 100%;
      padding: 8px;
      box-sizing: border-box;
    }

    button {
      padding: 10px;
      background-color: #007BFF;
      color: #fff;
      border: none;
      border-radius: 5px;
      cursor: pointer;
    }

    button:disabled {
      background-color: #ccc;
      cursor: not-allowed;
    }
    
    select {
      width: 100%;
      padding: 10px;
      border: 1px solid #ccc;
      border-radius: 4px;
      box-sizing: border-box;
      font-size: 14px;
    }
  `]
})
export class ScreenDonorComponent implements OnInit {
  apiResponse: any;
  donorId!: string;
  doctorId!: string;
  dob!: string;

  screeningForm!: FormGroup;

  constructor(private route: ActivatedRoute, private fb: FormBuilder, private http: HttpClient) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.donorId = params['donorId'];
      this.doctorId = params['doctorId'];
      this.dob = params['dob'];
    });

    this.screeningForm = this.fb.group({
      donorId: [this.donorId, Validators.required],
      doctorId: [this.doctorId, Validators.required],
      dob: [this.dob, Validators.required],
      pulse: ['', Validators.required],
      systolic: ['', Validators.required],
      diastolic: ['', Validators.required],
      haemoglobin: ['', Validators.required],
      anaemia: ['', Validators.required],
      weight: ['', Validators.required],
      haemophiliaA: ['', Validators.required],
      haemophiliaB: ['', Validators.required],
      cardiovascular: ['', Validators.required],
      hypertension: ['', Validators.required],
      asthma: ['', Validators.required],
    });
  }

  onSubmit() {
    console.log('Form submitted:', this.screeningForm.value);

    const apiUrl = 'http://localhost:3001/doctor/screendonor/' + this.screeningForm.value.doctorId;

    this.http.post(apiUrl, this.screeningForm.value)
      .subscribe(
        (response) => {
          console.log('API Response:', response);
          this.apiResponse = response;
        },
        (error) => {
          console.error('API Error:', error);
          this.apiResponse = error;
        }
      );
  }
}

