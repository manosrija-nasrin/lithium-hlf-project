import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { AdminComponent } from './admin/admin.component';
import { DoctorListForAdminComponent } from './admin/doctor-list-for-admin/doctor-list-for-admin.component';
import { GetStocksBelowThresholdComponent } from './admin/GetStocksBelowThreshold.component';
import { InsertHospitalComponent } from './admin/InsertHospital.component';
import { PatientListForAdminComponent } from './admin/patient-list-for-admin/patient-list-for-admin.component';
import { SuperListForAdminComponent } from './admin/super-list-for-admin/super-list-for-admin.component';
import { TechnicianListForAdminComponent } from './admin/technician-list-for-admin/technician-list-for-admin.component';
import { ViewAllHospitalsComponent } from './admin/ViewAllHospitals.component';
import { AuthGuard } from './core/auth/auth.guard';
import { BloodCollectionComponent } from './doctor/bloodcollection.component';
import { DoctorRegisterComponent } from './doctor/doctor-register/doctor-register.component';
import { DoctorComponent } from './doctor/doctor.component';
import { MOCapprovalComponent } from './doctor/MOCapproval.component';
import { PatientListForDoctorComponent } from './doctor/patient-list-for-doctor/patient-list-for-doctor.component';
import { RequestAccessToSensitiveDataComponent } from './doctor/request-access-to-sensitive-data/request-access-to-sensitive-data.component';
import { ScreenPatientComponent } from './doctor/screenpatient.component';
import { LoginComponent } from './login/login.component';
import { GeoButtonComponent } from './patient/Geobutton/geo-button.component';
import { PatientDetailsMedicalEditComponent } from './patient/patient-details-medical-edit/patient-details-medical-edit.component';
import { PatientDetailsPersonalEditComponent } from './patient/patient-details-personal-edit/patient-details-personal-edit.component';
import { PatientHistoryComponent } from './patient/patient-history/patient-history.component';
import { PatientEditComponent } from './patient/patient-register/patient-edit.component';
import { PatientComponent } from './patient/patient.component';
import { ReceiverComponent } from './receiver/receiver.component';
import { AccessRequestApprovalComponent } from './super/access-request-dashboard/access-request-dashboard.component';
import { DeferredPatientListForSuperComponent } from './super/deferred-patient-list-for-super/deferred-patient-list-for-super.component';
import { SuperRegisterComponent } from './super/super-register/super-register.component';
import { SuperComponent } from './super/super.component';
import { BloodRequestComponent } from './technician/bloodrequest.component';
import { TechnicianBloodCollectionComponent } from './technician/collect-blood/collect-blood.component';
import { BloodCrossMatchComponent } from './technician/crossmatchedblood.component';
import { LTapprovalComponent } from './technician/LTapproval.component';
import { PatientStatusCheckComponent } from './technician/patientstatuscheck.component';
import { ReadAllocatedBloodBagComponent } from './technician/readallocatedbloodbag.component';
import { ReadBloodBagComponent } from './technician/readbloodbag.component';
import { TechnicianScreenPatientComponent } from './technician/screen-patient/screen-patient.component';
import { AddHealthIndicatorResultsComponent } from './technician/technician-add-health-indicators/add-health-indicators.component';
import { AddTtiResultComponent } from './technician/technician-add-tti-results/add-tti-result.component';
import { TechnicianRegisterComponent } from './technician/technician-register/technician-register.component';
import { TechnicianComponent } from './technician/technician.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'patient/edit/:self',
    component: PatientEditComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'patient/:healthId/details/personal/edit',
    component: PatientDetailsPersonalEditComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'patient/:healthId/details/medical/edit',
    component: PatientDetailsMedicalEditComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'patient/:healthId',
    component: PatientComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'patient/view/:adminId',
    component: PatientListForAdminComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'patient/:healthId/history',
    component: PatientHistoryComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'patient/:healthId/:doctorId',
    component: PatientComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'doctor/register',
    component: DoctorRegisterComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'doctor/view/:adminId',
    component: DoctorListForAdminComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'doctor/:doctorId/MOCapproval',
    component: MOCapprovalComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'technician/view/:adminId',
    component: TechnicianListForAdminComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'technician/register',
    component: TechnicianRegisterComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'super/register',
    component: SuperRegisterComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'doctor/:doctorId',
    component: DoctorComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'super/:superId',
    component: SuperComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'super/view/:adminId',
    component: SuperListForAdminComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'technician/:technicianId',
    component: TechnicianComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'doctor/:doctorId/patients',
    component: PatientListForDoctorComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'doctor/:doctorId/checkpatientstatus',
    component: PatientStatusCheckComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'doctor/:doctorId/request-access/:healthId',
    component: RequestAccessToSensitiveDataComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'super/:superId/deferredlist',
    component: DeferredPatientListForSuperComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'super/:superId/checkpatientstatus',
    component: PatientStatusCheckComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'super/:superId/access-requests',
    component: AccessRequestApprovalComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'patient/screen/:healthId/:doctorId/:dob',
    component: ScreenPatientComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'patient/collect-blood/:healthId/:doctorId',
    component: BloodCollectionComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'technician/:technicianId/readbloodbag',
    component: ReadBloodBagComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'technician/:technicianId/addttiresults',
    component: AddTtiResultComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'technician/:technicianId/checkpatientstatus',
    component: PatientStatusCheckComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'technician/:technicianId/addhealthindicators',
    component: AddHealthIndicatorResultsComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'technician/:technicianId/readallocatedbloodbag',
    component: ReadAllocatedBloodBagComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'technician/:technicianId/addcrossmatchedbag',
    component: BloodCrossMatchComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'technician/:technicianId/bloodrequest',
    component: BloodRequestComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'technician/:technicianId/LTapproval',
    component: LTapprovalComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'patient/screen/technician/:technicianId',
    component: TechnicianScreenPatientComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'technician/patient/collect-blood/:technicianId',
    component: TechnicianBloodCollectionComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'receiver',
    component: ReceiverComponent
  },
  {
    path: 'nearest-hospitals',
    component: GeoButtonComponent
  },
  {
    path: 'admin/:adminId',
    component: AdminComponent
  },
  {
    path: 'viewHospitals',
    component: ViewAllHospitalsComponent
  },
  {
    path: 'addHospital',
    component: InsertHospitalComponent
  },
  {
    path: 'displayStocksBelowThreshold',
    component: GetStocksBelowThresholdComponent
  }
];

@NgModule({
  imports: [FormsModule, RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
