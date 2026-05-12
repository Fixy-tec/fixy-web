import { sign, verify, Secret } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET ?? "change_this_secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? "1h";

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

export function signJwt(payload: JwtPayload) {
  return sign(payload, JWT_SECRET as Secret, {
    expiresIn: JWT_EXPIRES_IN as any,
  });
}

export function verifyJwt(token: string) {
  return verify(token, JWT_SECRET as Secret) as JwtPayload;
}
