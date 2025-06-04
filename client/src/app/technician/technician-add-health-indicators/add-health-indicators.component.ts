// screenpatient.component.ts
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

@Component({
	selector: 'app-add-health-indicators',
	templateUrl: `./add-health-indicators.component.html`,
	styleUrls: ['./add-health-indicators.component.scss']
})
export class AddHealthIndicatorResultsComponent implements OnInit {
	apiResponse: any;
	technicianId!: string;

	healthIndicatorForm!: FormGroup;

	constructor(private route: ActivatedRoute, private fb: FormBuilder, private http: HttpClient) { }

	ngOnInit(): void {
		this.route.params.subscribe(params => {
			this.technicianId = params['technicianId'];
		});

		this.healthIndicatorForm = this.fb.group({
			healthId: ['', [Validators.required, Validators.minLength(12), Validators.maxLength(12)]],
			technicianId: [this.technicianId, Validators.required],
			pulse: ['', Validators.required],
			systolic: ['', Validators.required],
			diastolic: ['', Validators.required],
			weight: ['', Validators.required],
			haemoglobin: [''],
			anaemia: [''],
			haemophiliaA: [''],
			haemophiliaB: [''],
			cardiovascular: [''],
			hypertension: [''],
			asthma: [''],
		});
	}

	onSubmit() {
		console.log('Form submitted:', this.healthIndicatorForm.value);

		const apiUrl = 'http://localhost:3001/technician/' + this.healthIndicatorForm.value.technicianId + '/addhealthreport';

		this.http.post(apiUrl, this.healthIndicatorForm.value)
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

