# Gastos App

Aplicación full stack de finanzas personales enfocada en uso real diario: tarjetas con fechas de corte y pago, compras a meses sin intereses, deudas, metas de ahorro, flujo proyectado e inteligencia local basada en reglas.

## Stack

- Frontend + backend: Next.js App Router con TypeScript estricto
- Base de datos: PostgreSQL
- ORM: Prisma
- UI: React + Tailwind CSS
- Charts: Recharts
- Auth: email/password con sesión HTTP-only; preparada para agregar OAuth después
- PWA: manifest, icon routes, service worker y metadatos para instalación en iPhone

## Arquitectura

### Decisión principal

Se eligió `Next.js full stack` para reducir fricción entre:

- UI mobile-first
- server components para lectura de datos
- route handlers para API JSON
- server actions para auth
- PWA y deploy sencillo

Esto evita dividir en dos repos o en dos runtimes innecesariamente en esta fase, pero mantiene separación por capas dentro del código.

### Capas

- `app/`
  Rutas, layouts, páginas, manifest, iconos PWA y endpoints HTTP.
- `src/components/`
  Componentes visuales y navegación reutilizable.
- `src/actions/`
  Server actions del dominio de autenticación.
- `src/lib/`
  Infraestructura compartida: Prisma, auth, env, formateo, utilidades.
- `src/server/`
  Lógica de dominio y agregación de datos para dashboard, proyecciones e insights.
- `src/validations/`
  Validaciones Zod para entradas del backend.
- `prisma/`
  Esquema, relaciones y seed realista.

### Módulos funcionales modelados

- Dashboard
- Accounts / Credit Cards
- Loans / Debts
- Transactions
- Recurring Expenses
- Installment Purchases (MSI)
- Savings Goals
- Budgets
- Financial Rules + Spending Insights
- Planned Purchases + Purchase Seasonality
- Notifications
- Settings

## Estructura de carpetas

```text
.
├── app
│   ├── (app)
│   │   ├── accounts
│   │   ├── budgets
│   │   ├── cards/[cardId]
│   │   ├── dashboard
│   │   ├── debts
│   │   ├── goals
│   │   ├── installments
│   │   ├── loans/[loanId]
│   │   ├── planned-purchases
│   │   ├── projection
│   │   ├── categories
│   │   ├── recurring-expenses
│   │   ├── transactions
│   │   └── settings
│   ├── (auth)
│   │   ├── sign-in
│   │   └── sign-up
│   ├── api
│   │   ├── accounts
│   │   ├── health
│   │   ├── insights
│   │   ├── planned-purchases
│   │   ├── savings-goals
│   │   └── transactions
│   ├── apple-icon.tsx
│   ├── globals.css
│   ├── icon.tsx
│   ├── layout.tsx
│   ├── manifest.ts
│   └── page.tsx
├── prisma
│   ├── schema.prisma
│   └── seed.ts
├── public
│   └── sw.js
├── src
│   ├── actions
│   ├── components
│   ├── lib
│   ├── server
│   └── validations
├── .env.example
├── compose.yml
└── docker-compose.yml
```

## Modelo de datos

Entidades principales ya incluidas en Prisma:

- `User`
- `Settings`
- `Account`
- `CreditCard`
- `Loan`
- `Transaction`
- `Category`
- `Subcategory`
- `Tag`
- `TransactionTag`
- `RecurringExpense`
- `InstallmentPurchase`
- `InstallmentPayment`
- `SavingsGoal`
- `Budget`
- `FinancialRule`
- `SpendingInsight`
- `PlannedPurchase`
- `PurchaseSeasonality`
- `Notification`

### Decisión de modelado importante

`Account` es el ledger base. `CreditCard` y `Loan` extienden esa cuenta con perfil 1:1. Esto simplifica:

- transferencias
- pagos entre cuentas y tarjetas
- movimientos de ahorro
- futuras integraciones bancarias
- cálculo de balances y flujo

## Flujo funcional actual

Ya quedan implementados:

- auth por email/password
- seed con usuario demo
- dashboard con KPIs, barras de progreso, alertas e ingresos/gastos
- CRUD de movimientos con edición y eliminación
- ajuste real de saldos de cuentas y metas al registrar movimientos
- CRUD de gastos fijos y suscripciones
- CRUD de categorías, subcategorías y etiquetas
- categorías, subcategorías y etiquetas base creadas automáticamente por usuario
- CRUD de metas de ahorro
- CRUD de presupuestos
- CRUD de compras planeadas con ligas a metas y seasonality
- CRUD de cuentas líquidas
- CRUD de tarjetas de crédito
- CRUD de préstamos personales
- CRUD de compras MSI con generación automática de calendario de pagos
- liquidación anticipada manual de compras MSI
- detalle enriquecido de tarjeta con línea disponible, cargos MSI futuros y alertas
- detalle enriquecido de préstamo con escenarios de aceleración
- simulador de compra por tarjeta con lógica de corte, vencimiento y mes de cargo
- simulador de flujo con recorte variable, nueva MSI y ahorro adicional
- simulador de pago extra a deuda
- simulador de compra contado vs MSI con impacto sobre compromiso mensual
- configuración editable de moneda, ingresos, estrategia y horizonte de proyección
- reglas financieras editables desde UI para umbrales, microgastos, concentración y riesgo
- insights automáticos en dashboard, deuda, proyección y compras planeadas
- vista de cuentas y tarjetas
- vista de deudas con sugerencia de prioridad
- vista de MSI con progreso y amortización
- vista de metas
- vista de presupuestos
- vista de proyección 3/6/12 meses
- vista de compras planeadas con seasonality base
- endpoints JSON base para `accounts`, `transactions`, `savings-goals`, `insights` y `planned-purchases`

## Operación diaria

### Módulos CRUD activos

- `/transactions`
  Captura y administra ingresos, gastos, transferencias, pagos y aportaciones.
- `/recurring-expenses`
  Administra gastos fijos, próximos cobros y obligatoriedad.
- `/categories`
  Administra categorías, subcategorías y etiquetas personalizadas.
  La app crea un set inicial útil para arrancar sin captura manual.
- `/goals`
  Administra metas de ahorro con objetivo, progreso, prioridad y cuenta asociada.
- `/budgets`
  Administra presupuestos globales, por categoría o por subcategoría.
- `/planned-purchases`
  Administra wishlist, estrategia de compra, rango esperado y ahorro vinculado.
- `/accounts`
  Administra cuentas líquidas y tarjetas con corte, vencimiento, límite y saldo.
- `/installments`
  Administra compras MSI, primer cargo, mensualidades y saldo pendiente.
- `/debts`
  Administra préstamos y mantiene la vista priorizada de deuda.
- `/settings`
  Personaliza configuración base y reglas del motor de insights.

### Nota de consistencia

Las server actions de movimientos ya actualizan:

- balance de cuenta origen
- balance de cuenta destino
- progreso de meta de ahorro si la transacción está ligada a una meta

Esto mantiene coherencia entre captura operativa y dashboard.

Las nuevas server actions también mantienen editable desde UI:

- metas de ahorro
- presupuestos mensuales
- compras planeadas y su estrategia
- cuentas líquidas
- tarjetas de crédito
- préstamos
- compras MSI
- settings y reglas financieras

## Defaults por usuario

Al iniciar sesión en una cuenta nueva o existente, la app asegura automáticamente una base mínima de taxonomía:

- categorías como `Vivienda`, `Comida`, `Despensa`, `Suscripciones`, `Servicios`, `Transporte`, `Salud`, `Ahorro`, `MSI` y `Pago de deuda`
- subcategorías iniciales para arrancar captura diaria sin configuración previa
- etiquetas base como `Fijo`, `Planeado`, `Impulso` y `Quincena`

Esto evita que el primer uso quede bloqueado por falta de estructura.

## Simulación financiera

Ya hay simuladores activos en:

- `/projection`
  Ajusta recorte de gasto variable, ahorro extra, nueva carga MSI y pago adicional.
- `/debts`
  Estima meses e interés que podrías ahorrar al meter pago extra a una deuda.
- `/planned-purchases`
  Compara esperar, ahorrar más o comprar a MSI con impacto sobre tu flujo real.
- `/cards/[cardId]`
  Simula en qué corte cae una compra y cuándo empieza a pegar en flujo.

## Inteligencia local

La capa de insights ya mezcla:

- señales automáticas de presupuesto, metas, MSI, microgastos y concentración de pagos
- reglas configurables por usuario en `/settings`
- soporte para insights persistidos en base de datos

Esto deja lista la arquitectura para conectar después scraping, APIs bancarias o IA sin rehacer la capa visual.

## Setup local

### 1. Variables

```bash
cp .env.example .env
```

### 2. Levantar PostgreSQL con Podman

```bash
podman compose up -d
```

Si tu instalación no incluye `podman compose`, puedes levantar la base así:

```bash
podman volume create gastosapp_postgres_data
podman run -d \
  --name gastosapp-postgres \
  -e POSTGRES_DB=gastosapp \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5433:5432 \
  -v gastosapp_postgres_data:/var/lib/postgresql/data \
  docker.io/library/postgres:16-alpine
```

La app usa `localhost:5433` por defecto para no chocar con una instalación local existente de PostgreSQL en `5432`.

### 3. Instalar dependencias

```bash
npm install
```

### 4. Generar cliente Prisma

```bash
npm run prisma:generate
```

### 5. Crear tablas

```bash
npm run prisma:migrate -- --name init
```

### 6. Seed demo

```bash
npm run db:seed
```

### 7. Levantar app

```bash
npm run dev
```

### Apagar PostgreSQL

Con `podman compose`:

```bash
podman compose down
```

Con contenedor directo:

```bash
podman stop gastosapp-postgres
podman rm gastosapp-postgres
```

### Usuario demo

- Email: `demo@gastosapp.local`
- Password: `Demo12345!`

## Scripts

- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`
- `npm run postinstall`
- `npm run prisma:generate`
- `npm run prisma:migrate`
- `npm run prisma:migrate:deploy`
- `npm run prisma:studio`
- `npm run db:seed`

## Deploy a producción

### Ruta recomendada

- App: Vercel
- Base de datos: PostgreSQL administrado
- Migraciones: Prisma `migrate deploy`

Esta app ya está en buen punto para ese esquema porque:

- Next.js corre bien en entorno Node administrado
- Prisma ya está separado del flujo local
- la PWA depende del navegador, no del proveedor de hosting

### Variables de entorno de producción

Configura estas variables en tu proveedor:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DB?schema=public"
DIRECT_URL="postgresql://USER:PASSWORD@HOST:PORT/DB?schema=public"
AUTH_SECRET="usa-un-secreto-largo-de-32-caracteres-o-mas"
APP_URL="https://tu-dominio.com"
```

### Opción 1: Vercel + PostgreSQL administrado

1. Sube este proyecto a GitHub.
2. Crea un proyecto en Vercel e impórtalo desde ese repo.
3. En Vercel, agrega `DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET` y `APP_URL`.
4. Usa como dominio principal tu dominio real, por ejemplo `https://finanzas.tudominio.com`.
5. Ejecuta las migraciones de producción:

```bash
npm install
npm run prisma:migrate:deploy
```

6. Si quieres cargar la demo inicial:

```bash
npm run db:seed
```

7. Despliega.

Notas:

- `postinstall` ya corre `prisma generate`, así que el cliente Prisma se genera en install.
- si usas Supabase, `DATABASE_URL` debe ser la URL para runtime y `DIRECT_URL` una conexión directa o session pooler para migraciones
- En producción usa `prisma migrate deploy`, no `prisma migrate dev`.
- Si vas a usar datos reales, no corras `db:seed` sobre una base ya poblada.
- Hay un [vercel.json](/Users/alonsoreyes/Documents/GastosApp/vercel.json) mínimo listo para este proyecto.

### GitHub Actions + Vercel

El repo ahora incluye [production-deploy.yml](/Users/alonsoreyes/Documents/GastosApp/.github/workflows/production-deploy.yml) para:

- correr `npm ci`
- validar lint
- ejecutar `prisma migrate deploy`
- construir con Vercel CLI
- publicar a producción

Secrets requeridos en GitHub:

- `DATABASE_URL`
- `DIRECT_URL`
- `AUTH_SECRET`
- `APP_URL`
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

Recomendación operativa:

- deja este workflow como dueño del deploy a producción
- desactiva auto-deploy directo de Vercel sobre `main` para no duplicar despliegues

### Opción 2: VPS propio con Podman

Si prefieres montarlo en tu propio servidor:

1. Provisiona un VPS con Node 20+ y PostgreSQL o una base administrada.
2. Clona el repo en el servidor.
3. Crea `.env` con valores de producción.
4. Instala dependencias y corre:

```bash
npm install
npm run prisma:migrate:deploy
npm run build
npm run start
```

5. Pon un reverse proxy delante, por ejemplo Nginx o Caddy.
6. Sirve la app detrás de HTTPS con tu dominio.

### Checklist antes de abrir al público

- `APP_URL` debe apuntar al dominio final
- `AUTH_SECRET` no debe ser el de ejemplo
- la base debe tener backups
- corre `npm run prisma:migrate:deploy` en cada release con cambios de esquema
- verifica login, service worker y manifest desde el dominio real

## PWA en iPhone

1. Abre la app en Safari.
2. Inicia sesión.
3. Toca compartir.
4. Selecciona `Agregar a pantalla de inicio`.
5. La app usa `display: standalone`, icon route, manifest y service worker para experiencia tipo app.

## Seguridad y privacidad

- Sesión en cookie `HTTP-only`
- No hay secretos hardcodeados
- Auth local sin dependencia obligatoria de terceros
- Validación de inputs con Zod
- Prisma evita SQL sin parametrización
- El modelo permite aislar o cifrar campos sensibles en una fase posterior

## Preparado para futuras integraciones

- OAuth: se puede añadir proveedor sin rehacer la capa visual
- Bancos: el modelo `Account` + `Transaction` ya soporta ingestión externa
- IA: `FinancialRule`, `SpendingInsight` y `PurchaseSeasonality` sirven como capa híbrida local + IA
- Scraping/APIs: `PlannedPurchase` ya separa wishlist y base de conocimiento

## Backlog siguiente fase

- reglas editables desde UI
- cron local para regenerar insights
- importación CSV/OFX
- cifrado por campo para notas sensibles
- soporte OAuth con Auth.js
- tests de dominio y route handlers
- notificaciones push web
- refinamiento exacto de cálculo de corte/pago por tarjeta y simulación multi-tarjeta

## Decisiones UX/UI

- mobile-first con bottom navigation
- sidebar persistente en desktop
- estética sobria con contraste alto y mucho espacio en blanco
- visualizaciones compactas y útiles; sin gráficas decorativas
- barras de progreso en ahorro, deuda, MSI y presupuesto
