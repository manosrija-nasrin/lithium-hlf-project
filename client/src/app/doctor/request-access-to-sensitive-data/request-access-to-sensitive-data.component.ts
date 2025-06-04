// screenpatient.component.ts
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

@Component({
	selector: 'app-request-access-to-sensitive-data',
	templateUrl: './request-access-to-sensitive-data.component.html',
	styleUrls: ['./request-access-to-sensitive-data.component.scss']
})
export class RequestAccessToSensitiveDataComponent implements OnInit {
	apiResponse: any;
	healthId!: string;
	doctorId!: string;

	requestForm!: FormGroup;

	constructor(private route: ActivatedRoute, private fb: FormBuilder, private http: HttpClient) { }

	ngOnInit(): void {
		this.route.params.subscribe(params => {
			this.healthId = params['healthId'];
			this.doctorId = params['doctorId'];
		});

		this.requestForm = this.fb.group({
			healthId: [this.healthId, Validators.required],
			doctorId: [this.doctorId, Validators.required],
			reason: ['', Validators.required],
		});
	}

	onSubmit() {
		console.log('Form submitted:', this.requestForm.value);

		const apiUrl = 'http://localhost:3001/doctor/' + this.doctorId + '/request-access/' + this.healthId;

		this.http.post(apiUrl, this.requestForm.value)
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

