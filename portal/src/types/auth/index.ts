export type RegisterRole = "USER" | "OWNER" | "SHELTER";

export interface IRegisterUser {
  name: string;
  email: string;
  password: string;
  contactNumber: string;
  address: string;
  role?: RegisterRole;
}
