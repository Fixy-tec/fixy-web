import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Trend } from "k6/metrics";

const errorRate = new Rate("error_rate");
const loginDuration = new Trend("login_duration");
const registerDuration = new Trend("register_duration");

// ─── Sin fases, ataque directo y sostenido ───────────────
export const options = {
  scenarios: {
    direct_stress: {
      executor: "shared-iterations",
      vus: 2000,            // usuarios virtuales simultáneos desde el segundo 0
      iterations: 300000,   // total exacto de peticiones a repartir entre los VUs
      maxDuration: "5m",    // límite de seguridad por si el server responde muy lento
    },
  },
  thresholds: {
    http_req_duration: ["p(95)<5000"],
    error_rate: ["rate<0.5"],
  },
};

const BASE_URL = "https://fixy-web.onrender.com";
const headers = { "Content-Type": "application/json" };

export default function () {
  const scenario = Math.random();

  if (scenario < 0.3) {
    const res = http.post(
      `${BASE_URL}/api/auth/login`,
      JSON.stringify({ email: "andre.ancco@tecsup.edu.pe", password: "al955tec1845" }),
      { headers }
    );
    loginDuration.add(res.timings.duration);
    check(res, { "login válido - 200/429": (r) => [200, 429].includes(r.status) });
    errorRate.add(res.status >= 500);

  } else if (scenario < 0.5) {
    const res = http.post(
      `${BASE_URL}/api/auth/login`,
      JSON.stringify({ email: "fake@tecsup.edu.pe", password: "wrongpassword" }),
      { headers }
    );
    check(res, { "login inválido - 401/429": (r) => [401, 429].includes(r.status) });
    errorRate.add(res.status >= 500);

  } else if (scenario < 0.7) {
    const res = http.post(
      `${BASE_URL}/api/auth/login`,
      JSON.stringify({ email: "", password: "" }),
      { headers }
    );
    check(res, { "login vacío - 400/429": (r) => [400, 429].includes(r.status) });
    errorRate.add(res.status >= 500);

  } else if (scenario < 0.85) {
    const res = http.post(
      `${BASE_URL}/api/auth/register`,
      JSON.stringify({ email: "usuario@gmail.com", password: "Password123", name: "Test User" }),
      { headers }
    );
    registerDuration.add(res.timings.duration);
    check(res, { "registro inválido - 400": (r) => r.status === 400 });
    errorRate.add(res.status >= 500);

  } else {
    const res = http.get(`${BASE_URL}/health`);
    check(res, { "health check - 200": (r) => r.status === 200 });
    errorRate.add(res.status >= 500);
  }

  sleep(0.1);
}