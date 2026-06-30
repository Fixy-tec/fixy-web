// ============================================================
// DATASET TESTS — 100 contraseñas distintas
// Valida regla: mínimo 8 caracteres
// ============================================================

function validarPassword(password: string): boolean {
  return password.length >= 8;
}

const passwordsValidas = [
  "Password1",
  "12345678",
  "abcdefgh",
  "ABCDEFGH",
  "Pass1234",
  "MiClave123",
  "Tecsup2024",
  "gabriel123",
  "Secur3P@ss",
  "T3cs@up!2024",
  "P@$$w0rd!",
  "Contra123!",
  "MyP@ssw0rd",
  "Str0ngP@ss",
  "C0mpl3x!Pass",
  "12345678901234",
  "aaaaaaaa",
  "        ",
  "password",
  "PASSWORD",
  "passWORD",
  "pass1234",
  "PASS1234",
  "Pass.1234",
  "Pass-1234",
  "Pass_1234",
  "Pass#1234",
  "Pass@1234",
  "Pass!1234",
  "Pass*1234",
  "abcABC123",
  "xYz12345!",
  "qwerty123",
  "iloveyou1",
  "welcome12",
  "dragon123",
  "letmein1!",
  "monkey123",
  "sunshine1",
  "princess1",
  "football1",
  "shadow123",
  "master123",
  "abcdef12",
  "testpass1",
  "admin1234",
  "root12345",
  "linux1234",
  "windows12",
  "android12",
];

const passwordsInvalidas = [
  "",
  " ",
  "a",
  "ab",
  "abc",
  "abcd",
  "abcde",
  "abcdef",
  "abcdefg",
  "1234567",
  "ABCDEFG",
  "Pass123",
  "1234abc",
  "abc1234",
  "ABC1234",
  "pass!@#",
  "P@ss12",
  "Te1!",
  "Aa1!",
  "x1y2z3w",
  "short1!",
  "Aa1",
  "Ab1",
  "Ac1",
  "Ad1",
  "Ae1",
  "Af1",
  "Ag1",
  "Ah1",
  "Ai1",
  "Aj1",
  "Ak1",
  "Al1",
  "Am1",
  "An1",
  "Ao1",
  "Ap1",
  "Aq1",
  "Ar1",
  "As1",
  "At1",
  "Au1",
  "Av1",
  "Aw1",
  "Ax1",
  "Ay1",
  "Az1",
  "Ba1",
  "Bb1",
  "Bc1",
];

describe("🔑 Dataset › 100 contraseñas — mínimo 8 caracteres", () => {

  describe("50 contraseñas válidas — deben ser aceptadas", () => {
    passwordsValidas.forEach((password, index) => {
      it(`[${String(index + 1).padStart(2, "0")}] VÁLIDA: "${password}"`, () => {
        expect(validarPassword(password)).toBe(true);
      });
    });
  });

  describe("50 contraseñas inválidas — deben ser rechazadas", () => {
    passwordsInvalidas.forEach((password, index) => {
      it(`[${String(index + 1).padStart(2, "0")}] INVÁLIDA: "${password}"`, () => {
        expect(validarPassword(password)).toBe(false);
      });
    });
  });

});