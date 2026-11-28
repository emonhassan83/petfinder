import { IUser } from "./users.type";

declare global {
  namespace Express {
    interface Request {
      //* Set by `auth(...)` (always) or `optionalAuth` (when a valid token is sent)
      user?: IUser;
    }
  }
}

export {};
