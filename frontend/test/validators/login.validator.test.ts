// ============================================================
// UNIT TESTS — Validaciones del formulario de Login
// Lógica extraída de: src/views/auth/loginView.tsx
// ============================================================

const TECSUP_REGEX = /^[a-zA-Z0-9._%+-]+@tecsup\.edu\.pe$/;

interface LoginForm {
  email: string;
  password: string;
}

function validateLogin(form: LoginForm): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!TECSUP_REGEX.test(form.email.trim()))
    errors.email = "Debe ser un correo @tecsup.edu.pe";
  if (!form.password)
    errors.password = "Ingresa tu contraseña";
  return errors;
}

describe("🔐 Login › validateLogin()", () => {

  // ----------------------------------------------------------
  // Email — TECSUP_REGEX
  // ----------------------------------------------------------
  describe("Validación de email", () => {

    it("debe aceptar un correo @tecsup.edu.pe válido", () => {
      const errors = validateLogin({ email: "gabriel@tecsup.edu.pe", password: "pass123" });
      expect(errors.email).toBeUndefined();
    });

    it("debe aceptar correo con puntos antes del @", () => {
      const errors = validateLogin({ email: "gabriel.nunez@tecsup.edu.pe", password: "pass123" });
      expect(errors.email).toBeUndefined();
    });

    it("debe rechazar correo @gmail.com", () => {
      const errors = validateLogin({ email: "gabriel@gmail.com", password: "pass123" });
      expect(errors.email).toBe("Debe ser un correo @tecsup.edu.pe");
    });

    it("debe rechazar correo @outlook.com", () => {
      const errors = validateLogin({ email: "gabriel@outlook.com", password: "pass123" });
      expect(errors.email).toBe("Debe ser un correo @tecsup.edu.pe");
    });

    it("debe rechazar correo @hotmail.com", () => {
      const errors = validateLogin({ email: "gabriel@hotmail.com", password: "pass123" });
      expect(errors.email).toBe("Debe ser un correo @tecsup.edu.pe");
    });

    it("debe rechazar email vacío", () => {
      const errors = validateLogin({ email: "", password: "pass123" });
      expect(errors.email).toBe("Debe ser un correo @tecsup.edu.pe");
    });

    it("debe rechazar email sin dominio", () => {
      const errors = validateLogin({ email: "gabriel", password: "pass123" });
      expect(errors.email).toBe("Debe ser un correo @tecsup.edu.pe");
    });

    it("debe rechazar email con dominio parecido pero incorrecto: @tecsup.com", () => {
      const errors = validateLogin({ email: "gabriel@tecsup.com", password: "pass123" });
      expect(errors.email).toBe("Debe ser un correo @tecsup.edu.pe");
    });

    it("debe rechazar email con dominio parecido pero incorrecto: @tecsup.edu", () => {
      const errors = validateLogin({ email: "gabriel@tecsup.edu", password: "pass123" });
      expect(errors.email).toBe("Debe ser un correo @tecsup.edu.pe");
    });

    it("debe ignorar espacios alrededor del email (trim)", () => {
      const errors = validateLogin({ email: "  gabriel@tecsup.edu.pe  ", password: "pass123" });
      expect(errors.email).toBeUndefined();
    });
  });

  // ----------------------------------------------------------
  // Contraseña
  // ----------------------------------------------------------
  describe("Validación de contraseña", () => {

    it("debe aceptar una contraseña cualquiera no vacía", () => {
      const errors = validateLogin({ email: "gabriel@tecsup.edu.pe", password: "cualquiera" });
      expect(errors.password).toBeUndefined();
    });

    it("debe rechazar contraseña vacía", () => {
      const errors = validateLogin({ email: "gabriel@tecsup.edu.pe", password: "" });
      expect(errors.password).toBe("Ingresa tu contraseña");
    });
  });

  // ----------------------------------------------------------
  // Formulario completo
  // ----------------------------------------------------------
  describe("Formulario completo", () => {

    it("debe retornar 0 errores con datos válidos", () => {
      const errors = validateLogin({ email: "alumno@tecsup.edu.pe", password: "Password123" });
      expect(Object.keys(errors)).toHaveLength(0);
    });

    it("debe retornar 2 errores con formulario completamente vacío", () => {
      const errors = validateLogin({ email: "", password: "" });
      expect(Object.keys(errors)).toHaveLength(2);
    });

    it("debe retornar error solo de email si la contraseña es válida", () => {
      const errors = validateLogin({ email: "malo@gmail.com", password: "Password123" });
      expect(errors.email).toBeDefined();
      expect(errors.password).toBeUndefined();
    });

    it("debe retornar error solo de contraseña si el email es válido", () => {
      const errors = validateLogin({ email: "alumno@tecsup.edu.pe", password: "" });
      expect(errors.email).toBeUndefined();
      expect(errors.password).toBeDefined();
    });
  });
});