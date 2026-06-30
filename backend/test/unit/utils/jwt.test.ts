import { expect } from "chai";
import { signJwt, verifyJwt, JwtPayload } from "../../../src/utils/jwt";
import * as jwt from "jsonwebtoken";

// ============================================================
// UNIT TESTS — utils/jwt.ts
// Funciones: signJwt(), verifyJwt()
// Sin mocks: jsonwebtoken se ejecuta real
// ============================================================

describe("🔑 Utils › jwt.ts", () => {

  // Payload base reutilizable en todos los tests
  const basePayload: JwtPayload = {
    userId: "user-abc-123",
    email: "estudiante@tecsup.edu.pe",
    role: "USER",
  };

  // ----------------------------------------------------------
  // signJwt()
  // ----------------------------------------------------------
  describe("signJwt()", () => {

    it("debe retornar un string (el token)", () => {
      const token = signJwt(basePayload);
      expect(token).to.be.a("string");
    });

    it("el token debe tener formato JWT: tres partes separadas por puntos", () => {
      const token = signJwt(basePayload);
      const parts = token.split(".");
      expect(parts).to.have.length(3);
    });

    it("debe incluir el userId en el payload del token", () => {
      const token = signJwt(basePayload);
      const decoded = jwt.decode(token) as any;
      expect(decoded.userId).to.equal(basePayload.userId);
    });

    it("debe incluir el email en el payload del token", () => {
      const token = signJwt(basePayload);
      const decoded = jwt.decode(token) as any;
      expect(decoded.email).to.equal(basePayload.email);
    });

    it("debe incluir el role en el payload del token", () => {
      const token = signJwt(basePayload);
      const decoded = jwt.decode(token) as any;
      expect(decoded.role).to.equal(basePayload.role);
    });

    it("debe incluir campo 'exp' (expiración) en el token", () => {
      const token = signJwt(basePayload);
      const decoded = jwt.decode(token) as any;
      expect(decoded).to.have.property("exp");
      expect(decoded.exp).to.be.a("number");
    });

    it("debe generar tokens diferentes para payloads distintos", () => {
      const token1 = signJwt({ ...basePayload, userId: "user-1" });
      const token2 = signJwt({ ...basePayload, userId: "user-2" });
      expect(token1).to.not.equal(token2);
    });

    it("debe poder firmar token con role ADMIN", () => {
      const adminPayload: JwtPayload = { ...basePayload, role: "ADMIN" };
      const token = signJwt(adminPayload);
      const decoded = jwt.decode(token) as any;
      expect(decoded.role).to.equal("ADMIN");
    });

    it("debe poder firmar token con role WORKER", () => {
      const workerPayload: JwtPayload = { ...basePayload, role: "WORKER" };
      const token = signJwt(workerPayload);
      const decoded = jwt.decode(token) as any;
      expect(decoded.role).to.equal("WORKER");
    });
  });

  // ----------------------------------------------------------
  // verifyJwt()
  // ----------------------------------------------------------
  describe("verifyJwt()", () => {

    it("debe retornar el payload completo de un token válido", () => {
      const token = signJwt(basePayload);
      const result = verifyJwt(token);
      expect(result.userId).to.equal(basePayload.userId);
      expect(result.email).to.equal(basePayload.email);
      expect(result.role).to.equal(basePayload.role);
    });

    it("debe lanzar error con un token completamente falso", () => {
      expect(() => verifyJwt("esto.no.es.un.token")).to.throw();
    });

    it("debe lanzar error con un token firmado con secret diferente", () => {
      const fakeToken = jwt.sign(basePayload, "secret_diferente_falso");
      expect(() => verifyJwt(fakeToken)).to.throw();
    });

    it("debe lanzar error con un token expirado", (done) => {
      // Firmamos un token que expira en 1 segundo
      const expiredToken = jwt.sign(
        basePayload,
        process.env.JWT_SECRET ?? "change_this_secret",
        { expiresIn: "1s" }
      );
      // Esperamos 1100ms para que expire
      setTimeout(() => {
        expect(() => verifyJwt(expiredToken)).to.throw(/jwt expired/i);
        done();
      }, 1100);
    });

    it("debe lanzar error con string vacío", () => {
      expect(() => verifyJwt("")).to.throw();
    });

    it("debe lanzar error con token manipulado (payload alterado)", () => {
      const token = signJwt(basePayload);
      const parts = token.split(".");
      // Alteramos el payload (parte del medio)
      parts[1] = Buffer.from(JSON.stringify({ userId: "hacker", role: "ADMIN" })).toString("base64");
      const tampered = parts.join(".");
      expect(() => verifyJwt(tampered)).to.throw();
    });

    it("flujo completo: firmar y verificar exitosamente", () => {
      const token = signJwt(basePayload);
      const verified = verifyJwt(token);
      expect(verified.userId).to.equal(basePayload.userId);
      expect(verified.email).to.equal(basePayload.email);
      expect(verified.role).to.equal(basePayload.role);
    });
  });

});