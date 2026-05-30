import { expect } from "chai";
import { hashPassword, comparePassword } from "../../../src/utils/password";

// ============================================================
// UNIT TESTS — utils/password.ts
// Funciones: hashPassword(), comparePassword()
// Sin mocks: bcryptjs se ejecuta real (no toca BD)
// ============================================================

describe("🔐 Utils › password.ts", () => {

  // ----------------------------------------------------------
  // hashPassword()
  // ----------------------------------------------------------
  describe("hashPassword()", () => {

    it("debe retornar un string (el hash)", async () => {
      const hash = await hashPassword("MiPassword123");
      expect(hash).to.be.a("string");
    });

    it("el hash NO debe ser igual a la contraseña original", async () => {
      const password = "MiPassword123";
      const hash = await hashPassword(password);
      expect(hash).to.not.equal(password);
    });

    it("dos hashes de la misma contraseña deben ser DIFERENTES (salt aleatorio)", async () => {
      const password = "MiPassword123";
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);
      expect(hash1).to.not.equal(hash2);
    });

    it("el hash debe comenzar con el prefijo bcrypt '$2b$'", async () => {
      const hash = await hashPassword("cualquierContraseña");
      expect(hash).to.match(/^\$2[ab]\$/);
    });

    it("debe poder hashear una contraseña vacía sin lanzar error", async () => {
      const hash = await hashPassword("");
      expect(hash).to.be.a("string").and.to.not.be.empty;
    });

    it("debe poder hashear contraseñas con caracteres especiales", async () => {
      const hash = await hashPassword("P@$$w0rd!#%&*()");
      expect(hash).to.be.a("string");
    });

    it("debe poder hashear contraseñas muy largas", async () => {
      const longPassword = "a".repeat(100);
      const hash = await hashPassword(longPassword);
      expect(hash).to.be.a("string");
    });
  });

  // ----------------------------------------------------------
  // comparePassword()
  // ----------------------------------------------------------
  describe("comparePassword()", () => {

    it("debe retornar TRUE cuando la contraseña coincide con el hash", async () => {
      const password = "MiPassword123";
      const hash = await hashPassword(password);
      const result = await comparePassword(password, hash);
      expect(result).to.be.true;
    });

    it("debe retornar FALSE cuando la contraseña es incorrecta", async () => {
      const hash = await hashPassword("PasswordCorrecta");
      const result = await comparePassword("PasswordIncorrecta", hash);
      expect(result).to.be.false;
    });

    it("debe retornar FALSE si se compara string vacío contra un hash válido", async () => {
      const hash = await hashPassword("PasswordReal");
      const result = await comparePassword("", hash);
      expect(result).to.be.false;
    });

    it("debe ser case-sensitive: 'Password' y 'password' son diferentes", async () => {
      const hash = await hashPassword("Password");
      const result = await comparePassword("password", hash);
      expect(result).to.be.false;
    });

    it("debe retornar FALSE si el hash fue generado de una contraseña diferente", async () => {
      const hash1 = await hashPassword("ContraseñaA");
      const result = await comparePassword("ContraseñaB", hash1);
      expect(result).to.be.false;
    });

    it("debe funcionar correctamente con contraseñas que incluyen caracteres especiales", async () => {
      const password = "T3cs@up!2024#";
      const hash = await hashPassword(password);
      const result = await comparePassword(password, hash);
      expect(result).to.be.true;
    });

    it("flujo completo: hashear y luego comparar exitosamente", async () => {
      const password = "usuario@tecsup.edu.pe_pass";
      const hash = await hashPassword(password);
      const match = await comparePassword(password, hash);
      expect(match).to.be.true;
    });
  });

});