import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Trend } from "k6/metrics";

// ─── Métricas personalizadas ───────────────────────────────
const errorRate = new Rate("error_rate");
const loginDuration = new Trend("login_duration");
const registerDuration = new Trend("register_duration");

// ─── Configuración de fases ───────────────────────────────
export const options = {
  stages: [
    { duration: "30s", target: 50 },    // Fase 1: Calentamiento
    { duration: "30s", target: 100 },   // Fase 2: Carga moderada
    { duration: "30s", target: 500 },   // Fase 3: Carga alta
    { duration: "30s", target: 1000 },  // Fase 4: Stress test
    { duration: "30s", target: 2000 },  // Fase 5: Pico extremo
    { duration: "30s", target: 0 },     // Fase 6: Bajada gradual
  ],
  thresholds: {
    http_req_duration: ["p(95)<5000"],  // 95% debe responder en menos de 5s
    error_rate: ["rate<0.5"],           // menos del 50% de errores
  },
};

const BASE_URL = "https://fixy-web.onrender.com";

const headers = { "Content-Type": "application/json" };

// ─── Escenarios ───────────────────────────────────────────
export default function () {
  const scenario = Math.random();

  if (scenario < 0.3) {
    // Escenario 1: Login válido (30%)
    const res = http.post(
      `${BASE_URL}/api/auth/login`,
      JSON.stringify({
        email: "andre.ancco@tecsup.edu.pe",
        password: "al955tec1845",
      }),
      { headers }
    );
    loginDuration.add(res.timings.duration);
    check(res, {
      "login válido - status 200 o 429": (r) =>
        r.status === 200 || r.status === 429,
    });
    errorRate.add(res.status >= 500);

  } else if (scenario < 0.5) {
    // Escenario 2: Login con credenciales incorrectas (20%)
    const res = http.post(
      `${BASE_URL}/api/auth/login`,
      JSON.stringify({
        email: "fake@tecsup.edu.pe",
        password: "wrongpassword",
      }),
      { headers }
    );
    check(res, {
      "login inválido - status 401 o 429": (r) =>
        r.status === 401 || r.status === 429,
    });
    errorRate.add(res.status >= 500);

  } else if (scenario < 0.7) {
    // Escenario 3: Login sin body (20%)
    const res = http.post(
      `${BASE_URL}/api/auth/login`,
      JSON.stringify({ email: "", password: "" }),
      { headers }
    );
    check(res, {
      "login vacío - status 400 o 429": (r) =>
        r.status === 400 || r.status === 429,
    });
    errorRate.add(res.status >= 500);

  } else if (scenario < 0.85) {
    // Escenario 4: Registro con email inválido (15%)
    const res = http.post(
      `${BASE_URL}/api/auth/register`,
      JSON.stringify({
        email: "usuario@gmail.com",
        password: "Password123",
        name: "Test User",
      }),
      { headers }
    );
    registerDuration.add(res.timings.duration);
    check(res, {
      "registro email inválido - status 400": (r) => r.status === 400,
    });
    errorRate.add(res.status >= 500);

  } else {
    // Escenario 5: Health check (15%)
    const res = http.get(`${BASE_URL}/health`);
    check(res, {
      "health check - status 200": (r) => r.status === 200,
    });
    errorRate.add(res.status >= 500);
  }

  sleep(0.1);
}