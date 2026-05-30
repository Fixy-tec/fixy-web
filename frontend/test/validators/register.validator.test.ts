// ============================================================
// UNIT TESTS — Validaciones del formulario de Registro
// Lógica extraída de: src/views/auth/registerView.tsx
// ============================================================

const TECSUP_REGEX = /^[a-zA-Z0-9._%+-]+@tecsup\.edu\.pe$/;

interface RegisterForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

function validateRegister(form: RegisterForm): Record<string, string> {
  const errors: Record<string, string> = {};

  if (form.name.trim().length < 3)
    errors.name = "Ingresa tu nombre completo";

  if (!TECSUP_REGEX.test(form.email))
    errors.email = "Debe ser un correo @tecsup.edu.pe";

  if (form.password.length < 8)
    errors.password = "Mínimo 8 caracteres";

  if (form.password !== form.confirmPassword)
    errors.confirmPassword = "Las contraseñas no coinciden";

  return errors;
}

describe("📝 Register › validateRegister()", () => {

  // ----------------------------------------------------------
  // Nombre
  // ----------------------------------------------------------
  describe("Validación de nombre", () => {

    it("debe aceptar nombre con 3 o más caracteres", () => {
      const errors = validateRegister({
        name: "Gabriel",
        email: "g@tecsup.edu.pe",
        password: "Pass1234",
        confirmPassword: "Pass1234"
      });

      expect(errors.name).toBeUndefined();
    });

    it("debe aceptar nombre completo con apellidos", () => {
      const errors = validateRegister({
        name: "Gabriel Núñez Arenas",
        email: "g@tecsup.edu.pe",
        password: "Pass1234",
        confirmPassword: "Pass1234"
      });

      expect(errors.name).toBeUndefined();
    });

    it("debe rechazar nombre vacío", () => {
      const errors = validateRegister({
        name: "",
        email: "g@tecsup.edu.pe",
        password: "Pass1234",
        confirmPassword: "Pass1234"
      });

      expect(errors.name).toBe("Ingresa tu nombre completo");
    });

    it("debe rechazar nombre de 1 carácter", () => {
      const errors = validateRegister({
        name: "G",
        email: "g@tecsup.edu.pe",
        password: "Pass1234",
        confirmPassword: "Pass1234"
      });

      expect(errors.name).toBe("Ingresa tu nombre completo");
    });

    it("debe rechazar nombre de 2 caracteres", () => {
      const errors = validateRegister({
        name: "Ga",
        email: "g@tecsup.edu.pe",
        password: "Pass1234",
        confirmPassword: "Pass1234"
      });

      expect(errors.name).toBe("Ingresa tu nombre completo");
    });

    it("debe rechazar nombre con solo espacios", () => {
      const errors = validateRegister({
        name: "   ",
        email: "g@tecsup.edu.pe",
        password: "Pass1234",
        confirmPassword: "Pass1234"
      });

      expect(errors.name).toBe("Ingresa tu nombre completo");
    });
  });

  // ----------------------------------------------------------
  // Email
  // ----------------------------------------------------------
  describe("Validación de email", () => {

    it("debe aceptar correo @tecsup.edu.pe válido", () => {
      const errors = validateRegister({
        name: "Gabriel",
        email: "gabriel@tecsup.edu.pe",
        password: "Pass1234",
        confirmPassword: "Pass1234"
      });

      expect(errors.email).toBeUndefined();
    });

    it("debe rechazar @gmail.com", () => {
      const errors = validateRegister({
        name: "Gabriel",
        email: "gabriel@gmail.com",
        password: "Pass1234",
        confirmPassword: "Pass1234"
      });

      expect(errors.email).toBe("Debe ser un correo @tecsup.edu.pe");
    });

    it("debe rechazar @outlook.com", () => {
      const errors = validateRegister({
        name: "Gabriel",
        email: "gabriel@outlook.com",
        password: "Pass1234",
        confirmPassword: "Pass1234"
      });

      expect(errors.email).toBe("Debe ser un correo @tecsup.edu.pe");
    });

    it("debe rechazar email vacío", () => {
      const errors = validateRegister({
        name: "Gabriel",
        email: "",
        password: "Pass1234",
        confirmPassword: "Pass1234"
      });

      expect(errors.email).toBe("Debe ser un correo @tecsup.edu.pe");
    });

    it("debe rechazar dominio @tecsup.com (sin .edu.pe)", () => {
      const errors = validateRegister({
        name: "Gabriel",
        email: "gabriel@tecsup.com",
        password: "Pass1234",
        confirmPassword: "Pass1234"
      });

      expect(errors.email).toBe("Debe ser un correo @tecsup.edu.pe");
    });

    it("debe rechazar dominio @tecsup.edu (sin .pe)", () => {
      const errors = validateRegister({
        name: "Gabriel",
        email: "gabriel@tecsup.edu",
        password: "Pass1234",
        confirmPassword: "Pass1234"
      });

      expect(errors.email).toBe("Debe ser un correo @tecsup.edu.pe");
    });
  });

  // ----------------------------------------------------------
  // Contraseña
  // ----------------------------------------------------------
  describe("Validación de contraseña", () => {

    it("debe aceptar contraseña de exactamente 8 caracteres", () => {
      const errors = validateRegister({
        name: "Gabriel",
        email: "g@tecsup.edu.pe",
        password: "Pass1234",
        confirmPassword: "Pass1234"
      });

      expect(errors.password).toBeUndefined();
    });

    it("debe aceptar contraseña mayor a 8 caracteres", () => {
      const errors = validateRegister({
        name: "Gabriel",
        email: "g@tecsup.edu.pe",
        password: "Password123456",
        confirmPassword: "Password123456"
      });

      expect(errors.password).toBeUndefined();
    });

    it("debe rechazar contraseña vacía", () => {
      const errors = validateRegister({
        name: "Gabriel",
        email: "g@tecsup.edu.pe",
        password: "",
        confirmPassword: ""
      });

      expect(errors.password).toBe("Mínimo 8 caracteres");
    });

    it("debe rechazar contraseña de 7 caracteres", () => {
      const errors = validateRegister({
        name: "Gabriel",
        email: "g@tecsup.edu.pe",
        password: "Pass123",
        confirmPassword: "Pass123"
      });

      expect(errors.password).toBe("Mínimo 8 caracteres");
    });

    it("debe rechazar contraseña de 1 carácter", () => {
      const errors = validateRegister({
        name: "Gabriel",
        email: "g@tecsup.edu.pe",
        password: "a",
        confirmPassword: "a"
      });

      expect(errors.password).toBe("Mínimo 8 caracteres");
    });
  });

  // ----------------------------------------------------------
  // Confirmar contraseña
  // ----------------------------------------------------------
  describe("Validación de confirmar contraseña", () => {

    it("debe aceptar cuando ambas contraseñas son iguales", () => {
      const errors = validateRegister({
        name: "Gabriel",
        email: "g@tecsup.edu.pe",
        password: "Pass1234",
        confirmPassword: "Pass1234"
      });

      expect(errors.confirmPassword).toBeUndefined();
    });

    it("debe rechazar cuando las contraseñas no coinciden", () => {
      const errors = validateRegister({
        name: "Gabriel",
        email: "g@tecsup.edu.pe",
        password: "Pass1234",
        confirmPassword: "Pass9999"
      });

      expect(errors.confirmPassword).toBe("Las contraseñas no coinciden");
    });

    it("debe ser case-sensitive: 'Pass1234' y 'pass1234' no coinciden", () => {
      const errors = validateRegister({
        name: "Gabriel",
        email: "g@tecsup.edu.pe",
        password: "Pass1234",
        confirmPassword: "pass1234"
      });

      expect(errors.confirmPassword).toBe("Las contraseñas no coinciden");
    });

    it("debe rechazar confirmar vacío si la contraseña tiene valor", () => {
      const errors = validateRegister({
        name: "Gabriel",
        email: "g@tecsup.edu.pe",
        password: "Pass1234",
        confirmPassword: ""
      });

      expect(errors.confirmPassword).toBe("Las contraseñas no coinciden");
    });
  });

  // ----------------------------------------------------------
  // Formulario completo
  // ----------------------------------------------------------
  describe("Formulario completo", () => {

    it("debe retornar 0 errores con todos los datos válidos", () => {
      const errors = validateRegister({
        name: "Gabriel Núñez",
        email: "gabriel@tecsup.edu.pe",
        password: "Pass1234",
        confirmPassword: "Pass1234",
      });

      expect(Object.keys(errors)).toHaveLength(0);
    });

    it("debe retornar 3 errores con formulario completamente vacío", () => {
      const errors = validateRegister({
        name: "",
        email: "",
        password: "",
        confirmPassword: ""
      });

      expect(Object.keys(errors)).toHaveLength(3);
    });
  });
});