# TournamentX

Frontend navegable para crear, administrar y participar en torneos de esports y deportes tradicionales.

## Estado del proyecto

Este repositorio contiene un prototipo funcional de frontend construido con React, TypeScript, Vite y Tailwind CSS. Los datos son simulados y permanecen únicamente durante la sesión del navegador.

Leyenda de esta revisión:

- ✅ Implementado: existe una vista o interacción funcional en el frontend.
- 🟡 Parcial/demo: está representado visualmente o funciona con estado local, pero requiere más reglas o persistencia.
- ⏳ Pendiente: requiere backend, autenticación, pagos u otra integración real.

## Roles y permisos

TournamentX contempla solamente dos roles globales:

1. **Administrador**.
2. **Jugador-Usuario**.

Organizador y Capitán son permisos contextuales, no roles globales. Un usuario obtiene permisos de Organizador dentro de un torneo que creó y permisos de Capitán dentro de un equipo que creó para una competencia.

### Administrador

- ✅ Panel independiente para supervisar torneos, usuarios y disputas.
- ✅ Suspender o reactivar usuarios en el estado local del frontend.
- ✅ Eliminar cuentas de la lista local.
- 🟡 Eliminar torneos: la lógica impide eliminar torneos en curso; falta cubrir todos los estados y persistir la auditoría en backend.
- ✅ Eliminar equipos solamente cuando no participan en un torneo activo.
- ⏳ Autenticación real del Administrador, permisos de API y registro de auditoría.

### Jugador-Organizador

- ✅ Crear torneos desde un asistente por pasos.
- ✅ Acceder a herramientas adicionales únicamente en torneos creados por el usuario.
- ✅ Consultar resumen, participantes, partidos, bracket, pagos y finanzas.
- ✅ Aceptar o rechazar solicitudes de equipos.
- ✅ Registrar y actualizar marcadores.
- ✅ Configurar comisión del organizador y visualizar cálculos financieros.
- 🟡 Editar configuración, reprogramar, suspender o cancelar: existen controles de demostración, pero sus cambios no se guardan después de recargar.
- 🟡 Gestión de disputas, ganadores y liberación de premios: representada en las vistas y datos simulados; requiere flujo completo y backend.
- ⏳ Pagos, reembolsos, liberación de premios y aportaciones verificadas de patrocinadores.

### Jugador

- ✅ Explorar torneos y consultar sus detalles.
- ✅ Inscribirse individualmente o mediante un equipo usando un flujo local.
- ✅ Crear un equipo temporal para un torneo.
- ✅ Consultar equipos propios, equipos administrados e invitaciones.
- ✅ Aceptar o rechazar invitaciones de demostración.
- ✅ Solicitar acceso de un equipo a torneos privados mediante las solicitudes simuladas.
- ✅ Consultar partidos, resultados y transmisiones disponibles.
- ✅ Consultar y reclamar premios simulados desde la cuenta.
- 🟡 El modelo de equipo registra al responsable del pago y del reclamo del premio; falta conectar esta regla con un pago real.

## Creación de torneos

El asistente actual incluye:

- ✅ Nombre con límite de 20 caracteres.
- ✅ Descripción con límite de 50 caracteres.
- ✅ Categorías Esports y Deportes.
- ✅ Banner opcional con imagen predeterminada por disciplina.
- ✅ Transmisión opcional mediante Twitch o YouTube.
- ✅ Formatos de eliminación directa, doble eliminación, fase de grupos y todos contra todos.
- ✅ Cupos configurables de 4, 8, 16, 32 o 64 participantes.
- ✅ Modalidad individual o por equipos.
- ✅ Reglas predeterminadas por disciplina, además de agregar y eliminar reglas personalizadas.
- ✅ Fechas de inicio, finalización y cierre de inscripción.
- ✅ Torneos públicos o privados en el modelo de datos.
- ✅ Ubicación online o presencial en el modelo y formulario.
- ✅ Inscripción gratuita o de paga.
- ✅ Comisión del organizador y cálculo estimado de la bolsa.
- ✅ Patrocinadores y aportaciones en el estado del asistente.
- ✅ Premio monetario, premio externo o sin premio en el modelo del torneo.
- 🟡 Advertencias y validaciones estrictas para fechas, cupos impares y rango monetario de $1 a $10,000,000 MXN.
- ⏳ Carga real de archivos para banners y logos.
- ⏳ Cobro y resguardo de premios monetarios.

### Disciplinas configuradas

| Disciplina | Modalidades incluidas |
| --- | --- |
| League of Legends | Equipos de mínimo 5 jugadores |
| Fortnite | Individual, dúo y escuadrón de mínimo 4 |
| Marvel Rivals | Equipos de mínimo 6 jugadores |
| Rocket League | Modalidad principal de mínimo 3 jugadores y variantes configurables |
| Dota 2 | Equipos de 5 jugadores |
| Mortal Kombat | Individual |
| Super Smash Bros. Ultimate | Individual |
| Fútbol | Equipos de mínimo 6 u 11 jugadores |
| Básquetbol | 3v3 y 5v5 |
| Tenis | Individual y dobles |
| Ping Pong | Individual |

## Módulos disponibles

### Inicio

- ✅ Presentación principal con acceso a Explorar torneos y Crear torneo.
- ✅ Competencias destacadas y catálogo filtrable.
- ✅ Información básica mediante preguntas frecuentes.
- 🟡 Ganadores destacados y explicación ampliada de inscripciones y premios no tienen una sección independiente actualmente.

### Torneos

- ✅ Botón para crear torneo.
- ✅ Pestañas Explorar torneos, Mis inscripciones y Mis torneos.
- ✅ Buscador, filtros y tarjetas con cupo, premio, inscripción y organizador.
- ✅ Vista detallada con resumen, bracket, partidos, participantes, reglas y premios.
- ✅ Registro individual o por equipo.
- ✅ Botón contextual Administrar torneo cuando el usuario es su creador.
- 🟡 Hace falta un estado vacío específico cuando el usuario no tiene inscripciones o torneos administrados.

### Partidos

- ✅ Pestañas Mis partidos, Partidos que administro, En vivo y Resultados.
- ✅ Filtros por juego y estado.
- ✅ Marcadores, rondas y acceso al torneo relacionado.
- ✅ Actualización local de resultados desde el panel del organizador.
- 🟡 Reprogramación, edición completa del partido y confirmación por ambas partes necesitan un flujo más detallado.

### Equipos

- ✅ Mis equipos, Equipos que administro e Invitaciones.
- ✅ Creación local de un equipo vinculado a un torneo.
- ✅ Nombre, tag, capitán e integrantes simulados.
- ✅ Aceptar o rechazar invitaciones de demostración.
- 🟡 Falta una vista detallada completa del equipo con administración individual de integrantes, pago e inscripción.

### Cuenta

- ✅ Información de usuario, correo y cuentas de juego.
- ✅ Edición local del perfil.
- ✅ Total ganado, saldo pendiente, estadísticas y actividad reciente.
- ✅ Premios disponibles y acción local para reclamarlos.
- ✅ Seguridad, sesiones y estado de verificación representados visualmente.
- 🟡 Cambio de contraseña y saldo transaccional completo aún no están conectados.

## Reglas de negocio representadas

- Los equipos pertenecen al contexto de un torneo.
- El creador de un torneo recibe permisos de Organizador únicamente dentro de ese torneo.
- El creador de un equipo recibe permisos contextuales de Capitán.
- El responsable de pagar la inscripción del equipo también queda registrado como responsable de reclamar el premio.
- Los torneos privados requieren aprobación del Organizador.
- Los torneos públicos aceptan participantes mientras exista cupo.
- Los torneos en curso no pueden eliminarse desde el panel administrativo.
- Los equipos que participan en un torneo activo no pueden eliminarse.

## Revisión contra la especificación ampliada

Esta sección contrasta el frontend actual con el documento funcional más reciente.

### Cumplimiento general

- ✅ Una misma cuenta puede aparecer como participante, Capitán y Organizador en contextos distintos.
- ✅ Solo existen los roles globales Administrador y Jugador-Usuario en el modelo.
- ✅ La navegación principal es `Inicio | Equipos | Torneos | Partidos`.
- ✅ Las herramientas de Organizador aparecen dentro de un torneo propio, sin cambiar de cuenta.
- ✅ Los equipos están asociados a un torneo y el modelo identifica al responsable del pago y del premio.
- ✅ Se representan torneos públicos y privados, solicitudes, inscripciones, premios, patrocinadores, transmisiones, partidos y disputas mediante datos locales.

### Estado de cobertura

| Requisito | Estado actual |
| --- | --- |
| Eliminación directa | ✅ Disponible en el asistente |
| Doble eliminación | ✅ Disponible en el asistente |
| Fase de grupos | ✅ Disponible en el asistente |
| Todos contra todos | ✅ Disponible en el asistente |
| Grupos + eliminación | ✅ Disponible en el asistente |
| Liga | ✅ Disponible en el asistente |
| Battle Royale | ✅ Disponible en el asistente |
| Formato personalizado | ✅ Disponible en el asistente |
| Cupos 8, 16, 32 y 64 | ✅ Accesos rápidos disponibles y campo numérico editable |
| Cantidades impares | ✅ Permitidas con advertencia de ajuste de llave |
| BYE o pase automático | 🟡 El formulario advierte cuándo hace falta; la asignación automática requiere motor de bracket |
| Público o privado | ✅ Selector visible de ingreso directo o aprobación |
| Ubicación online o presencial | ✅ Controles condicionales para plataforma/servidor o recinto/dirección |
| Premio monetario, externo o sin premio | ✅ Los tres tipos se configuran desde el formulario |
| Rango monetario de $1 a $10,000,000 MXN | ✅ Límite y validación aplicados |
| Patrocinadores | 🟡 Se pueden agregar y retirar en la sesión; falta persistencia remota |
| Bolsa basada solo en pagos confirmados | 🟡 La creación muestra una proyección claramente rotulada; el cálculo real requiere pagos persistidos |
| Bloquear aumento de comisión después de recibir pagos | ✅ El panel deshabilita el campo cuando `hasReceivedPayments` es verdadero |
| Stripe | 🟡 Hay transacciones y métodos de pago simulados; no existe conexión real con Stripe |
| Estados completos del premio | ✅ Definidos en TypeScript: pendiente, ganador confirmado, disponible, reclamado, procesando y pagado |
| Distribución y liberación real del premio | ⏳ Requiere backend, Stripe y verificación del ganador |
| Reprogramar partidos | 🟡 Fecha, hora y marcador se editan localmente; falta persistencia remota |
| Directos Twitch/YouTube | ✅ El enlace y la plataforma forman parte del torneo; falta validar y embeber el reproductor real |

### Diferencias por módulo

#### Inicio

- ✅ Presentación, accesos rápidos, conteos de competencias en vivo/próximas, catálogo y últimos campeones.
- 🟡 La información económica es demostrativa hasta conectar pagos reales.

#### Torneos

- ✅ Explorar, Mis inscripciones, Mis torneos e Historial.
- ✅ Crear torneo, consultar detalles e inscribirse.
- ✅ Estados vacíos específicos para inscripciones, torneos administrados e historial.

#### Equipos

- ✅ Mis equipos, Equipos que administro, Invitaciones, Historial y creación dentro de un torneo.
- 🟡 Faltan la vista detallada completa, solicitudes separadas, administración individual de integrantes y pago del equipo.

#### Partidos

- ✅ Mis partidos, Partidos que administro, En vivo y Resultados.
- 🟡 Fecha, hora y marcador pueden editarse en la sesión; faltan confirmación bilateral y resolución detallada de disputas.

#### Cuenta

- ✅ Perfil, correo, fotografía, seguridad, estadísticas, premios y valores económicos simulados.
- 🟡 Cambio de contraseña, saldo real, reembolsos y movimientos completos no están conectados.

#### Historial competitivo

- 🟡 La cuenta muestra actividad y partidos recientes.
- ⏳ No existe todavía un módulo unificado para torneos jugados, torneos organizados, equipos anteriores, posiciones, victorias y premios.

## Pendientes para producción

- Autenticación y autorización real por rol y contexto.
- API y base de datos persistente.
- Carga y almacenamiento de banners, logos y evidencias.
- Pagos de inscripción, comisiones, reembolsos y premios.
- Invitaciones en tiempo real y notificaciones persistentes.
- Validaciones de servidor y auditoría de acciones.
- Streaming embebido y verificación de enlaces.
- Gestión completa de disputas y confirmación bilateral de resultados.
- Correos, recuperación de contraseña y verificación de identidad.
- Pruebas automatizadas de componentes y flujos.

## Ejecutar localmente

Requiere Node.js.

```bash
npm install
npm run dev
```

Abre `http://localhost:3000`.

## Validar el proyecto

```bash
npm run lint
npm run build
```
