import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';

import { Observable, Subscription } from 'rxjs';

import { AuthService } from '../core/auth/auth.service';
import { RoleEnum } from '../utils';
import { DonationDetails, DonationHistory, MedicalHistory, PatientViewRecord } from './patient';
import { PatientService } from './patient.service';


@Component({
  selector: 'app-patient',
  templateUrl: './patient.component.html',
  styleUrls: ['./patient.component.scss']
})
export class PatientComponent implements OnInit, OnDestroy {
  public healthID: any;
  public doctorID: any;
  public username: string;
  public sensitiveMedicalHistory: MedicalHistory | null;
  public loadingSensitiveMedicalHistory: boolean;
  public errorSensitiveMedicalHistory: any;
  public patientRecordObs?: Observable<PatientViewRecord>;
  public patientRecord: PatientViewRecord | undefined;
  private sub?: Subscription;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly patientService: PatientService,
    private readonly authService: AuthService,
    private router: Router
  ) {
    this.sensitiveMedicalHistory = null;
    this.loadingSensitiveMedicalHistory = false;
    this.errorSensitiveMedicalHistory = null;
    this.username = authService.getUsername();
  }

  ngOnInit(): void {
    this.sub = this.route.params
      .subscribe((params: Params) => {
        this.healthID = params.healthId
        this.doctorID = params.doctorId || '';
        this.refresh();
      });
    this.accessDonationDetails();
  }

  accessDonationDetails(): void {
    if (this.patientRecord) {
      const donationHistory: DonationHistory = this.patientRecord.donationHistory;
      const specificDonationDetails: DonationDetails | undefined = donationHistory['donationNumber'];

      if (specificDonationDetails) {
        const dateOfDonation: string = specificDonationDetails.dateOfDonation;
        const status: string = specificDonationDetails.status;
        const bloodBagUnitNo: string = specificDonationDetails.bloodBagUnitNo;
        const bloodBagSegmentNo: string = specificDonationDetails.bloodBagSegmentNo;
        const quantity: string = specificDonationDetails.quantity;
      }
    }
  }

  viewSensitiveMedicalHistory(): void {
    this.loadingSensitiveMedicalHistory = true;
    this.errorSensitiveMedicalHistory = null;
    this.patientService.getSensitiveMedicalHistory(this.healthID, this.username)
      .subscribe({
        next: (result) => {
          console.log(result);
          if (result.status === 'success') {
            this.sensitiveMedicalHistory = result.sensitiveMedicalHistory;
          } else if (result.status === 'error') {
            this.errorSensitiveMedicalHistory = result.error;
          }
          this.loadingSensitiveMedicalHistory = false;
        },
        error: (err) => {
          this.errorSensitiveMedicalHistory = 'Unable to fetch sensitive medical history.';
          this.loadingSensitiveMedicalHistory = false;
        }
      });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  public refresh(): void {
    this.patientRecordObs = this.patientService.getPatientByKey(this.healthID);
  }

  public isPatient(): boolean {
    return this.authService.getRole() === RoleEnum.PATIENT;
  }

  public isDoctor(): boolean {
    return this.authService.getRole() === RoleEnum.DOCTOR;
  }

  public isSuper(): boolean {
    return this.authService.getRole() === RoleEnum.SUPER;
  }
}
