// patient-status-check.component.ts

import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../core/auth/auth.service';

@Component({
	selector: 'app-check-patient-status',
	template: `
	<div class="patient-status-check-form-container">
	  <form [formGroup]="patientStatusCheckForm" (ngSubmit)="submitForm()">
		<div class="form-group">
		<h3>Check Patient Health Status</h3>
		  <label for="healthId">Health ID:</label>
		  <input type="text" id="healthId" formControlName="healthId" minlength='12' maxlength='12' required />
		</div>
		<button type="submit" [disabled]="patientStatusCheckForm.invalid">Submit</button>
	  </form>
	  <div *ngIf="responseData !== undefined && responseData.status !== undefined" class="response-container">
		<p><strong>Patient Status:</strong> {{ responseData.message }}</p>
	  </div>
	</div>
  `,
	styles: [`
	.patient-status-check-form-container {
	  max-width: 400px;
	  margin: auto;
	  padding: 20px;
	  border: 1px solid #eee;
	  border-radius: 8px;
	  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
	}

	.patient-status-check-table th {
	  font-size: 12px; 
	  font-weight: normal; 
	  padding: 8px; 
	  text-align: left; 
	 }

	.patient-status-check-table td {
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

export class PatientStatusCheckComponent implements OnInit {
	patientStatusCheckForm!: FormGroup;
	responseData: any;

	constructor(private fb: FormBuilder, private http: HttpClient, private readonly authService: AuthService) { }

	ngOnInit(): void {
		this.patientStatusCheckForm = this.fb.group({
			healthId: ['', Validators.required]
		});
	}

	submitForm(): void {
		if (this.patientStatusCheckForm.valid) {
			const formData = this.patientStatusCheckForm.value;
			console.log(formData);
			const userRole = this.authService.getRole();
			const apiEndpoint = `http://localhost:3001/${userRole}/checkpatientstatus`;

			this.http.get(apiEndpoint, { params: formData }).subscribe(
				(response) => {
					console.log('Post request successful', response);
					this.responseData = response;
				},
				(error) => {
					console.error('Error in post request', error);
					this.responseData = `Patient not found. Please check again!!`;
				}
			);
		}
	}
}

