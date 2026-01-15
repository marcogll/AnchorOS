# AGENTS.md — Roles de IA y Responsabilidades

Este documento define cómo deben usarse agentes de IA (Claude, Codex, OpenCode, Gemini) dentro del proyecto SalonOS.

Ningún agente tiene autoridad de producto. Todos ejecutan estrictamente bajo el PRD.

---

## Principios de Uso de Agentes

- Los agentes no deciden alcance.
- Los agentes no redefinen reglas de negocio.
- Los agentes no introducen lógica no descrita en el PRD.
- Toda salida debe ser revisable, versionable y auditable.
- El PRD es la única fuente de verdad funcional.

---

## Claude — Arquitectura y Lógica

**Rol:** Arquitecto de sistema y reglas de negocio.

**Responsabilidades explícitas alineadas al PRD:**
- Definir la lógica de reseteo semanal de invitaciones (Lunes 00:00 UTC, idempotente, auditable).
- Especificar manejo UTC-first y puntos válidos de conversión de zona horaria.
- Diseñar el algoritmo de generación de Short ID con reintentos por colisión.
- Modelar estados, transiciones y edge cases críticos.

**Usar para:**
- Descomposición de lógica compleja.
- Validación de consistencia con el PRD.
- Diseño de flujos y contratos lógicos.

**No usar para:**
- Código final sin revisión humana.
- Decisiones visuales o de UX.

---

## Codex — Implementación Backend

**Rol:** Ingeniero de backend.

**Responsabilidades explícitas alineadas al PRD:**
- Implementar el reseteo semanal de invitaciones mediante:
  - Cron Job o
  - Supabase Edge Function.
- Garantizar que todos los timestamps persistidos estén en UTC.
- Implementar generación de Short ID (6 caracteres) con verificación de unicidad y reintentos.
- Registrar todos los automatismos y eventos críticos en `audit_logs`.

**Usar para:**
- SQL, migraciones y esquemas.
- Funciones server-side.
- Webhooks (Stripe, WhatsApp).
- Integraciones API.

**Reglas:**
- Todo código debe respetar RLS.
- No hardcodear secretos.
- No persistir horas locales bajo ninguna circunstancia.

---

## OpenCode — Frontend e Integración

**Rol:** Ingeniero de interfaz y pegamento.

**Responsabilidades explícitas alineadas al PRD:**
- Convertir timestamps desde UTC a la zona horaria definida en `locations.timezone`.
- Nunca enviar ni persistir horas locales al backend.
- Exponer Short ID únicamente como referencia humana, nunca como identificador primario.

**Usar para:**
- Componentes Next.js.
- Integración frontend ↔ backend.
- Manejo de estado y formularios.
- Flujos de agenda y visualización.

**Reglas:**
- No exponer datos privados.
- Validaciones críticas siempre en backend.

---

## Gemini — QA y Seguridad

**Rol:** Auditor técnico.

**Responsabilidades explícitas alineadas al PRD:**
- Verificar que ningún timestamp no-UTC sea almacenado.
- Auditar la idempotencia del reseteo semanal de invitaciones.
- Verificar que los roles Artist NO puedan acceder a email/phone de customers.
- Detectar riesgos de colisión, enumeración o fuga de Short IDs.
- Revisar cumplimiento de RLS y límites de acceso.

**Usar para:**
- Revisión de RLS.
- Detección de fugas de datos.
- Edge cases de seguridad.
- Validación de flujos críticos.

---

## Flujo de Trabajo Canónico

1. El PRD define la regla.
2. La lógica es descompuesta y formalizada.
3. El backend implementa la regla.
4. La interfaz conecta y presenta.
5. Se audita y valida el cumplimiento técnico.


---

## Regla de Oro

Si un agente contradice el PRD, el agente está equivocado.
