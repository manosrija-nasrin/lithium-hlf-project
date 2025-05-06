import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';

import { AdminComponent } from './admin/admin.component';
import { AdminService } from './admin/admin.service';
import { DoctorListForAdminComponent } from './admin/doctor-list-for-admin/doctor-list-for-admin.component';
import { DonorListForAdminComponent } from './admin/donor-list-for-admin/donor-list-for-admin.component';
import { GetStocksBelowThresholdComponent } from './admin/GetStocksBelowThreshold.component';
import { InsertHospitalComponent } from './admin/InsertHospital.component';
import { SuperListForAdminComponent } from './admin/super-list-for-admin/super-list-for-admin.component';
import { TechnicianListForAdminComponent } from './admin/technician-list-for-admin/technician-list-for-admin.component';
import { ViewAllHospitalsComponent } from './admin/ViewAllHospitals.component';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AuthGuard } from './core/auth/auth.guard';
import { AuthService } from './core/auth/auth.service';
import { TokenInterceptorService } from './core/auth/token-interceptor.service';
import { BloodCollectionComponent } from './doctor/bloodcollection.component';
import { DoctorListForDonorComponent } from './doctor/doctor-list-for-donor/doctor-list-for-donor.component';
import { DoctorRegisterComponent } from './doctor/doctor-register/doctor-register.component';
import { DoctorComponent } from './doctor/doctor.component';
import { DoctorService } from './doctor/doctor.service';
import { DonorListForDoctorComponent } from './doctor/donor-list-for-doctor/donor-list-for-doctor.component';
import { MOCapprovalComponent } from './doctor/MOCapproval.component';
import { ScreenDonorComponent } from './doctor/screendonor.component';
import { DonorDetailsMedicalEditComponent } from './donor/donor-details-medical-edit/donor-details-medical-edit.component';
import { DonorDetailsPersonalEditComponent } from './donor/donor-details-personal-edit/donor-details-personal-edit.component';
import { DonorHistoryComponent } from './donor/donor-history/donor-history.component';
import { DonorEditComponent } from './donor/donor-register/donor-edit.component';
import { DonorComponent } from './donor/donor.component';
import { DonorService } from './donor/donor.service';
import { GeoButtonComponent } from './donor/Geobutton/geo-button.component';
import { LoadingPipe } from './loading.pipe';
import { LoginComponent } from './login/login.component';
import { ReceiverComponent } from './receiver/receiver.component';
import { SearchComboComponent, SearchService, SearchTextComponent } from './search';
import { ToolbarButtonComponent, ToolbarComponent, ToolbarLinkComponent } from './sidebar';
import { DeferredDonorListForSuperComponent } from './super/deferred-donor-list-for-super/deferred-donor-list-for-super.component';
import { SuperRegisterComponent } from './super/super-register/super-register.component';
import { SuperComponent } from './super/super.component';
import { SuperService } from './super/super.service';
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
import { TechnicianService } from './technician/technician.service';

const components = [
  AppComponent,
  DeferredDonorListForSuperComponent,
  SuperComponent,
  SuperRegisterComponent,
  LoginComponent,
  AdminComponent,
  DonorComponent,
  TechnicianComponent,
  DonorEditComponent,
  DonorHistoryComponent,
  DonorDetailsMedicalEditComponent,
  DonorDetailsPersonalEditComponent,
  DonorListForDoctorComponent,
  DoctorListForDonorComponent,
  DoctorListForAdminComponent,
  DonorStatusCheckComponent,
  TechnicianListForAdminComponent,
  DonorListForAdminComponent,
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
  ScreenDonorComponent,
  BloodCollectionComponent,
  ReadBloodBagComponent,
  BloodCrossMatchComponent,
  ReceiverComponent,
  BloodRequestComponent,
  ReadAllocatedBloodBagComponent,
  LTapprovalComponent,
  MOCapprovalComponent,
  AddTtiResultComponent,
  AddHealthIndicatorResultsComponent
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
  providers: [AuthService, AuthGuard, SearchService, AdminService, DonorService, DoctorService, TechnicianService, SuperService,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: TokenInterceptorService,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
