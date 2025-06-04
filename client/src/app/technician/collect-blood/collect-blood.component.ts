// blood-collection.component.ts
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

@Component({
	selector: 'app-blood-collection-technician',
	templateUrl: './collect-blood.component.html',
	styleUrls: ['./collect-blood.component.scss'],
})
export class TechnicianBloodCollectionComponent implements OnInit {
	bloodCollectionForm!: FormGroup;
	resultMessage!: string;
	technicianId!: string;

	constructor(
		private formBuilder: FormBuilder,
		private http: HttpClient,
		private route: ActivatedRoute
	) { }

	ngOnInit() {
		this.route.params.subscribe(params => {
			this.technicianId = params['technicianId'];

			this.bloodCollectionForm = this.formBuilder.group({
				technicianId: [this.technicianId, Validators.required],
				healthId: ['', Validators.required],
				bloodBagUnitNo: ['', Validators.required],
				bloodBagSegmentNo: ['', Validators.required],
				quantity: ['', Validators.required],
			});
		});
	}

	submitForm() {
		console.log('Form submitted:', this.bloodCollectionForm.value);

		const formData = this.bloodCollectionForm.value;

		this.http.post('http://localhost:3001/technician/blood-collect', formData)
			.subscribe(
				(response) => {
					console.log('API Response:', response);
					this.resultMessage = 'Blood collection successful';
				},
				(error) => {
					console.error('API Error:', error);
					this.resultMessage = 'Blood collection failed';
				}
			);
	}
}

