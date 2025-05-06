import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { AdminComponent } from './admin/admin.component';
import { DoctorListForAdminComponent } from './admin/doctor-list-for-admin/doctor-list-for-admin.component';
import { DonorListForAdminComponent } from './admin/donor-list-for-admin/donor-list-for-admin.component';
import { GetStocksBelowThresholdComponent } from './admin/GetStocksBelowThreshold.component';
import { InsertHospitalComponent } from './admin/InsertHospital.component';
import { SuperListForAdminComponent } from './admin/super-list-for-admin/super-list-for-admin.component';
import { TechnicianListForAdminComponent } from './admin/technician-list-for-admin/technician-list-for-admin.component';
import { ViewAllHospitalsComponent } from './admin/ViewAllHospitals.component';
import { AuthGuard } from './core/auth/auth.guard';
import { BloodCollectionComponent } from './doctor/bloodcollection.component';
import { DoctorRegisterComponent } from './doctor/doctor-register/doctor-register.component';
import { DoctorComponent } from './doctor/doctor.component';
import { DonorListForDoctorComponent } from './doctor/donor-list-for-doctor/donor-list-for-doctor.component';
import { MOCapprovalComponent } from './doctor/MOCapproval.component';
import { ScreenDonorComponent } from './doctor/screendonor.component';
import { DonorDetailsMedicalEditComponent } from './donor/donor-details-medical-edit/donor-details-medical-edit.component';
import { DonorDetailsPersonalEditComponent } from './donor/donor-details-personal-edit/donor-details-personal-edit.component';
import { DonorEditComponent } from './donor/donor-register/donor-edit.component';
import { DonorComponent } from './donor/donor.component';
import { GeoButtonComponent } from './donor/Geobutton/geo-button.component';
import { LoginComponent } from './login/login.component';
import { ReceiverComponent } from './receiver/receiver.component';
import { DeferredDonorListForSuperComponent } from './super/deferred-donor-list-for-super/deferred-donor-list-for-super.component';
import { SuperRegisterComponent } from './super/super-register/super-register.component';
import { SuperComponent } from './super/super.component';
import { BloodRequestComponent } from './technician/bloodrequest.component';
import { BloodCrossMatchComponent } from './technician/crossmatchedblood.component';
import { DonorStatusCheckComponent } from './technician/donorstatuscheck.component';
import { LTapprovalComponent } from './technician/LTapproval.component';
import { ReadAllocatedBloodBagComponent } from './technician/readallocatedbloodbag.component';
import { ReadBloodBagComponent } from './technician/readbloodbag.component';
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
    path: 'donor/edit/:self',
    component: DonorEditComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'donor/:donorId/details/personal/edit',
    component: DonorDetailsPersonalEditComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'donor/:donorId/details/medical/edit',
    component: DonorDetailsMedicalEditComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'donor/:donorId',
    component: DonorComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'donor/view/:adminId',
    component: DonorListForAdminComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'donor/:donorId/:doctorId',
    component: DonorComponent,
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
    path: 'doctor/:doctorId/donors',
    component: DonorListForDoctorComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'doctor/:doctorId/checkdonorstatus',
    component: DonorStatusCheckComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'super/:superId/deferredlist',
    component: DeferredDonorListForSuperComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'donor/screen/:donorId/:doctorId/:dob',
    component: ScreenDonorComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'donor/collect-blood/:donorId/:doctorId',
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
    path: 'technician/:technicianId/checkdonorstatus',
    component: DonorStatusCheckComponent,
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
