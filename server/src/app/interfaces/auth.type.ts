export type IJwtPayload = {
  userId: string;
  email: string;
  role: string;
  //* Refresh tokens: RefreshToken row id and rotation family
  jti?: string;
  fam?: string;
  //* Single-purpose tokens (e.g. "verify-email")
  purpose?: string;
};
