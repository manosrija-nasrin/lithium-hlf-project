// screenpatient.component.ts
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

@Component({
	selector: 'app-screenpatient',
	templateUrl: './screen-patient.component.html',
	styleUrls: ['./screen-patient.component.scss']
})
export class TechnicianScreenPatientComponent implements OnInit {
	apiResponse: any;
	technicianId!: string;

	screeningForm!: FormGroup;

	constructor(private route: ActivatedRoute, private fb: FormBuilder, private http: HttpClient) { }

	ngOnInit(): void {
		this.route.params.subscribe(params => {
			this.technicianId = params['technicianId'];
		});

		this.screeningForm = this.fb.group({
			healthId: ['', Validators.required],
			technicianId: [this.technicianId, Validators.required],
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

		const apiUrl = 'http://localhost:3001/technician/screenpatient/' + this.technicianId;

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

