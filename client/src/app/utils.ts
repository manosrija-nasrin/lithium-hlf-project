export enum RoleEnum {
  ADMIN = 'admin',
  DONOR = 'donor',
  DOCTOR = 'doctor',
  TECHNICIAN = 'technician',
  SUPER = 'super'
}

export enum BrowserStorageFields {
  TOKEN = 'token',
  REFRESH_TOKEN = 'refresh_token',
  USER_ROLE = 'user_role',
  HOSPITAL_ID = 'hospital_id',
  USERNAME = 'username',
  TOKEN_EXPIRY = 'token_expiry'
}

export class Utils {

  public static encode(data: string): string {
    return atob(data);
  }

  public static decode(data: string): string {
    return btoa(data);
  }
}
