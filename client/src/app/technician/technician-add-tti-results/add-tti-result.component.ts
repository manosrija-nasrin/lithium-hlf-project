import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

@Component({
	selector: 'app-crossmatch-blood',
	templateUrl: './add-tti-result.component.html',
	styleUrls: ['./add-tti-result.component.scss']
})
export class AddTtiResultComponent implements OnInit {
	apiResponse!: any;
	ttiResultForm!: FormGroup;
	technicianId!: string;
	healthId!: string;
	datetime!: string;

	constructor(private formBuilder: FormBuilder, private route: ActivatedRoute, private http: HttpClient) { }

	ngOnInit() {
		this.route.params.subscribe(params => {
			this.technicianId = params['technicianId'];
		});

		this.ttiResultForm = this.formBuilder.group({
			technicianId: [this.technicianId, Validators.required],
			healthId: [this.healthId, [Validators.required, Validators.minLength(12), Validators.maxLength(12)]],
			datetime: [new Date().toISOString(), Validators.required],
			//slipNumber: ['', Validators.required],
			malaria: [''],
			syphilis: [''],
			hiv: [''],
			hepatitisB: [''],
			hepatitisC: [''],
		});
	}

	submitForm() {
		if (this.ttiResultForm.valid) {
			console.log('Form submitted:', this.ttiResultForm.value);

			const apiUrl = 'http://localhost:3001/technician/addttiresult';
			this.http.post(apiUrl, this.ttiResultForm.value)
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
}

