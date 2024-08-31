import { Component, OnInit, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class LTapprovalService {
  private apiUrl = 'http://localhost:3001/technician/LTapproval';  

  constructor(private http: HttpClient) {}

  getApprovalData(technicianId: string): Observable<any> {
    const url = `${this.apiUrl}?technicianId=${technicianId}`;
    console.log(`Fetching approval data for technician ID: ${technicianId}`); 
    return this.http.get<any>(url).pipe(
      catchError(this.handleError)
    );
  }

  sendPostRequest(slipNumber: string, technicianId: string): Observable<any> {
    const postUrl = 'http://localhost:3001/technician/sendLTapproval'; 
    return this.http.post<any>(postUrl, { slipNumber, technicianId }).pipe(
      catchError(this.handleError),
      tap(() => {
        location.reload();
      })
    );
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
  selector: 'app-ltapproval',
  template: `
    <div *ngIf="loading" class="loader"></div>
    <table *ngIf="!loading && approvalData.length > 0; else noData">
      <tbody>
       <tr *ngFor="let result of approvalData" class="card">
          <td class="card-header"><b>Requisition Slip Number:</b> {{ result.slipNumber }}</td>
          <b>Receiver Details:</b><br>
            <div><b>Name:</b> {{ result.Name }}</div>
            <div><b>Address:</b> {{ result.Address }}</div>
            <div><b>Aadhar:</b> {{ result.Aadhar }}</div>
            <div><b>BloodGroup:</b> {{ result.BloodGroup }}</div>
            <div><b>Quantity:</b> {{ result.Quantity}}</div>
            <div><b>DateOfRegistration:</b> {{ result.DateOfRegistration}}</div>
            <div><b>Cross-match compatibility:</b> true</div>
            <div><b>Indication of transfusion:</b> true</div>
          <td class="card-body"><b>Assigned Blood Bags:</b><br>Unit No-Segment No<br>
            <ul>
              <li *ngFor="let bag of result.Bags | keyvalue">{{ bag.key }} - Crossmatched by: {{ bag.value }}</li>
            </ul>
          </td>
          <td class="button-container"><button (click)="sendPostRequest(result.slipNumber)">Approve</button></td>
        </tr>
      </tbody>
    </table>
    <ng-template #noData>
      <h2 *ngIf="!loading">No pending approvals.</h2>
    </ng-template>
  `,
  styles: [`
.loader {
  border: 16px solid #f3f3f3;
  border-radius: 50%;
  border-top: 16px solid #4CAF50;
  width: 120px;
  height: 120px;
  animation: spin 2s linear infinite;
  position: fixed;
  top: 45%;
  left: 45%;
  transform: translate(-50%, -50%);
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}


    table {
      width: 100%;
      border-spacing: 0;
    }

    .card {
      background-color: #ffffff;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
      border-radius: 8px;
      margin-bottom: 16px;
    }

    .card-header {
      padding: 12px;
      background-color: #f0f0f0;
      border-bottom: 1px solid #ddd;
      border-radius: 8px 8px 0 0;
    }

    .card-body {
      padding: 12px;
    }

    .card-body ul {
      margin: 0;
      padding: 0;
    }

    .card-body li {
      list-style-type: none;
      margin-bottom: 8px;
    }

    .button-container {
      text-align: right;
      padding: 12px;
    }

    th, td {
      padding: 8px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }

    button {
      padding: 5px 10px;
      cursor: pointer;
      background-color: #4CAF50;
      color: white;
      border: none;
      border-radius: 4px;
    }

    button:hover {
      background-color: #45a049;
    }
  `]
})
export class LTapprovalComponent implements OnInit {
  approvalData!: any[];
  errorMessage!: string;
  technicianId!: string;
  loading: boolean = true;

  constructor(
    private ltapprovalService: LTapprovalService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.technicianId = params['technicianId'];
      this.loadApprovalData();
    });
  }

  loadApprovalData(): void {
    this.loading = true;
    this.ltapprovalService.getApprovalData(this.technicianId).subscribe(
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

  sendPostRequest(slipNumber: string): void {
    this.ltapprovalService.sendPostRequest(slipNumber, this.technicianId).subscribe(
      response => {
        console.log('Post request sent successfully');
      },
      error => {
        console.error('Error sending post request:', error);
      }
    );
  }
}

