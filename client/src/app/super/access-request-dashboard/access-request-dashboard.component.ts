import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, Injectable, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

// Service
@Injectable({
	providedIn: 'root'
})
export class RequestApprovalService {
	private apiUrl = 'http://localhost:3001/super/request-approval';  // Replace with your actual API endpoint

	constructor(private http: HttpClient) { }

	getApprovalData(superId: string): Observable<any> {
		const url = `${this.apiUrl}?superId=${superId}`;
		console.log(`Fetching approval data for super ID: ${superId}`); // Debug log
		return this.http.get<any>(url).pipe(
			catchError(this.handleError)
		);
	}

	sendPostRequest(requestNumber: string, superId: string): Observable<any> {
		const postUrl = 'http://localhost:3001/super/request-approval'; // Replace with your actual POST endpoint
		// return this.http.post<any>(postUrl, { requestNumber, superId }).pipe(
		// 	catchError(this.handleError),
		// 	tap(() => {
		// 		// Reload the page after the request completes
		// 		location.reload();
		// 	})
		// );
		console.log("Approve Request");
	}

	private handleError(error: HttpErrorResponse) {
		let errorMessage = 'Unknown error!';
		if (error.error instanceof ErrorEvent) {
			errorMessage = `Error: ${error.error.message}`;
		} else {
			errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
		}
		return throwError(errorMessage);
	}
}

// Component
@Component({
	selector: 'app-mocapproval',
	templateUrl: './access-request-dashboard.component.html',
	styleUrls: ['./access-request-dashboard.component.scss']
})
export class AccessRequestApprovalComponent implements OnInit {
	approvalData!: any[];
	errorMessage!: string;
	superId!: string;
	loading: boolean = true;

	constructor(
		private requestApprovalService: RequestApprovalService,
		private route: ActivatedRoute
	) { }

	ngOnInit(): void {
		this.route.params.subscribe(params => {
			this.superId = params['superId'];
			this.loadApprovalData();
		});
	}

	loadApprovalData(): void {
		this.loading = true;
		this.requestApprovalService.getApprovalData(this.superId).subscribe(
			data => {
				this.approvalData = data;
				this.loading = false;
			},
			error => {
				this.errorMessage = error;
				this.loading = false;
			}
		);
	}

	sendPostRequest(requestNumber: string): void {
		this.requestApprovalService.sendPostRequest(requestNumber, this.superId).subscribe(
			response => {
				console.log('Post request sent successfully');
			},
			error => {
				console.error('Error sending post request:', error);
			}
		);
	}
}

