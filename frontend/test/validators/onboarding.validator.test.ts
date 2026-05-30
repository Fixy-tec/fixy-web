// ============================================================
// UNIT TESTS — Validaciones del Onboarding
// Lógica extraída de: src/views/auth/onboardingView.tsx
// ============================================================

// Simula normalizeWhatsapp del UserProfileContext
// Agrega +51 si no lo tiene, limpia espacios y caracteres no numéricos
function normalizeWhatsapp(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("51")) return "+" + digits;
  return "+51" + digits;
}

function whatsappOk(whatsapp: string): boolean {
  const n = normalizeWhatsapp(whatsapp);
  return n.length >= 12;
}

function canNext(step: number, data: {
  tagNames: string[];
  avatarPath: string;
  whatsapp: string;
}): boolean {
  if (step === 1) return data.tagNames.length > 0;
  if (step === 2) return data.avatarPath !== "";
  if (step === 3) return whatsappOk(data.whatsapp);
  return true;
}

describe("🎯 Onboarding › validaciones por paso", () => {

  // ----------------------------------------------------------
  // Step 1 — Tags
  // ----------------------------------------------------------
  describe("Step 1 › Selección de tecnologías", () => {

    it("NO debe poder continuar sin ningún tag seleccionado", () => {
      expect(canNext(1, { tagNames: [], avatarPath: "", whatsapp: "" })).toBe(false);
    });

    it("debe poder continuar con exactamente 1 tag seleccionado", () => {
      expect(canNext(1, { tagNames: ["JavaScript"], avatarPath: "", whatsapp: "" })).toBe(true);
    });

    it("debe poder continuar con múltiples tags seleccionados", () => {
      expect(canNext(1, { tagNames: ["JavaScript", "React", "Node.js"], avatarPath: "", whatsapp: "" })).toBe(true);
    });

    it("debe poder continuar con todos los tags seleccionados", () => {
      const todosTags = ["AWS", "Arduino", "Dart", "Django", "Docker", "Flutter",
        "Git", "IoT", "Java", "JavaScript", "Kotlin", "Linux",
        "MongoDB", "Next.js", "Python", "React", "SQL", "Spring Boot", "Swift", "TypeScript"];
      expect(canNext(1, { tagNames: todosTags, avatarPath: "", whatsapp: "" })).toBe(true);
    });

    it("NO debe poder continuar si tagNames es array vacío", () => {
      expect(canNext(1, { tagNames: [], avatarPath: "/avatar1.png", whatsapp: "999999999" })).toBe(false);
    });
  });

  // ----------------------------------------------------------
  // Step 2 — Avatar
  // ----------------------------------------------------------
  describe("Step 2 › Selección de avatar", () => {

    it("NO debe poder continuar sin avatar seleccionado", () => {
      expect(canNext(2, { tagNames: ["JavaScript"], avatarPath: "", whatsapp: "" })).toBe(false);
    });

    it("debe poder continuar con un avatar seleccionado", () => {
      expect(canNext(2, { tagNames: ["JavaScript"], avatarPath: "/avatars/avatar1.png", whatsapp: "" })).toBe(true);
    });

    it("debe poder continuar con cualquier path de avatar no vacío", () => {
      expect(canNext(2, { tagNames: [], avatarPath: "/public/fixo_1.png", whatsapp: "" })).toBe(true);
    });
  });

  // ----------------------------------------------------------
  // Step 3 — WhatsApp
  // ----------------------------------------------------------
  describe("Step 3 › Validación de WhatsApp", () => {

    it("debe aceptar número peruano completo: 999999999 (9 dígitos)", () => {
      expect(whatsappOk("999999999")).toBe(true);
    });

    it("debe aceptar número con espacios: '999 999 999'", () => {
      expect(whatsappOk("999 999 999")).toBe(true);
    });

    it("debe aceptar número con prefijo +51 ya incluido", () => {
      expect(whatsappOk("+51999999999")).toBe(true);
    });

    it("debe aceptar número con prefijo 51 sin el +", () => {
      expect(whatsappOk("51999999999")).toBe(true);
    });

    it("NO debe aceptar número vacío", () => {
      expect(whatsappOk("")).toBe(false);
    });

    it("NO debe aceptar número muy corto: '999'", () => {
      expect(whatsappOk("999")).toBe(false);
    });

    it("NO debe aceptar número de solo 8 dígitos", () => {
      expect(whatsappOk("99999999")).toBe(false);
    });

    it("canNext step 3 debe ser false con WhatsApp vacío", () => {
      expect(canNext(3, { tagNames: ["JavaScript"], avatarPath: "/avatar.png", whatsapp: "" })).toBe(false);
    });

    it("canNext step 3 debe ser true con WhatsApp válido", () => {
      expect(canNext(3, { tagNames: ["JavaScript"], avatarPath: "/avatar.png", whatsapp: "999999999" })).toBe(true);
    });

    it("canNext step 3 debe ser false con número incompleto", () => {
      expect(canNext(3, { tagNames: ["JavaScript"], avatarPath: "/avatar.png", whatsapp: "9999" })).toBe(false);
    });
  });

  // ----------------------------------------------------------
  // Step 4 — Links opcionales
  // ----------------------------------------------------------
  describe("Step 4 › Links opcionales", () => {

    it("siempre debe poder terminar en step 4 aunque todo esté vacío", () => {
      expect(canNext(4, { tagNames: [], avatarPath: "", whatsapp: "" })).toBe(true);
    });

    it("siempre debe poder terminar en step 4 aunque tenga datos", () => {
      expect(canNext(4, { tagNames: ["React"], avatarPath: "/avatar.png", whatsapp: "999999999" })).toBe(true);
    });
  });

  // ----------------------------------------------------------
  // normalizeWhatsapp
  // ----------------------------------------------------------
  describe("normalizeWhatsapp()", () => {

    it("debe agregar +51 si el número no lo tiene", () => {
      expect(normalizeWhatsapp("999999999")).toBe("+51999999999");
    });

    it("debe mantener +51 si ya lo tiene", () => {
      expect(normalizeWhatsapp("51999999999")).toBe("+51999999999");
    });

    it("debe limpiar espacios del número", () => {
      expect(normalizeWhatsapp("999 999 999")).toBe("+51999999999");
    });

    it("debe limpiar guiones del número", () => {
      expect(normalizeWhatsapp("999-999-999")).toBe("+51999999999");
    });

    it("debe retornar solo el prefijo si el input es vacío", () => {
      expect(normalizeWhatsapp("")).toBe("+51");
    });
  });
});