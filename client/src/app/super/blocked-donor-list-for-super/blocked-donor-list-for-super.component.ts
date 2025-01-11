import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { DisplayVal, DonorBlocked } from '../../donor/donor';
import { SuperService } from '../super.service';

@Component({
  selector: 'blocked-donor-list-for-super',
  templateUrl: './blocked-donor-list-for-super.component.html',
  styleUrls: ['./blocked-donor-list-for-super.component.scss']
})
export class BlockedDonorListForSuperComponent implements OnInit {
  public superId: string;
  public hospId: string;
  public donorRecordsObs$?: Observable<Array<DonorBlocked>>;
  public headerNames = [
    new DisplayVal(DonorBlocked.prototype.donorId, 'Donor Id'),
    new DisplayVal(DonorBlocked.prototype.firstName, 'First Name'),
    new DisplayVal(DonorBlocked.prototype.lastName, 'Last Name'),
    new DisplayVal(DonorBlocked.prototype.blockedDate, 'Blocked On'),
    new DisplayVal(DonorBlocked.prototype.blockedReason, 'Reason'),

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
    this.donorRecordsObs$ = this.superService.getBlockedDonors(this.hospId, this.superId);
  }
}
