// ============================================================
// DATASET TESTS — 100 emails distintos
// Valida TECSUP_REGEX contra casos reales variados
// ============================================================

const TECSUP_REGEX = /^[a-zA-Z0-9._%+-]+@tecsup\.edu\.pe$/;

const emailsValidos = [
  "gabriel@tecsup.edu.pe",
  "gabriel.nunez@tecsup.edu.pe",
  "gabriel.nunez.arenas@tecsup.edu.pe",
  "g.nunez@tecsup.edu.pe",
  "gnunez@tecsup.edu.pe",
  "g123@tecsup.edu.pe",
  "123gabriel@tecsup.edu.pe",
  "gabriel123@tecsup.edu.pe",
  "GABRIEL@tecsup.edu.pe",
  "Gabriel.Nunez@tecsup.edu.pe",
  "andre.ancco@tecsup.edu.pe",
  "juan.perez@tecsup.edu.pe",
  "maria.garcia@tecsup.edu.pe",
  "luis.torres@tecsup.edu.pe",
  "ana.flores@tecsup.edu.pe",
  "carlos.mendez@tecsup.edu.pe",
  "sofia.ramirez@tecsup.edu.pe",
  "diego.castro@tecsup.edu.pe",
  "valentina.rios@tecsup.edu.pe",
  "sebastian.vega@tecsup.edu.pe",
  "camila.mora@tecsup.edu.pe",
  "alejandro.silva@tecsup.edu.pe",
  "daniela.rojas@tecsup.edu.pe",
  "nicolas.herrera@tecsup.edu.pe",
  "isabella.diaz@tecsup.edu.pe",
  "mateo.reyes@tecsup.edu.pe",
  "luciana.vargas@tecsup.edu.pe",
  "emilio.santos@tecsup.edu.pe",
  "valeria.cruz@tecsup.edu.pe",
  "rodrigo.medina@tecsup.edu.pe",
  "user+tag@tecsup.edu.pe",
  "user-name@tecsup.edu.pe",
  "user_name@tecsup.edu.pe",
  "user%name@tecsup.edu.pe",
  "a@tecsup.edu.pe",
  "ab@tecsup.edu.pe",
  "abc@tecsup.edu.pe",
  "test.email@tecsup.edu.pe",
  "test123.email@tecsup.edu.pe",
  "firstname.lastname@tecsup.edu.pe",
  "nombre.apellido1.apellido2@tecsup.edu.pe",
  "n.apellido@tecsup.edu.pe",
  "x1y2z3@tecsup.edu.pe",
  "alumno2024@tecsup.edu.pe",
  "alumno.2024@tecsup.edu.pe",
  "p.garcia@tecsup.edu.pe",
  "m.rodriguez@tecsup.edu.pe",
  "j.lopez@tecsup.edu.pe",
  "r.martinez@tecsup.edu.pe",
  "estudiante01@tecsup.edu.pe",
  "gabriel.@tecsup.edu.pe",
  ".gabriel@tecsup.edu.pe",
];

const emailsInvalidos = [
  "gabriel@gmail.com",
  "gabriel@outlook.com",
  "gabriel@hotmail.com",
  "gabriel@yahoo.com",
  "gabriel@icloud.com",
  "gabriel@live.com",
  "gabriel@msn.com",
  "gabriel@protonmail.com",
  "gabriel@zoho.com",
  "gabriel@aol.com",
  "gabriel@tecsup.com",
  "gabriel@tecsup.edu",
  "gabriel@tecsup.pe",
  "gabriel@tecsup.org",
  "gabriel@tecsup.net",
  "gabriel@tecsup.edu.com",
  "gabriel@edu.pe",
  "gabriel@.tecsup.edu.pe",
  "@tecsup.edu.pe",
  "gabriel@",
  "gabriel",
  "",
  " ",
  "gabriel @tecsup.edu.pe",
  "gabriel@ tecsup.edu.pe",
  " gabriel@tecsup.edu.pe",
  "gabriel@tecsup.edu.pe ",
  "gabriel@@tecsup.edu.pe",
  "gabriel@tecsup..edu.pe",
  "gabriel@TECSUP.EDU.PE",
  "gabriel@uni.edu.pe",
  "gabriel@pucp.edu.pe",
  "gabriel@usil.edu.pe",
  "gabriel@upc.edu.pe",
  "gabriel@upn.edu.pe",
  "gabriel@ulima.edu.pe",
  "gabriel@unmsm.edu.pe",
  "gabriel@utec.edu.pe",
  "gabriel@utp.edu.pe",
  "gabriel@senati.edu.pe",
  "notanemail",
  "no@email",
  "a@b.c",
  "test@test.test",
  "gabriel@company.com",
  "info@tecsup.edu.pe.extra",
  "gabriel@sub.tecsup.edu.pe",
  "gabriel@tecsup.edu.pe.",
];

describe("📧 Dataset › 100 emails — TECSUP_REGEX", () => {

  describe("50 emails válidos — deben ser aceptados", () => {
    emailsValidos.forEach((email, index) => {
      it(`[${String(index + 1).padStart(2, "0")}] VÁLIDO: ${email}`, () => {
        expect(TECSUP_REGEX.test(email)).toBe(true);
      });
    });
  });

  describe("50 emails inválidos — deben ser rechazados", () => {
    emailsInvalidos.forEach((email, index) => {
      it(`[${String(index + 1).padStart(2, "0")}] INVÁLIDO: "${email}"`, () => {
        expect(TECSUP_REGEX.test(email)).toBe(false);
      });
    });
  });

});