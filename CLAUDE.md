# Helpy — guía del proyecto para agentes

Plataforma web donde estudiantes publican **solicitudes de ayuda** (asesorías o proyectos), otros
estudiantes **postulan**, se califican mutuamente y ganan **puntos, medallas y ranking**. Tiene
**planes Free/Pro**, **pagos** (pasarela simulada + Yape real), **asesorías pagadas con garantía**
y un **KPI de ROI** en el panel admin. Proyecto del curso de Emprendimiento (TECSUP).

Última actualización de esta guía: 23 oct 2026.

### Decisiones vigentes del propietario (27 oct 2026) — prevalecen sobre lo de abajo

- **Pruebas locales:** `backend/.env` ahora apunta a PostgreSQL local, puerto `55432`,
  base `helpy_demo` (clúster existente de Claude en `%TEMP%/claude/C--Users-emili-Documents-projects-fixy-web/88a00c38-197e-43f2-945e-04c6c3d082a6/scratchpad/pgdata`).
  Backend en `4000` y frontend en `3000` para conservar el callback de Google.
  No asumir que `.env` apunta a Neon: verificar siempre el destino antes de operar.
  No se borraron registros ni se aplicaron migraciones al cambiar esta configuración.

- **Yape eliminado por completo.** Único método de pago: tarjeta en modo demo (`TEST`).
  Se quitaron `POST /payments/{plan,escrow}/yape`, `POST /admin/payments/:id/{approve,reject,payout-sent}`,
  `YapePaymentForm`, `PaymentMethodPanel` y la config de Yape. Las columnas `yape*`/`cardEnabled`
  de `PaymentSettings` siguen en la BD (sin uso; no hacer migraciones destructivas).
- **Indicadores = solo ROI de simulación.** `GET /admin/kpis/roi` usa inversión fija
  `SIMULATION_INVESTMENT_CENTS = 44_100` (S/ 441, monto real del dueño) y todos los ingresos de la
  app (planes APPROVED + comisiones de garantías RELEASED). Devuelve `roi`, `recovered`,
  `remainingCents`, `salesToBreakEven` y `steps` (un escalón por venta). La página muestra la
  etiqueta "Modo demo". Se quitaron el ROI "real", el registro de inversiones
  (`/admin/investments`, la tabla `Investment` queda sin uso) y el "Escenario proyectado".
- **Empezar de cero** se hace solo con `npm run seed:reset -- --yes` contra la base elegida (no hay
  botón en la app). "Eliminar" usuario en el admin es soft delete y **no** borra sus pagos.
- La etiqueta `DemoBadge` ("Modo demo") es el único indicador de que los pagos no son reales y
  debe mantenerse. Cuando se integren pagos reales, habrá que separar real/demo de nuevo.

### Decisiones del propietario (23 oct 2026)

- **El nombre del producto es Helpy.** `fixy-web`, nombres internos, URLs y textos
  heredados con "Fixy" corresponden a esta misma aplicación; no implican que deba
  cambiarse de repositorio para trabajar en Helpy.
- **Se mantiene el stack actual:** Next.js, React, Express, TypeScript, Prisma y
  PostgreSQL. No se implementará una reescritura en .NET ni Flutter en este proyecto.
- **La tarjeta seguirá siendo una simulación sin cobros reales.** No se solicita
  integrar una pasarela real ni introducir gastos para la presentación de clase.
  Las compras de demostración deben conservar su identificación como `TEST` y
  quedar fuera de los ingresos reales y del ROI.
- Yape es un flujo distinto ya implementado: transferencia externa y verificación
  manual del administrador. No es una pasarela automática de tarjetas y no se
  convierte en simulación por esta decisión. No modificarlo sin una tarea específica.
- La presentación puede demostrar registro, compra simulada y activación de Pro.
  Una compra simulada no acredita una venta real; una transferencia acordada para
  devolverla debe describirse como prueba con devolución, no como ingreso comercial.
- La aclaración inicial fue documental. La solicitud posterior autoriza los cambios
  de marca y del escenario de ROI descritos abajo; no se han borrado datos ni desplegado.

### Implementación posterior: escenario de ROI y marca

- La UI usa Helpy; se conservan nombres técnicos de archivos, claves de almacenamiento
  y direcciones existentes para no romper referencias ni inventar contactos.
- El reporte de ROI incluye `simulation`, separado de las cifras reales, con presupuesto
  supuesto fijo `SIMULATION_INVESTMENT_CENTS = 44_100` (S/441, no gasto real).
  Suma ingresos LIVE y TEST elegibles: planes APPROVED y solo comisiones de garantías
  RELEASED. Rechazos, pendientes, retenciones y reembolsos no cuentan.
- El escenario se recalcula desde la base al consultar/actualizar indicadores; sin pagos
  devuelve ingresos cero y ROI de −100%, sin seeds ni registros de inversión inicial.
- Se conservan etiquetas TEST/prueba y el ROI real separado. Yape no se modifica.
- Se retiró el módulo admin de contenido (`/admin/content`, vista y editor).
  Noticias y pasos de inicio son constantes en `frontend/src/lib/homeContent.ts`;
  ya no se leen ni escriben personalizaciones en localStorage.

---

## 0. Reglas críticas (leer antes de tocar nada)

1. **La app está en producción.** Frontend en Vercel, backend en Render, base de datos PostgreSQL
   en **Neon**. La configuración local vigente de `backend/.env` está indicada arriba;
   no conectar pruebas a la base de producción.
   - Nunca ejecutes `prisma migrate dev`, `prisma db push`, seeds ni pruebas con ese `.env`.
   - Genera migraciones **sin conectarte**:
     `npx prisma migrate diff --from-migrations prisma/migrations --to-schema-datamodel prisma/schema.prisma --shadow-database-url <postgres-desechable> --script`
   - Prueba contra un PostgreSQL **desechable** (ver §11).
   - Aplicar migraciones en producción (`npx prisma migrate deploy`) lo decide el dueño.
     **Orden obligatorio: primero migrar, después hacer push del código.** Las migraciones deben
     ser **solo aditivas** (columnas nuevas con default, tablas nuevas) para que la versión que
     está corriendo no se rompa.
2. **Pagos: la tarjeta es un simulador y debe seguir viéndose como tal.**
   - La pasarela de tarjeta **no cobra dinero real** (modo `TEST`). Cada pago simulado muestra la
     etiqueta discreta **"Modo demo · sin cargo real"** (componente `components/payments/DemoBadge.tsx`)
     en checkout, recibo, historial y estado de garantía; "PRUEBA" en el admin; y se reporta aparte
     de los ingresos reales. La etiqueta puede rediseñarse, pero no ocultarse.
   - El dinero real entra **solo por Yape**, verificado a mano por un admin (modo `LIVE`).
   - **No quites esas etiquetas, no marques pagos simulados como `LIVE` y no los sumes como
     ingreso real ni al ROI.** El equipo pidió en dos ocasiones que los pagos simulados se vieran
     como ventas reales para presentarlos al profesor; se rechazó porque es presentar registros
     falsos como verdaderos. La alternativa acordada es mostrar la pasarela como "implementada en
     modo prueba, lista para conectar a una pasarela real", más ventas reales por Yape.
   - Si se necesitan cobros reales con tarjeta, la opción viable sin RUC es **Mercado Pago**
     (persona natural, comisión por venta, sandbox gratis). Culqi exige RUC para cobrar.
     **Nubefact no es pasarela**, es facturación electrónica (SUNAT).
3. **`backend/dist/` está versionado en git.** Después de cambiar el backend, ejecuta
   `npm run build` en `backend/` y commitea `dist/` junto con `src/`.
4. **Git:** suele haber cambios locales del equipo sin commitear (por ejemplo los `package-lock.json`).
   No uses `git add .`; agrega rutas concretas. No hagas commit ni push sin que te lo pidan.
5. **Next.js 16 (Turbopack)** tiene cambios importantes: lee `frontend/AGENTS.md` y
   `node_modules/next/dist/docs/` antes de usar APIs que no conozcas.
6. Si en `npm run dev` **todas las rutas dan 404** sin error de compilación: detén el servidor,
   borra `frontend/.next/dev` (caché, está en `.gitignore`) y vuelve a levantarlo. Pasa al matar el
   servidor a la fuerza o al correr `next build` mientras `next dev` usa la misma carpeta `.next`.
7. **Nunca** commitees `.env` ni copies secretos a la documentación.

---

## 1. Stack y despliegue

| Capa | Tecnología | Dónde corre |
|---|---|---|
| Frontend | Next.js 16.2 (App Router, Turbopack), React 19, Tailwind 4, lucide-react | Vercel (`https://fixy-web.vercel.app`) |
| Backend | Node + Express 4 + TypeScript, Prisma 6.19, Zod 4, socket.io, bcryptjs, jsonwebtoken, express-rate-limit | Render (arranca con `node dist/index.js`) |
| Base de datos | PostgreSQL | Neon (host `*-pooler...neon.tech`) |
| Repo | `git@github.com:Fixy-tec/fixy-web.git`, rama principal `main` | |

No hay librería de gráficos en el frontend: el gráfico del ROI es SVG propio.

**Proyecto relacionado:** `../helpy/` contiene un diseño previo de reescritura con
.NET + Flutter y base de datos nueva. Esa reescritura no es el alcance vigente:
**Helpy es el nombre de esta aplicación y mantiene el stack actual**. El logo
(`frontend/public/logo.png`) ya es el de Helpy, pero quedan textos "Fixy".
No mezcles los archivos de ambos directorios.

---

## 2. Estructura

```
fixy-web/
├── CLAUDE.md                     ← esta guía
├── RECOMENDACIONES_OPTIMIZACION.md  (notas viejas del sistema de recomendaciones)
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/           (9 migraciones, ver §5)
│   │   └── seed.admin.ts         (crea el admin raíz desde ADMIN_EMAIL)
│   ├── prisma.config.ts
│   ├── dist/                     (JS compilado, VERSIONADO)
│   └── src/
│       ├── index.ts              (Express, CORS, rutas, json replacer)
│       ├── prisma.ts             (PrismaClient único)
│       ├── middlewares/          (auth JWT, admin, rate-limit, validate)
│       ├── realtime/             (socket.io namespace /admin)
│       ├── routes/               (auth, users, requests, applications, tags)
│       ├── validators/           (esquemas Zod: auth, request, user, admin, rating, payment, kpis…)
│       ├── utils/                (jwt, password, points, text, tag, validators)
│       └── modules/
│           ├── admin/            (usuarios, logs, dashboard)
│           ├── applications/     (postulaciones + aceptación transaccional)
│           ├── auth/             (registro/login con contraseña + Google OAuth)
│           ├── kpis/             (ROI e inversiones)
│           ├── notifications/
│           ├── payments/         (planes, garantía, Yape, pasarela de prueba)
│           ├── plans/            (plan.utils.ts: reglas Free/Pro)
│           ├── pointlog/  ratings/  recommendations/  requests/  tags/  users/
└── frontend/
    ├── AGENTS.md / CLAUDE.md     (aviso sobre Next 16)
    ├── middleware.ts             (protección de rutas por cookie)
    ├── app/                      (rutas App Router; cada page.tsx monta una vista)
    └── src/
        ├── views/                (pantallas completas)
        ├── components/           (navbar, footer, cards, modals, admin/, payments/)
        ├── context/              (Auth, Request, Notification, Ranking, Tag, Toast, Admin…)
        └── lib/                  (clientes HTTP por dominio + tipos + mappers)
```

---

## 3. Cómo correr en local

Son **dos proyectos**; en la raíz no hay `package.json`.

```bash
# Terminal 1
cd backend
npm run dev          # nodemon + ts-node → http://localhost:4000

# Terminal 2
cd frontend
npm run dev          # → http://localhost:3000
```

Si el `schema.prisma` cambió y la base todavía no tiene esas columnas, el backend falla con
"column does not exist". Primero hay que aplicar la migración (ver §0.1).

### Variables de entorno (solo nombres)

`backend/.env` (plantilla en `backend/.env.example`):
`DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN` (opcional, por defecto `1h`), `GOOGLE_CLIENT_ID`,
`GOOGLE_CLIENT_SECRET`, `FRONTEND_URL` (también arma el redirect de Google),
`BACKEND_URL`, `ALLOWED_ORIGINS` (CORS, separado por comas), `PORT`, `ADMIN_EMAIL`, `ADMIN_NAME`.

`frontend/.env.local` (plantilla en `frontend/.env.example`):
`NEXT_PUBLIC_API_URL` — **incluye `/api` al final** (p. ej. `http://localhost:4000/api`).

### Scripts

| Dónde | Script | Qué hace |
|---|---|---|
| backend | `npm run dev` | servidor con recarga |
| backend | `npm run build` | `tsc` → `dist/` (commitear `dist/`) |
| backend | `npm start` | `node dist/index.js` (Render) |
| backend | `npm run seed:admin` | crea/promueve el admin raíz |
| backend | `npm run seed:reset -- --yes` | **borra toda la actividad y usuarios** salvo Gabriel (admin raíz), Carlosll y LuGut (`prisma/seed.reset.ts`); conserva tags y config de pagos; imprime contraseñas nuevas solo para cuentas sin contraseña. Sin `--yes` solo muestra la base destino |
| frontend | `npm run dev` / `npm run build` / `npm start` | Next.js |
| frontend | `npm run lint` | ESLint (hay errores **preexistentes**: `set-state-in-effect`, comillas sin escapar, imports sin usar) |

---

## 4. Autenticación

- **Registro libre** con cualquier correo: `POST /api/auth/register` `{ name, email, password }`.
  - `name` = nombre de usuario: 2–15 letras, sin espacios ni números (mismas reglas que el onboarding).
    Se verifica que no esté en uso (sin distinguir mayúsculas).
  - Contraseña de 8 a 64 caracteres, con letras y números, guardada con bcrypt.
  - `institution` se completa a partir del dominio del correo: `@tecsup.edu.pe` → `TECSUP`; otros → `null`.
- **Login:** `POST /api/auth/login`. Ante un error responde siempre con un mensaje genérico
  ("Correo o contraseña incorrectos") y con el mismo tiempo de respuesta. Así no revela si el
  correo existe. Si la cuenta se creó con Google y no tiene contraseña, pide usar Google.
  Una cuenta desactivada recibe 403.
- **Google OAuth** (se mantiene para cuentas existentes, ya **sin** restricción de dominio):
  `GET /api/auth/google` → Google → `FRONTEND_URL/api/auth/google/callback` (route handler de
  Next) → `POST /api/auth/google/callback` del backend → token. La app de Google está en modo
  *testing* (solo entran los usuarios de prueba configurados en Google Cloud).
- **JWT** `{ userId, email, role }`, expira en 1 h. El frontend lo guarda en `localStorage.auth_token`
  **y** en la cookie `auth_token` (la cookie la lee `middleware.ts`).
- `GET /api/auth/me` devuelve `{ id, name, email, role, profileCompleted, institution, plan, isPro, planExpiresAt }`.
- Si `profileCompleted = false`, `AuthContext` redirige a `/auth/on-boarding` en las rutas protegidas.
- El rol se lee del JWT: si un admin cambia el rol de alguien, el cambio aplica cuando esa persona vuelve a iniciar sesión.
- Rutas protegidas (middleware + AuthContext): `/applications`, `/find`, `/ranking`, `/users`,
  `/home`, `/admin`, `/checkout`, `/pagos`. Si ya hay sesión, `/auth/login` y `/auth/register`
  redirigen a `/home`. `/planes` es pública.

---

## 5. Modelo de datos (Prisma)

Todos los IDs son UUID (`gen_random_uuid()`), y **los montos de pagos están en céntimos (`Int`)**.
`Request.economicBenefit` es la excepción: un `Float` en soles, heredado del diseño original.

| Modelo | Campos clave / notas |
|---|---|
| `User` | email único, `password?` (null = cuenta Google), `googleId?`, `role` USER/ADMIN, `isRootAdmin`, `isActive` (soft delete), `points`, `medal`, `profileCompleted`, `institution`, **`plan` FREE/PRO**, **`planExpiresAt`** |
| `Profile` | 1:1 con User; `whatsapp` (obligatorio), `career`, `cycle`, `bio`, `avatarUrl`, links, `avgRating`, **`profileViews`** |
| `Tag`, `UserTag`, `RequestTag` | catálogo de habilidades y tablas puente |
| `Request` | `type` ASESORIA/PROYECTO, `status`, `difficulty` 1–5, `basePoints`, `economicBenefit?`, `participantsNeeded` (siempre 1 en asesorías), `deadline`, `isExpired`, **`isFeatured`** |
| `Application` | única por (request, applicant); `status` PENDIENTE/ACEPTADA/RECHAZADA; **`payment?`** (1:0..1) |
| `Rating` | única por (application, rater); 1–5 estrellas; no se puede editar ni borrar |
| `PointLog` | historial de puntos y cambios de medalla |
| `Notification` + `NotificationRecipient` | tipos: APPLICATION_RECEIVED/ACCEPTED/REJECTED, REQUEST_COMPLETED, NEW_MATCH, RANK_UP, **PAYMENT_UPDATE** |
| `DeviceToken`, `AdminLog` | tokens de push / auditoría de acciones de admin |
| **`Payment`** | `code` (FX-XXXXXXXX), `purpose` PLAN_SUBSCRIPTION/ASESORIA_ESCROW, `method` CARD/YAPE, **`mode` TEST/LIVE**, `status` PENDING/APPROVED/REJECTED/HELD/RELEASED/REFUNDED, `amountCents`, `commissionCents`, `payoutCents`, `payerId`, `payeeId?`, `applicationId?` (único, SetNull), `planPeriod`, `cardBrand`/`cardLast4`/`cardHolder` (**nunca el número completo ni el CVV**), `yapeOperation`, `declineReason`, fechas de revisión/liberación/reembolso/transferencia |
| **`PaymentSettings`** | fila única `id = 1` (CHECK): `proMonthlyCents` 990, `proYearlyCents` 8990, `freeCommissionBps` 1000 (10%), `cardEnabled`, `yapeEnabled`, `yapePhone`, `yapeHolder`, cuenta de destino (`payoutBank`, `payoutHolder`, `payoutAccount`, `payoutCci`; solo admin) |
| **`Investment`** | inversión del negocio para el ROI: `concept`, `category` (INFRAESTRUCTURA/MARKETING/DISENO/DESARROLLO/OTROS), `amountCents > 0`, `spentAt` |

**Migraciones** (`backend/prisma/migrations/`):
`20260423060417_init`, `20260425231626_init`, `20260529023906_update_schema_relationships`,
`20260529071916_make_whatsapp_optional`, `20260529162115_wpp_required`,
`20260622174314_add_admin_module`, `20260623120000_google_oauth`,
**`20261022120000_plans_and_payments`**, **`20261023120000_investments_roi`**.
Las dos últimas son aditivas e incluyen CHECK constraints escritos a mano (Prisma no los modela,
pero `migrate diff` tampoco los marca como drift).

---

## 6. Reglas de negocio

### 6.1 Solicitudes y postulaciones
- Estados de la solicitud: `ABIERTA → (EN_REVISION) → EN_PROCESO → COMPLETADA` o `CANCELADA`.
- **Expiración perezosa:** al listar o abrir solicitudes se ejecuta `expireOverdueRequests()`.
  Si venció el `deadline`: `EN_PROCESO → COMPLETADA`, y `ABIERTA/EN_REVISION → CANCELADA`.
- El creador puede **marcar como completada** una solicitud `EN_PROCESO`
  (`POST /requests/:id/complete`). Eso avisa a los aceptados y habilita las calificaciones.
- Al aceptar postulantes hasta llenar `participantsNeeded`, la solicitud pasa a `EN_PROCESO`.
  La aceptación es transaccional (`acceptApplicationInTx`, compartida con los pagos).
- Nadie puede postular a su propia solicitud. Solo se postula a solicitudes ABIERTA/EN_REVISION.
- La UI solo permite editar solicitudes ABIERTA/EN_REVISION (el backend no valida el estado). El
  backend **sí** bloquea cualquier edición, cancelación o borrado mientras haya un pago PENDING/HELD (409).

### 6.2 Calificaciones, puntos y medallas (`utils/points.utils.ts`)
- Solo se califica con la solicitud COMPLETADA y la postulación ACEPTADA. Cada parte califica una vez.
- Puntos base por dificultad: 1→50, 2→100, 3→180, 4→280, 5→400.
- Modificador al calificado: 5★ ×1.5, 4★ ×1.2, 3★ ×1.0, 2★ −30 pts, 1★ −80 pts. El creador recibe un bono del 20%.
- Medallas: HIERRO 0–299, BRONCE 300–799, PLATA 800–1799, ORO 1800–3499,
  DIAMANTE 3500–5999, MAESTRO 6000–9999, CHALLENGER 10000+.

### 6.3 Planes Free / Pro (`modules/plans/plan.utils.ts`)
| | Free | Pro |
|---|---|---|
| Solicitudes activas a la vez (ABIERTA/EN_REVISION/EN_PROCESO) | **3** | ilimitadas |
| Postulaciones en 7 días móviles | **5** | ilimitadas |
| Solicitudes destacadas (`isFeatured`, primeras en el feed) | no | sí |
| Insignia Pro (navbar, perfil, ranking) | no | sí |
| Comisión al cobrar asesorías | 10% (configurable) | 0% |
| Estadísticas (`GET /users/me/stats`: visitas al perfil, tasa de aceptación, ganancias) | no (403 `PLAN_REQUIRED`) | sí |

- Pro está activo solo si `plan = PRO` **y** `planExpiresAt > ahora` (`isProActive`). No hay renovación automática.
  Si se compra antes de que venza, el tiempo nuevo se suma al que queda.
- Al activarse Pro se marcan como destacadas las solicitudes abiertas del usuario. Las que crea
  siendo Pro nacen destacadas.
- Al superar un límite se responde 403 con `code: PLAN_LIMIT_REACHED` y un mensaje que menciona
  "plan Free". El frontend detecta ese texto y muestra "Ver planes →".
- Las visitas al perfil se cuentan en `GET /users/:id` cuando quien mira no es el dueño.

### 6.4 Pagos (`modules/payments/`)
**Tarjeta (TEST, simulada)** — `card.utils.ts`:
- Valida como una pasarela real: algoritmo de Luhn, marca (Visa/Mastercard/Amex/Diners),
  vencimiento y CVV (4 dígitos en Amex). El frontend muestra "procesando" durante unos 1.2 s.
- Tarjetas de prueba: cualquier número válido se aprueba, salvo estas:
  `4000000000000002` (rechazada por el banco), `4000000000009995` (fondos insuficientes),
  `4000000000000069` (vencida según el banco), `4000000000000127` (CVV incorrecto).
  Las sugeridas en la UI: `4242 4242 4242 4242` y `5555 5555 5555 4444`.
- Un rechazo se guarda como `REJECTED` (sin `applicationId`, para no bloquear un reintento) y responde 402 `CARD_DECLINED`.

**Yape (LIVE, real):**
- Solo está disponible si el admin configuró `yapePhone`. El usuario yapea, envía el número de
  operación (4 a 12 dígitos) y el pago queda `PENDING`.
- Un número de operación no se puede repetir (salvo en pagos rechazados). Cada usuario puede tener solo un pago de plan pendiente a la vez.
- El admin **verifica**: el plan pasa a `APPROVED` (y se activa Pro) y la garantía pasa a `HELD`
  (y acepta al postulante). Si **rechaza**, queda `REJECTED` con un motivo, y se desvincula de la
  postulación para permitir otro intento.

**Planes:** `POST /payments/plan/card|yape { period: MONTHLY|YEARLY, ... }`.

**Asesorías en garantía (escrow):**
- Aplica a una solicitud **ASESORIA con `economicBenefit > 0`**. Los proyectos pagados no usan garantía.
- Aceptar con `PATCH /applications/:id {status: ACEPTADA}` responde **402 `PAYMENT_REQUIRED`**.
  La única forma de aceptar es `POST /payments/escrow/card|yape { applicationId }`, que solo puede hacer el creador.
- Con tarjeta, el pago queda `HELD` y el postulante aceptado en la **misma transacción**. Con Yape queda `PENDING` hasta que el admin lo verifique.
- **Liberación automática:** cuando existen **las dos** calificaciones (creador → ayudante y
  ayudante → creador), `releaseEscrowIfBothRated` pasa el pago a `RELEASED`. Calcula la comisión
  según el plan del ayudante **en ese momento** y la diferencia queda en `payoutCents`. Es
  idempotente: usa `updateMany where status = HELD`.
- El admin puede **liberar** a mano (si alguien nunca calificó), **reembolsar** (`REFUNDED`) y,
  en pagos LIVE liberados, **marcar como transferido** al ayudante (`payoutSentAt`).
- Mientras haya un pago PENDING/HELD **no se puede**: retirar ni modificar la solicitud (409),
  retirar la postulación, ni desactivar a ninguno de los dos usuarios desde el admin.
- Cada cambio de estado notifica con `PAYMENT_UPDATE` (`data.paymentId`). La campana lleva a `/pagos/:id`.

### 6.5 KPI de ROI (`modules/kpis/`)
- `ROI = (Ingresos − Inversión) / Inversión`. Es `null` si la inversión es 0.
- **Ingresos = solo dinero LIVE:** planes `APPROVED` (monto completo, fecha `reviewedAt`) +
  **comisiones** de garantías `RELEASED` (fecha `releasedAt`). Los pagos `TEST` se informan aparte
  (`excludedTest`) y **no entran al cálculo**.
- Inversión = suma de `Investment`, que el admin registra.
- Serie mensual acumulada en hora de Lima (UTC−5), desde el primer movimiento hasta el mes actual.
  `breakEvenMonth` = primer mes en que los ingresos acumulados alcanzan a la inversión acumulada.
- Las vistas **Indicadores** y **Pagos** del admin se recargan solas con cada evento del socket
  `admin:dashboard:update` (que emiten pagos, verificaciones, liberaciones y reembolsos): durante
  una demo el ROI cambia paso a paso sin recargar.
- El simulador "Escenario proyectado" se calcula en el frontend. Parte de las cifras reales de hoy
  (nuevos Pro por mes, cancelación mensual, gasto mensual, horizonte) y está etiquetado como
  proyección.

---

## 7. API (todas bajo `/api`)

| Prefijo | Endpoints |
|---|---|
| `/auth` | `POST /register`, `POST /login` (ambos con rate-limit 20/15 min), `GET /google`, `GET|POST /google/callback`, `POST /logout`, `GET /me` |
| `/users` | `GET /me`, `PATCH /me`, `GET /me/stats` (Pro), `GET /ranking` (incluye `isPro`), `GET /` (admin), `GET /:id` (incluye `isPro`, suma visita) |
| `/requests` | `GET /` (públicos; destacadas primero), `GET /:id`, `POST /`, `PATCH /:id`, `DELETE /:id`, `POST /:id/extend-deadline`, `POST /:id/complete` |
| `/applications` | `GET /`, `GET /:id`, `POST /`, `PATCH /:id`, `DELETE /:id` |
| `/ratings` | `POST /` (creador→postulante), `POST /applicant` (postulante→creador), `GET /:id`, `GET /user/:userId` (`PUT`/`DELETE` bloqueados a propósito) |
| `/payments` | `GET /config` (**público**: precios, métodos, Yape, límites Free), `GET /me`, `GET /escrow/request/:requestId`, `POST /plan/card`, `POST /plan/yape`, `POST /escrow/card`, `POST /escrow/yape` (los POST con rate-limit 15/15 min), `GET /:id` (pagador, beneficiario o admin) |
| `/admin` (rol ADMIN) | `GET /dashboard`, `GET /logs`, `GET /users?status=ACTIVE|INACTIVE|ALL` (por defecto ACTIVE), `PATCH /users/:id/role`, `DELETE /users/:id` (soft delete), `GET /payments`, `GET /payments/summary`, `GET|PUT /payments/settings`, `POST /payments/:id/{approve,reject,release,refund,payout-sent}`, `GET /kpis/roi`, `GET|POST /investments`, `DELETE /investments/:id` |
| `/notifications` | `GET /`, `DELETE /`, … |
| `/tags`, `/pointlog`, `/recommendations` | catálogo, historial de puntos, recomendaciones/match |

Convención de errores: `{ message, code? }`. Códigos de negocio: `PLAN_LIMIT_REACHED`,
`PLAN_REQUIRED`, `PAYMENT_REQUIRED` (402), `CARD_DECLINED` (402), `CARD_INVALID`,
`GOOGLE_ONLY_ACCOUNT`, `ACCOUNT_DISABLED`.

Las acciones de admin quedan en `AdminLog` (`CHANGE_ROLE`, `SOFT_DELETE_USER`,
`PAYMENT_APPROVED`, `PAYMENT_REJECTED`, `ESCROW_RELEASED`, `ESCROW_REFUNDED`, `PAYOUT_SENT`,
`PAYMENT_SETTINGS_UPDATED`, `INVESTMENT_CREATED`, `INVESTMENT_DELETED`). Las etiquetas en
español están en `frontend/src/components/admin/AdminLogTimeline.tsx`.

---

## 8. Frontend

**Rutas** (`frontend/app/`): `/` (landing), `/home`, `/find`, `/ranking`, `/applications`,
`/applications/crear`, `/applications/[id]`, `/applications/[id]/editar`, `/users/[id]`,
`/auth/login`, `/auth/register`, `/auth/on-boarding`, `/auth/google/complete`,
`/api/auth/google/callback` (route handler), `/planes`, `/checkout?period=MONTHLY|YEARLY`,
`/pagos`, `/pagos/[id]` (recibo), `/admin` + `/admin/{dashboard,users,users/[id],payments,indicadores,logs}`,
`/forbidden`, `not-found`.

**Patrón:** `app/**/page.tsx` es delgado (navbar + vista) y la lógica vive en `src/views/**`.
Los clientes HTTP están en `src/lib/*.ts` (uno por dominio: `auth`, `request`, `application`,
`user`, `payment`, `admin`, `notification`, `rating`, `tag`) y leen `NEXT_PUBLIC_API_URL`.
Las vistas que usan `useSearchParams` van envueltas en `<Suspense>`.

**Piezas clave:**
- `components/navBarComponent.tsx`: incluye el enlace Planes. Muestra la insignia Pro, o el botón
  "Mejorar a Pro" si el usuario es Free. En pantallas medianas usa versiones compactas.
- `components/payments/`: `CardPaymentForm` (tarjeta con vista previa, validación y aviso de
  modo prueba), `YapePaymentForm`, `PaymentMethodPanel` (pestañas), `EscrowCheckoutModal`,
  `EscrowStatusCard`.
- `components/ProBadge.tsx`, `components/admin/RoiChart.tsx` (SVG, crosshair + tooltip + tabla;
  colores validados: ingresos `#2a78d6`, inversión `#eb6834`).
- `views/payments/`: `plansView`, `checkoutView`, `myPlanView` (plan, estadísticas, historial), `receiptView`.
- `views/applications/solicitudDetailViewCreator.tsx`: en asesorías pagadas, "Aceptar" se
  convierte en "Pagar S/ X y aceptar"; tiene el botón "Marcar como completada" y muestra el estado de la garantía.
- `views/admin/adminPaymentsView.tsx` (resumen real vs prueba, filtros, acciones, configuración)
  y `adminKpisView.tsx` (ROI).
- `context/RequestContext.tsx` expone `completarSolicitud` y `reloadCurrentDetail`.

**Estilo:** Tailwind con azul `#1a4ca3` (principal), verde azulado `#057f78` (admin/acento),
fondos `#f6f8fb` y `#fefefe`. Sin modo oscuro. Textos en español (Perú), montos con `formatPen()` → `S/ 9.90`.

---

## 9. Panel admin

- **Usuarios:** lista paginada con búsqueda, filtros por rol y por estado (por defecto solo activos)
  y cambio de rol. "Eliminar" desactiva la cuenta (`isActive = false`); no se puede con el admin
  raíz ni si el usuario tiene procesos activos o pagos PENDING/HELD.
- **Pagos:** tarjetas de resumen (ingresos reales vs. de prueba, por verificar, en garantía, por
  transferir, usuarios Pro), tabla con acciones según el estado y **Configuración** (precios,
  comisión, métodos, Yape, cuenta de destino).
- **Indicadores:** ROI con la fórmula aplicada, KPIs, gráfico acumulado, registro de inversiones y simulador.
- Dashboard con actualizaciones en tiempo real por socket.io (namespace `/admin`, autenticado con JWT de admin).

---

## 10. Seguridad implementada

- `app.set("json replacer")` en `backend/src/index.ts` **quita cualquier campo `password`** de
  todas las respuestas JSON. Varias consultas incluyen el usuario completo
  (`creator: { include: { profile } }`), así que no lo quites.
- Rate limits: auth con contraseña 20 cada 15 min por IP; pagos 15 cada 15 min.
  (`loginRateLimiter` existe pero no se usa.)
- No se guarda el PAN ni el CVV. La cuenta de destino solo la ve el admin (`/payments/config` no la expone).
- `trust proxy = 1` (Render) y CORS por lista blanca (`ALLOWED_ORIGINS`).

---

## 11. Cómo probar sin tocar producción

PostgreSQL 18 está instalado en `C:\Program Files\PostgreSQL\18\bin`. Se usa un clúster desechable en otro puerto:

```bash
initdb -D <tmp>/pgdata -U postgres --auth=trust -E UTF8 --locale=C
pg_ctl -D <tmp>/pgdata -o "-p 55432" start
psql -h localhost -p 55432 -U postgres -c "CREATE DATABASE fixy_test;"
# desde backend/, SIEMPRE con la URL explícita (las variables del entorno ganan sobre .env):
DATABASE_URL=postgresql://postgres@localhost:55432/fixy_test npx prisma migrate deploy
DATABASE_URL=postgresql://postgres@localhost:55432/fixy_test PORT=4100 JWT_SECRET=test ALLOWED_ORIGINS=http://localhost:3100 npx ts-node src/index.ts
# frontend contra ese backend:
NEXT_PUBLIC_API_URL=http://localhost:4100/api npx next dev -p 3100
```

Antes de correr cualquier migración, confirma el destino con `npx prisma migrate status`: debe decir `localhost:55432`.
**Login con Google en local:** Google solo devuelve a la URL autorizada
`http://localhost:3000/api/auth/google/callback`, así que para probar OAuth el frontend debe correr
en el puerto **3000** y el backend con `FRONTEND_URL=http://localhost:3000` y ese origen en
`ALLOWED_ORIGINS`. En otro puerto, el login con Google termina en `ERR_CONNECTION_REFUSED`.
Las pruebas E2E de octubre 2026 (64 casos de pagos y 20 de ROI) se hicieron con scripts Node que
llaman a la API real. No están en el repo; si hacen falta, recréalos en `backend/` con el mismo
enfoque. El rate-limit de auth se reinicia al reiniciar el servidor de prueba.

---

## 12. Deuda técnica y pendientes conocidos

- `prisma/seed.admin.ts` todavía exige que `ADMIN_EMAIL` termine en `@tecsup.edu.pe`. Quedó desactualizado con el registro libre.
- No existe "olvidé mi contraseña" (no hay servicio de correo). Las cuentas creadas con Google no tienen contraseña.
- `middleware.ts` usa la convención deprecada de Next 16 (debería pasar a `proxy.ts`). Funciona, pero muestra un aviso.
- `Profile.whatsapp` sigue siendo obligatorio. El admin muestra WhatsApp en la tabla de usuarios.
- `User.institution` tiene `@default("TECSUP")` en la base, aunque el registro nuevo envía `null` para otros dominios.
- Hay errores de lint preexistentes en vistas viejas (no rompen el build: Next 16 no ejecuta lint en `build`).
- Integración real de tarjetas (Mercado Pago Checkout Pro + webhook en Render): **pendiente**, depende de que el equipo cree su cuenta.
- Los textos de la UI dicen "Fixy" aunque el logo ya es Helpy.

---

## 13. Historial reciente (oct 2026)

- Logo reemplazado por `public/logo.png` en navbar, login, onboarding, footer y admin.
- Bug del admin corregido: los usuarios desactivados seguían en la lista. Se agregó el filtro de estado.
- Registro y login con correo y contraseña. Google se mantiene, sin restricción de dominio.
- Planes Free/Pro, pasarela de tarjeta en modo prueba, Yape verificado por admin, garantía en
  asesorías, "marcar como completada", estadísticas Pro, insignias y destacados.
- Se bloqueó la exposición del hash de contraseña en la API.
- KPI de ROI e inversiones en `/admin/indicadores`.
- Migraciones nuevas: `20261022120000_plans_and_payments` y `20261023120000_investments_roi`.
  **Deben aplicarse en Neon antes de desplegar este código.**
