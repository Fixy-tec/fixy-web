import { expect } from "chai";
import sinon from "sinon";
import * as authService from "../../../src/modules/auth/services/auth.service";
import * as authRepository from "../../../src/modules/auth/repositories/auth.repository";
import * as passwordUtils from "../../../src/utils/password";
import * as jwtUtils from "../../../src/utils/jwt";

// ============================================================
// UNIT TESTS — modules/auth/services/auth.service.ts
// Funciones: register(), login()
// Usa Sinon para: mockear authRepository, hashPassword, signJwt
// NO toca la base de datos real
// ============================================================

describe("🔒 Services › auth.service.ts", () => {

  // Usuario simulado que devolvería la BD
  const fakeUser = {
    id: "user-001",
    email: "alumno@tecsup.edu.pe",
    password: "$2b$10$hashedPasswordAqui",
    name: "Juan Pérez",
    role: "USER",
    profile: null,
    userTags: [
      { tag: { name: "JavaScript" } },
      { tag: { name: "Node.js" } },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const fakeToken = "eyJhbGciOiJIUzI1NiJ9.fake.token";

  afterEach(() => {
    sinon.restore();
  });

  // ----------------------------------------------------------
  // register()
  // ----------------------------------------------------------
  describe("register()", () => {

    it("debe lanzar error si el email ya está registrado", async () => {
      sinon.stub(authRepository, "findUserByEmail").resolves(fakeUser as any);

      try {
        await authService.register({
          email: "alumno@tecsup.edu.pe",
          password: "Password123",
          name: "Juan",
        });
        expect.fail("Debería haber lanzado un error");
      } catch (err: any) {
        expect(err.message).to.equal("Email already registered");
      }
    });

    it("debe registrar exitosamente con datos válidos", async () => {
      sinon.stub(authRepository, "findUserByEmail").resolves(null);
      sinon.stub(passwordUtils, "hashPassword").resolves("$2b$10$hashedNuevo");
      sinon.stub(authRepository, "createUser").resolves(fakeUser as any);
      sinon.stub(jwtUtils, "signJwt").returns(fakeToken);

      const result = await authService.register({
        email: "nuevo@tecsup.edu.pe",
        password: "Password123",
        name: "María García",
      });

      expect(result).to.have.property("user");
      expect(result).to.have.property("accessToken");
      expect(result.accessToken).to.equal(fakeToken);
    });

    it("el usuario retornado NO debe contener la contraseña (sanitizeUser)", async () => {
      sinon.stub(authRepository, "findUserByEmail").resolves(null);
      sinon.stub(passwordUtils, "hashPassword").resolves("$2b$10$hashedNuevo");
      sinon.stub(authRepository, "createUser").resolves(fakeUser as any);
      sinon.stub(jwtUtils, "signJwt").returns(fakeToken);

      const result = await authService.register({
        email: "nuevo@tecsup.edu.pe",
        password: "Password123",
        name: "María García",
      });

      expect(result.user).to.not.have.property("password");
    });

    it("debe retornar los tags del usuario como array de strings", async () => {
      sinon.stub(authRepository, "findUserByEmail").resolves(null);
      sinon.stub(passwordUtils, "hashPassword").resolves("$2b$10$hashedNuevo");
      sinon.stub(authRepository, "createUser").resolves(fakeUser as any);
      sinon.stub(jwtUtils, "signJwt").returns(fakeToken);

      const result = await authService.register({
        email: "nuevo@tecsup.edu.pe",
        password: "Password123",
        name: "María García",
      });

      expect(result.user.tags).to.be.an("array");
      expect(result.user.tags).to.include("JavaScript");
      expect(result.user.tags).to.include("Node.js");
    });

    it("debe llamar a hashPassword antes de crear el usuario", async () => {
      sinon.stub(authRepository, "findUserByEmail").resolves(null);
      const hashStub = sinon.stub(passwordUtils, "hashPassword").resolves("$2b$10$hash");
      sinon.stub(authRepository, "createUser").resolves(fakeUser as any);
      sinon.stub(jwtUtils, "signJwt").returns(fakeToken);

      await authService.register({
        email: "nuevo@tecsup.edu.pe",
        password: "Password123",
        name: "María",
      });

      expect(hashStub.calledWith("Password123")).to.be.true;
    });

    it("debe llamar a signJwt con el id, email y role del usuario creado", async () => {
      sinon.stub(authRepository, "findUserByEmail").resolves(null);
      sinon.stub(passwordUtils, "hashPassword").resolves("$2b$10$hash");
      sinon.stub(authRepository, "createUser").resolves(fakeUser as any);
      const signStub = sinon.stub(jwtUtils, "signJwt").returns(fakeToken);

      await authService.register({
        email: "nuevo@tecsup.edu.pe",
        password: "Password123",
        name: "María",
      });

      expect(signStub.calledWith({
        userId: fakeUser.id,
        email: fakeUser.email,
        role: fakeUser.role,
      })).to.be.true;
    });

    it("debe manejar usuario sin tags (userTags vacío)", async () => {
      const userSinTags = { ...fakeUser, userTags: [] };
      sinon.stub(authRepository, "findUserByEmail").resolves(null);
      sinon.stub(passwordUtils, "hashPassword").resolves("$2b$10$hash");
      sinon.stub(authRepository, "createUser").resolves(userSinTags as any);
      sinon.stub(jwtUtils, "signJwt").returns(fakeToken);

      const result = await authService.register({
        email: "sin.tags@tecsup.edu.pe",
        password: "Password123",
        name: "Sin Tags",
      });

      expect(result.user.tags).to.be.an("array").that.is.empty;
    });
  });

  // ----------------------------------------------------------
  // login()
  // ----------------------------------------------------------
  describe("login()", () => {

    it("debe lanzar 'Invalid credentials' si el email no existe", async () => {
      sinon.stub(authRepository, "findUserByEmail").resolves(null);

      try {
        await authService.login({
          email: "noexiste@tecsup.edu.pe",
          password: "cualquierCosa",
        });
        expect.fail("Debería haber lanzado un error");
      } catch (err: any) {
        expect(err.message).to.equal("Invalid credentials");
      }
    });

    it("debe lanzar 'Invalid credentials' si la contraseña es incorrecta", async () => {
      sinon.stub(authRepository, "findUserByEmail").resolves(fakeUser as any);
      sinon.stub(passwordUtils, "comparePassword").resolves(false);

      try {
        await authService.login({
          email: "alumno@tecsup.edu.pe",
          password: "ContraseñaWrong",
        });
        expect.fail("Debería haber lanzado un error");
      } catch (err: any) {
        expect(err.message).to.equal("Invalid credentials");
      }
    });

    it("debe retornar user y accessToken con credenciales correctas", async () => {
      sinon.stub(authRepository, "findUserByEmail").resolves(fakeUser as any);
      sinon.stub(passwordUtils, "comparePassword").resolves(true);
      sinon.stub(jwtUtils, "signJwt").returns(fakeToken);

      const result = await authService.login({
        email: "alumno@tecsup.edu.pe",
        password: "PasswordCorrecta",
      });

      expect(result).to.have.property("user");
      expect(result).to.have.property("accessToken", fakeToken);
    });

    it("el user retornado NO debe contener la contraseña", async () => {
      sinon.stub(authRepository, "findUserByEmail").resolves(fakeUser as any);
      sinon.stub(passwordUtils, "comparePassword").resolves(true);
      sinon.stub(jwtUtils, "signJwt").returns(fakeToken);

      const result = await authService.login({
        email: "alumno@tecsup.edu.pe",
        password: "PasswordCorrecta",
      });

      expect(result.user).to.not.have.property("password");
    });

    it("el mensaje de error debe ser igual para email inexistente y contraseña incorrecta (seguridad)", async () => {
      // IMPORTANTE: ambos casos deben dar el mismo mensaje para no revelar
      // si el email existe o no en el sistema
      sinon.stub(authRepository, "findUserByEmail").resolves(null);

      let errorEmailInexistente = "";
      try {
        await authService.login({ email: "fake@tecsup.edu.pe", password: "pass" });
      } catch (err: any) {
        errorEmailInexistente = err.message;
      }

      sinon.restore();
      sinon.stub(authRepository, "findUserByEmail").resolves(fakeUser as any);
      sinon.stub(passwordUtils, "comparePassword").resolves(false);

      let errorPasswordMal = "";
      try {
        await authService.login({ email: "alumno@tecsup.edu.pe", password: "wrong" });
      } catch (err: any) {
        errorPasswordMal = err.message;
      }

      expect(errorEmailInexistente).to.equal(errorPasswordMal);
      expect(errorEmailInexistente).to.equal("Invalid credentials");
    });

    it("debe retornar tags del usuario como array de strings en el login", async () => {
      sinon.stub(authRepository, "findUserByEmail").resolves(fakeUser as any);
      sinon.stub(passwordUtils, "comparePassword").resolves(true);
      sinon.stub(jwtUtils, "signJwt").returns(fakeToken);

      const result = await authService.login({
        email: "alumno@tecsup.edu.pe",
        password: "PasswordCorrecta",
      });

      expect(result.user.tags).to.deep.equal(["JavaScript", "Node.js"]);
    });

    it("debe llamar a comparePassword con la contraseña plana y el hash del usuario", async () => {
      sinon.stub(authRepository, "findUserByEmail").resolves(fakeUser as any);
      const compareStub = sinon.stub(passwordUtils, "comparePassword").resolves(true);
      sinon.stub(jwtUtils, "signJwt").returns(fakeToken);

      await authService.login({
        email: "alumno@tecsup.edu.pe",
        password: "PasswordCorrecta",
      });

      expect(compareStub.calledWith("PasswordCorrecta", fakeUser.password)).to.be.true;
    });
  });

});