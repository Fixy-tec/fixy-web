import { expect } from "chai";
import sinon from "sinon";
import { authenticateJWT, requireRole, AuthRequest } from "../../../src/middlewares/auth.middleware";
import * as jwtUtils from "../../../src/utils/jwt";
import { Response, NextFunction } from "express";

// ============================================================
// UNIT TESTS — middlewares/auth.middleware.ts
// Funciones: authenticateJWT(), requireRole()
// Usa Sinon para: mockear req/res/next y stub de verifyJwt
// ============================================================

describe("🛡️ Middlewares › auth.middleware.ts", () => {

  // Helpers para crear mocks de req, res, next
  function mockResponse() {
    const res: Partial<Response> = {};
    res.status = sinon.stub().returns(res as Response);
    res.json = sinon.stub().returns(res as Response);
    return res as Response;
  }

  function mockNext(): NextFunction {
    return sinon.stub() as unknown as NextFunction;
  }

  // Payload de usuario simulado para los tests
  const fakeUser = {
    userId: "user-001",
    email: "alumno@tecsup.edu.pe",
    role: "USER",
  };

  // Restaurar stubs después de cada test
  afterEach(() => {
    sinon.restore();
  });

  // ----------------------------------------------------------
  // authenticateJWT()
  // ----------------------------------------------------------
  describe("authenticateJWT()", () => {

    it("debe responder 401 si no hay header Authorization", () => {
      const req = { headers: {} } as AuthRequest;
      const res = mockResponse();
      const next = mockNext();

      authenticateJWT(req, res, next);

      expect((res.status as sinon.SinonStub).calledWith(401)).to.be.true;
      expect((res.json as sinon.SinonStub).calledWithMatch({ message: "Authorization token missing" })).to.be.true;
      expect((next as sinon.SinonStub).called).to.be.false;
    });

    it("debe responder 401 si el header no empieza con 'Bearer '", () => {
      const req = {
        headers: { authorization: "Basic abc123" },
      } as AuthRequest;
      const res = mockResponse();
      const next = mockNext();

      authenticateJWT(req, res, next);

      expect((res.status as sinon.SinonStub).calledWith(401)).to.be.true;
      expect((res.json as sinon.SinonStub).calledWithMatch({ message: "Authorization token missing" })).to.be.true;
    });

    it("debe responder 401 si el token es inválido (verifyJwt lanza error)", () => {
      sinon.stub(jwtUtils, "verifyJwt").throws(new Error("invalid token"));

      const req = {
        headers: { authorization: "Bearer token.invalido.aqui" },
      } as AuthRequest;
      const res = mockResponse();
      const next = mockNext();

      authenticateJWT(req, res, next);

      expect((res.status as sinon.SinonStub).calledWith(401)).to.be.true;
      expect((res.json as sinon.SinonStub).calledWithMatch({ message: "Invalid or expired token" })).to.be.true;
      expect((next as sinon.SinonStub).called).to.be.false;
    });

    it("debe responder 401 si el token está expirado", () => {
      sinon.stub(jwtUtils, "verifyJwt").throws(new Error("jwt expired"));

      const req = {
        headers: { authorization: "Bearer token.expirado.aqui" },
      } as AuthRequest;
      const res = mockResponse();
      const next = mockNext();

      authenticateJWT(req, res, next);

      expect((res.status as sinon.SinonStub).calledWith(401)).to.be.true;
      expect((res.json as sinon.SinonStub).calledWithMatch({ message: "Invalid or expired token" })).to.be.true;
    });

    it("debe llamar next() y adjuntar req.user si el token es válido", () => {
      sinon.stub(jwtUtils, "verifyJwt").returns(fakeUser);

      const req = {
        headers: { authorization: "Bearer token.valido.aqui" },
      } as AuthRequest;
      const res = mockResponse();
      const next = mockNext();

      authenticateJWT(req, res, next);

      expect((next as sinon.SinonStub).called).to.be.true;
      expect(req.user).to.deep.equal(fakeUser);
      expect((res.status as sinon.SinonStub).called).to.be.false;
    });

    it("debe extraer el token correctamente del header (sin el prefijo 'Bearer ')", () => {
      const verifyStub = sinon.stub(jwtUtils, "verifyJwt").returns(fakeUser);

      const req = {
        headers: { authorization: "Bearer mi.token.real" },
      } as AuthRequest;

      authenticateJWT(req, mockResponse(), mockNext());

      expect(verifyStub.calledWith("mi.token.real")).to.be.true;
    });

    it("debe responder 401 si el header es solo 'Bearer ' sin token", () => {
      sinon.stub(jwtUtils, "verifyJwt").throws(new Error("jwt malformed"));

      const req = {
        headers: { authorization: "Bearer " },
      } as AuthRequest;
      const res = mockResponse();
      const next = mockNext();

      authenticateJWT(req, res, next);

      expect((res.status as sinon.SinonStub).calledWith(401)).to.be.true;
    });
  });

  // ----------------------------------------------------------
  // requireRole()
  // ----------------------------------------------------------
  describe("requireRole()", () => {

    it("debe responder 401 si req.user no existe", () => {
      const req = {} as AuthRequest; // sin user
      const res = mockResponse();
      const next = mockNext();

      requireRole("ADMIN")(req, res, next);

      expect((res.status as sinon.SinonStub).calledWith(401)).to.be.true;
      expect((res.json as sinon.SinonStub).calledWithMatch({ message: "Unauthorized" })).to.be.true;
      expect((next as sinon.SinonStub).called).to.be.false;
    });

    it("debe responder 403 si el rol del usuario no está permitido", () => {
      const req = { user: { ...fakeUser, role: "USER" } } as AuthRequest;
      const res = mockResponse();
      const next = mockNext();

      requireRole("ADMIN")(req, res, next);

      expect((res.status as sinon.SinonStub).calledWith(403)).to.be.true;
      expect((res.json as sinon.SinonStub).calledWithMatch({ message: "Insufficient permissions" })).to.be.true;
      expect((next as sinon.SinonStub).called).to.be.false;
    });

    it("debe llamar next() si el rol del usuario está en la lista permitida", () => {
      const req = { user: { ...fakeUser, role: "ADMIN" } } as AuthRequest;
      const res = mockResponse();
      const next = mockNext();

      requireRole("ADMIN")(req, res, next);

      expect((next as sinon.SinonStub).called).to.be.true;
      expect((res.status as sinon.SinonStub).called).to.be.false;
    });

    it("debe permitir múltiples roles: usuario con rol WORKER accede a ruta WORKER|ADMIN", () => {
      const req = { user: { ...fakeUser, role: "WORKER" } } as AuthRequest;
      const res = mockResponse();
      const next = mockNext();

      requireRole("ADMIN", "WORKER")(req, res, next);

      expect((next as sinon.SinonStub).called).to.be.true;
    });

    it("debe denegar acceso si el rol es USER y se requiere ADMIN o WORKER", () => {
      const req = { user: { ...fakeUser, role: "USER" } } as AuthRequest;
      const res = mockResponse();
      const next = mockNext();

      requireRole("ADMIN", "WORKER")(req, res, next);

      expect((res.status as sinon.SinonStub).calledWith(403)).to.be.true;
    });

    it("debe permitir acceso cuando el usuario tiene exactamente el único rol requerido", () => {
      const req = { user: { ...fakeUser, role: "USER" } } as AuthRequest;
      const res = mockResponse();
      const next = mockNext();

      requireRole("USER")(req, res, next);

      expect((next as sinon.SinonStub).called).to.be.true;
    });
  });

});