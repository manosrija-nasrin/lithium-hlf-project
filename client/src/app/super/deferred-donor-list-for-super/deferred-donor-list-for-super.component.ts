import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { DisplayVal, DonorDeferred } from '../../donor/donor';
import { SuperService } from '../super.service';

@Component({
  selector: 'deferred-donor-list-for-super',
  templateUrl: './deferred-donor-list-for-super.component.html',
  styleUrls: ['./deferred-donor-list-for-super.component.scss']
})
export class DeferredDonorListForSuperComponent implements OnInit {
  public superId: string;
  public hospId: string;
  public donorRecordsObs$?: Observable<Array<DonorDeferred>>;
  public headerNames = [
    new DisplayVal(DonorDeferred.prototype.donorId, 'Donor Id'),
    new DisplayVal(DonorDeferred.prototype.firstName, 'First Name'),
    new DisplayVal(DonorDeferred.prototype.lastName, 'Last Name'),
    new DisplayVal(DonorDeferred.prototype.deferredDate, 'Deferred On'),
    new DisplayVal(DonorDeferred.prototype.deferredReason, 'Reason'),

  ];

  constructor(
    private readonly route: ActivatedRoute,
    private readonly superService: SuperService
  ) {
    this.superId = '';
    this.hospId = '';
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.superId = params['superId'] || '';
      this.hospId = this.superId.slice(4, 5);
      this.refresh();
    });
  }

  public refresh(): void {
    this.donorRecordsObs$ = this.superService.getDeferredDonors(this.hospId, this.superId);
  }
}
