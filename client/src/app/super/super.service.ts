import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SuperService {

  private superURL = 'http://localhost:3001/supers';

  constructor(private http: HttpClient) { }

  public createSuper(data: any): Observable<any> {
    return this.http.post(this.superURL + '/register', data);
  }

  public getSupersByHospitalId(hospitalId: number): Observable<any> {
    return this.http.get(this.superURL + `/${hospitalId}/_all`);
  }

  public getSuperByHospitalId(hospitalId: string, supId: any): Observable<any> {
    return this.http.get(this.superURL + `/${hospitalId}/${supId}`);
  }

  public getBlockedDonors(hospitalId: string, supId: string): Observable<any> {
    return this.http.get(this.superURL + `/${hospitalId}/${supId}/blockedlist`);
  }
}
