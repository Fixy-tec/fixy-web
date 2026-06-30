// ============================================================
// DATASET TESTS — 100 números de WhatsApp
// Valida normalización y longitud mínima de 12 chars con +51
// ============================================================

function normalizeWhatsapp(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("51")) return "+" + digits;
  return "+51" + digits;
}

function whatsappOk(whatsapp: string): boolean {
  const n = normalizeWhatsapp(whatsapp);
  return n.length >= 12;
}

const whatsappsValidos = [
  "999999999",
  "987654321",
  "912345678",
  "923456789",
  "934567890",
  "945678901",
  "956789012",
  "967890123",
  "978901234",
  "989012345",
  "900000000",
  "911111111",
  "922222222",
  "933333333",
  "944444444",
  "955555555",
  "966666666",
  "977777777",
  "988888888",
  "999000000",
  "+51999999999",
  "+51987654321",
  "+51912345678",
  "+51923456789",
  "+51934567890",
  "51999999999",
  "51987654321",
  "51912345678",
  "51923456789",
  "51934567890",
  "999 999 999",
  "987 654 321",
  "912 345 678",
  "923 456 789",
  "934 567 890",
  "999-999-999",
  "987-654-321",
  "912-345-678",
  "923-456-789",
  "934-567-890",
  "999.999.999",
  "987.654.321",
  "912.345.678",
  "(999) 999-999",
  "(987) 654-321",
  "9 9 9 9 9 9 9 9 9",
  "9-9-9-9-9-9-9-9-9",
  "+51 999 999 999",
  "+51 987 654 321",
  "+51-999-999-999",
];

const whatsappsInvalidos = [
  "",
  " ",
  "0",
  "1",
  "12",
  "123",
  "1234",
  "12345",
  "123456",
  "1234567",
  "12345678",
  "99999999",
  "9999999",
  "999999",
  "99999",
  "9999",
  "999",
  "99",
  "9",
  "abc",
  "abcdefghi",
  "!@#$%^&*()",
  "--------",
  "........",
  "+",
  "+51",
  "+519",
  "+5199",
  "+51999",
  "+519999",
  "+5199999",
  "+51999999",
  "+519999999",
  "+5199999999",
  "51",
  "519",
  "5199",
  "51999",
  "519999",
  "5199999",
  "51999999",
  "519999999",
"+1999999",
"+44999",
"+529999",
"+559999",
"+569999",
"+579999",
"+589999",
"+5919999",

];

describe("📱 Dataset › 100 WhatsApp — validación +51 Perú", () => {

  describe("50 números válidos — deben ser aceptados", () => {
    whatsappsValidos.forEach((numero, index) => {
      it(`[${String(index + 1).padStart(2, "0")}] VÁLIDO: "${numero}"`, () => {
        expect(whatsappOk(numero)).toBe(true);
      });
    });
  });

  describe("50 números inválidos — deben ser rechazados", () => {
    whatsappsInvalidos.forEach((numero, index) => {
      it(`[${String(index + 1).padStart(2, "0")}] INVÁLIDO: "${numero}"`, () => {
        expect(whatsappOk(numero)).toBe(false);
      });
    });
  });

});