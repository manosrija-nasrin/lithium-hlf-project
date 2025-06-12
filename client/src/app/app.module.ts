import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';

import { AdminComponent } from './admin/admin.component';
import { AdminService } from './admin/admin.service';
import { DoctorListForAdminComponent } from './admin/doctor-list-for-admin/doctor-list-for-admin.component';
import { GetStocksBelowThresholdComponent } from './admin/GetStocksBelowThreshold.component';
import { InsertHospitalComponent } from './admin/InsertHospital.component';
import { PatientListForAdminComponent } from './admin/patient-list-for-admin/patient-list-for-admin.component';
import { SuperListForAdminComponent } from './admin/super-list-for-admin/super-list-for-admin.component';
import { TechnicianListForAdminComponent } from './admin/technician-list-for-admin/technician-list-for-admin.component';
import { ViewAllHospitalsComponent } from './admin/ViewAllHospitals.component';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AuthGuard } from './core/auth/auth.guard';
import { AuthService } from './core/auth/auth.service';
import { TokenInterceptorService } from './core/auth/token-interceptor.service';
import { BloodCollectionComponent } from './doctor/bloodcollection.component';
import { DoctorListForPatientComponent } from './doctor/doctor-list-for-patient/doctor-list-for-patient.component';
import { DoctorRegisterComponent } from './doctor/doctor-register/doctor-register.component';
import { DoctorComponent } from './doctor/doctor.component';
import { DoctorService } from './doctor/doctor.service';
import { MOCapprovalComponent } from './doctor/MOCapproval.component';
import { PatientListForDoctorComponent } from './doctor/patient-list-for-doctor/patient-list-for-doctor.component';
import { RequestAccessToSensitiveDataComponent } from './doctor/request-access-to-sensitive-data/request-access-to-sensitive-data.component';
import { ScreenPatientComponent } from './doctor/screenpatient.component';
import { LoadingPipe } from './loading.pipe';
import { LoginComponent } from './login/login.component';
import { GeoButtonComponent } from './patient/Geobutton/geo-button.component';
import { PatientDetailsMedicalEditComponent } from './patient/patient-details-medical-edit/patient-details-medical-edit.component';
import { PatientDetailsPersonalEditComponent } from './patient/patient-details-personal-edit/patient-details-personal-edit.component';
import { PatientHistoryComponent } from './patient/patient-history/patient-history.component';
import { PatientEditComponent } from './patient/patient-register/patient-edit.component';
import { PatientComponent } from './patient/patient.component';
import { PatientService } from './patient/patient.service';
import { ReceiverComponent } from './receiver/receiver.component';
import { SearchComboComponent, SearchService, SearchTextComponent } from './search';
import { ToolbarButtonComponent, ToolbarComponent, ToolbarLinkComponent } from './sidebar';
import { AccessRequestApprovalComponent } from './super/access-request-dashboard/access-request-dashboard.component';
import { DeferredPatientListForSuperComponent } from './super/deferred-patient-list-for-super/deferred-patient-list-for-super.component';
import { SuperRegisterComponent } from './super/super-register/super-register.component';
import { SuperComponent } from './super/super.component';
import { SuperService } from './super/super.service';
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
import { TechnicianService } from './technician/technician.service';

const components = [
  AppComponent,
  DeferredPatientListForSuperComponent,
  SuperComponent,
  SuperRegisterComponent,
  LoginComponent,
  AdminComponent,
  PatientComponent,
  TechnicianComponent,
  PatientEditComponent,
  PatientHistoryComponent,
  PatientDetailsMedicalEditComponent,
  PatientDetailsPersonalEditComponent,
  PatientListForDoctorComponent,
  DoctorListForPatientComponent,
  DoctorListForAdminComponent,
  PatientStatusCheckComponent,
  TechnicianListForAdminComponent,
  PatientListForAdminComponent,
  DoctorComponent,
  DoctorRegisterComponent,
  SuperListForAdminComponent,
  TechnicianRegisterComponent,
  ToolbarComponent,
  ToolbarButtonComponent,
  ToolbarLinkComponent,
  SearchComboComponent,
  SearchTextComponent,
  ViewAllHospitalsComponent,
  InsertHospitalComponent,
  GetStocksBelowThresholdComponent,
  GeoButtonComponent,
  ScreenPatientComponent,
  BloodCollectionComponent,
  ReadBloodBagComponent,
  BloodCrossMatchComponent,
  ReceiverComponent,
  BloodRequestComponent,
  ReadAllocatedBloodBagComponent,
  LTapprovalComponent,
  MOCapprovalComponent,
  AddTtiResultComponent,
  AddHealthIndicatorResultsComponent,
  PatientHistoryComponent,
  RequestAccessToSensitiveDataComponent,
  TechnicianBloodCollectionComponent,
  TechnicianScreenPatientComponent,
  AccessRequestApprovalComponent,
];

const pipes = [
  LoadingPipe
];

@NgModule({
  declarations: [...components, ...pipes],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    AppRoutingModule,
    ReactiveFormsModule,
    NgSelectModule,
    NgbTooltipModule
  ],
  providers: [AuthService, AuthGuard, SearchService, AdminService, PatientService, DoctorService, TechnicianService, SuperService,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: TokenInterceptorService,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
