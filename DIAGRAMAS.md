# DIAGRAMAS — MetaFit

**Versión:** 1.0  
**Propósito:** Diagramas de arquitectura, componentes, navegación, base de datos y flujos del sistema MetaFit.

---

## 3.1 Diagrama de Arquitectura General

```
  ┌──────────────────────────────────────────────────────────────────┐
  │                      CAPA DE PRESENTACIÓN                       │
  │                                                                  │
  │  ┌─────────────────────────────┐   ┌─────────────────────────┐  │
  │  │     Frontend Web (Vite)     │   │   App Móvil (Expo)      │  │
  │  │  React 19 + Bootstrap 5     │   │  React Native 0.83      │  │
  │  │  localhost:5173             │   │  Dispositivo físico     │  │
  │  │  Roles: Admin, Recep,      │   │  Rol: Afiliado          │  │
  │  │  Entrenador                 │   │                          │  │
  │  └─────────────┬───────────────┘   └───────────┬─────────────┘  │
  │                │                               │                │
  │                │ HTTP REST                     │ HTTP REST      │
  │                ▼                               ▼                │
  ├──────────────────────────────────────────────────────────────────┤
  │                      CAPA DE API (Backend)                       │
  │                                                                  │
  │  ┌────────────────────────────────────────────────────────────┐  │
  │  │              Node.js + Express (puerto 3001)               │  │
  │  │                                                             │  │
  │  │  Middlewares:                                                │  │
  │  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐  │  │
  │  │  │ Helmet   │ │ CORS     │ │ Rate     │ │ Content-Type │  │  │
  │  │  │ (Segur.) │ │ (Origen) │ │ Limit    │ │ Validator    │  │  │
  │  │  └──────────┘ └──────────┘ └──────────┘ └──────────────┘  │  │
  │  │                                                             │  │
  │  │  Routes → Controllers → Services → Models                  │  │
  │  │                                                             │  │
  │  │  Swagger UI: /api-docs  |  Health: /health                  │  │
  │  └────────────────────────────────────────────────────────────┘  │
  │                │                                                 │
  │                │ TCP (mysql2)                                    │
  │                ▼                                                 │
  ├──────────────────────────────────────────────────────────────────┤
  │                      CAPA DE DATOS                               │
  │                                                                  │
  │  ┌────────────────────────────────────────────────────────────┐  │
  │  │              MySQL 8.0 (puerto 3306)                       │  │
  │  │                                                             │  │
  │  │  ┌──────────┐ 17 tablas                                    │  │
  │  │  │  3FN +   │ 5 vistas                                     │  │
  │  │  │ Herencia │ 1 trigger                                    │  │
  │  │  │ USUARIO→ │ 15 índices                                   │  │
  │  │  │ AFILIADO │ 18 FK (RESTRICT/CASCADE)                     │  │
  │  │  └──────────┘                                               │  │
  │  └────────────────────────────────────────────────────────────┘  │
  └──────────────────────────────────────────────────────────────────┘
```

---

## 3.2 Diagrama de Componentes del Frontend Web

```
                        App.jsx (Router)
                            │
                    ┌───────┴────────┐
                    │  AuthProvider  │
                    │  (AuthContext) │
                    └───────┬────────┘
                            │
              ┌─────────────┼─────────────┐
              │             │             │
         Público        Autenticado   Error
              │             │             │
     ┌────────┴──┐   ┌──────┴──────┐  ┌───┴────┐
     │ Public    │   │ AppLayout   │  │Error   │
     │ Layout    │   │(Sidebar +   │  │Boundary│
     └────────┬──┘   │ Header +    │  └────────┘
              │      │ Footer)     │
     ┌────────┴──┐   └──────┬──────┘
     │ Landing   │          │
     │ Page      │  ┌───────┼───────────────┐
     │ Login     │  │       │               │
     └───────────┘  │       │               │
                    ▼       ▼               ▼
            ┌──────────┐ ┌────────┐ ┌──────────────┐
            │Dashboard │ │Afiliado│ │GestionPersonal│
            │(Admin)   │ │sView   │ │(Admin)       │
            │          │ │(Todos) │ │              │
            └──────────┘ └────────┘ └──────────────┘
                    │       │               │
                    ▼       ▼               ▼
            ┌──────────┐ ┌────────┐ ┌──────────────┐
            │Rutinas   │ │Dietas  │ │PagosView     │
            │View      │ │View    │ │(Admin+Recep) │
            │(Admin+T) │ │(Admin+ │ │              │
            │          │ │Trainer)│ │              │
            └──────────┘ └────────┘ └──────────────┘

Hooks compartidos:
┌────────────────────────────────────────────────────────────┐
│ useAfiliados.js  useDashboard.js  useToast.js               │
│ useAuth() (del contexto)                                    │
└────────────────────────────────────────────────────────────┘

Servicios compartidos:
┌────────────────────────────────────────────────────────────┐
│ api.js (axios instance + interceptor)                       │
│ authService.js (loginUser, persistSession, clearSession)    │
│ afiliadosService.js (buildAfiliadoLocal, helpers)           │
└────────────────────────────────────────────────────────────┘
```

---

## 3.3 Diagrama de Navegación — App Móvil

```
  ┌──────────────────────────────────────────────────────┐
  │                   NavigationContainer                │
  │                                                       │
  │  ┌─── ¿Hay token? ─────────────────────────────┐     │
  │  │                                               │     │
  │  │  NO ───────────────────────────── SI          │     │
  │  │  │                                            │     │
  │  │  ▼                                            ▼     │
  │  │  ┌──────────────────────┐    ┌───────────────────┐  │
  │  │  │ Stack Navigator     │    │ Bottom Tab Nav    │  │
  │  │  │ (headerShown: false)│    │ (mainTabs)        │  │
  │  │  ├──────────────────────┤    ├───────────────────┤  │
  │  │  │ Screen: "Landing"  │    │ Tab: "Perfil"    │  │
  │  │  │ └→ LandingScreen   │    │ └→ MiPerfilScreen│  │
  │  │  │                     │    │                   │  │
  │  │  │ Screen: "Login"    │    │ Tab: "Rutina"    │  │
  │  │  │ └→ LoginScreen     │    │ └→ MiRutinaScreen│  │
  │  │  └──────────────────────┘    │                   │  │
  │  │                              │ Tab: "Dieta"     │  │
  │  │                              │ └→ MiDietaScreen │  │
  │  │                              │                   │  │
  │  │                              │ Tab: "Progreso"  │  │
  │  │                              │ └→ MiProgresoScre│  │
  │  │                              └───────────────────┘  │
  │  └─────────────────────────────────────────────────────┘  │
  │                                                           │
  │  Transiciones:                                            │
  │  - Login exitoso → token cambia → navigator cambia a Tabs│
  │  - Cerrar sesión → token=null → navigator cambia a Stack │
  └───────────────────────────────────────────────────────────┘
```

---

## 3.4 Diagrama Entidad-Relación (Simplificado)

```
                          ┌──────────────────────┐
                          │       USUARIO        │
                          ├──────────────────────┤
                          │ PK id_usuario (INT)  │
                          │    nombres (VARCHAR)  │
                          │    apellidos (VARCHAR)│
                          │    correo (VARCHAR) UQ│
                          │    contrasena (TEXT)  │
                          │    rol (ENUM)         │
                          │    estado (ENUM)      │
                          │    fecha_registro (DT)│
                          └──────┬───────┬────────┘
                                 │       │
                     ┌───────────┘       └───────────┐
                     │ 1:1                         1:N
                     ▼                               ▼
           ┌──────────────────┐          ┌──────────────────┐
           │    AFILIADO      │          │  PAGO            │
           ├──────────────────┤          ├──────────────────┤
           │ PK,FK id_usuario │          │ PK id_pago       │
           │    documento UQ  │          │ FK id_usuario    │
           │    fecha_nacim.  │          │    fecha_pago    │
           │    sexo (ENUM)   │          │    valor_pagado  │
           │    telefono      │          │    estado (ENUM) │
           │    direccion     │          │    fecha_vencim. │
           │    estatura_cm   │          └──────────────────┘
           │    estado_afiliac│
           │    registrado_por│
           └──────┬───────────┘
                  │ 1:N
                  ▼
           ┌──────────────────┐          ┌──────────────────────┐
           │     CICLO        │ 1:1      │ PLAN_ENTRENAMIENTO   │
           ├──────────────────┤─────────▶├──────────────────────┤
           │ PK id_ciclo      │          │ PK,FK id_ciclo       │
           │ FK id_usuario    │          │    observaciones     │
           │    fecha_inicio  │          │    modificado_por    │
           │    fecha_fin     │          └──────────┬───────────┘
           │    activo (TINY) │                     │ 1:N
           │    objetivo_fis  │                     ▼
           │    nivel_exp     │          ┌──────────────────────┐
           │    disponibilidad│          │     RUTINA           │
           └──────────────────┘          ├──────────────────────┤
                  │ 1:1                 │ PK id_rutina         │
                  ▼                      │ FK id_ciclo          │
           ┌──────────────────┐          │    nombre_rutina     │
           │ PLAN_NUTRICIONAL │          │    dia_numero        │
           ├──────────────────┤          └──────────┬───────────┘
           │ PK,FK id_ciclo   │                     │ 1:N
           │    calorias_obj  │                     ▼
           │    num_comidas   │          ┌──────────────────────┐
           │    observaciones │          │   RUTINA_EJERCICIO   │
           └──────────────────┘          ├──────────────────────┤
                  │ 1:N                  │ PK,FK id_rutina      │
                  ▼                      │ PK orden             │
           ┌──────────────────┐          │ FK id_ejercicio      │
           │ DETALLE_NUTRI.   │          │    series            │
           ├──────────────────┤          │    repeticiones      │
           │ PK,FK id_ciclo   │          └──────────────────────┘
           │ PK num_comida    │
           │ PK,FK id_alimento│
           │    cantidad_g    │
           └──────────────────┘

           ┌──────────────────┐          ┌──────────────────┐
           │   RESTRICCION    │          │   EJERCICIO      │
           ├──────────────────┤          ├──────────────────┤
           │ PK id_restriccion│          │ PK id_ejercicio  │
           │    nombre UQ     │          │    nombre UQ     │
           │    tipo (ENUM)   │          │    grupo_musc.   │
           └────────┬─────────┘          │    nivel_minimo  │
                    │                    └────────┬─────────┘
                    │ N:M                        │ N:M
                    ▼                            ▼
           ┌──────────────────┐    ┌──────────────────────────┐
           │AFILIADO_RESTRICC │    │EJERCICIO_RESTRIC_EXCLUIDA│
           ├──────────────────┤    ├──────────────────────────┤
           │ PK,FK id_usuario │    │ PK,FK id_ejercicio       │
           │ PK,FK id_restricc│    │ PK,FK id_restriccion     │
           └──────────────────┘    └──────────────────────────┘

           ┌──────────────────┐    ┌──────────────────────────┐
           │   ALIMENTO       │    │ALIMENTO_RESTRIC_EXCLUIDA │
           ├──────────────────┤    ├──────────────────────────┤
           │ PK id_alimento   │    │ PK,FK id_alimento        │
           │    nombre UQ     │    │ PK,FK id_restriccion     │
           │    proteinas     │    └──────────────────────────┘
           │    carbohidratos │
           │    grasas        │    ┌──────────────────────────┐
           └──────────────────┘    │   PROGRESO_FISICO       │
                                   ├──────────────────────────┤
           ┌──────────────────┐    │ PK,FK id_ciclo           │
           │ CONFIGURACION    │    │ PK fecha_registro        │
           ├──────────────────┤    │    peso_kg               │
           │ PK clave         │    │    porcentaje_grasa      │
           │    valor         │    │    medidas corporales    │
           └──────────────────┘    └──────────────────────────┘
```

---

## 3.5 Diagrama de Flujo — Autenticación

```
  ┌──────────────┐
  │ Usuario abre │
  │ app/web      │
  └──────┬───────┘
         │
         ▼
  ┌──────────────┐     NO      ┌──────────────────┐
  │ ¿Token en    │────────────▶│ Mostrar Login    │
  │ almacenam.?  │             │ Formulario        │
  └──────┬───────┘             └────────┬─────────┘
         │ SI                           │
         ▼                              ▼
  ┌──────────────┐             ┌──────────────────┐
  │ Validar token │             │ Ingresar correo  │
  │ (localmente)  │             │ y contraseña     │
  └──────┬───────┘             └────────┬─────────┘
         │                              │
    ┌────┴────┐                         ▼
    │ Válido  │                  ┌──────────────────┐
    └────┬────┘                  │ POST /login      │
         │                       │ { email,password}│
         ▼                       └────────┬─────────┘
  ┌──────────────┐                        │
  │ Ir a Home    │                        ▼
  │ (según rol)  │                 ┌──────────────────┐
  └──────────────┘                 │ Verificar en BD  │
                                   └────────┬─────────┘
                                       ┌────┴────┐
                                       │ Válido  │
                                       └────┬────┘
                                            ▼
                                   ┌──────────────────┐
                                   │ Generar JWT      │
                                   │ (8h expiración)  │
                                   └────────┬─────────┘
                                            ▼
                                   ┌──────────────────┐
                                   │ Almacenar token  │
                                   │ (localStorage /  │
                                   │ AsyncStorage)    │
                                   └────────┬─────────┘
                                            ▼
                                   ┌──────────────────┐
                                   │ Redirigir a Home │
                                   │ según rol        │
                                   └──────────────────┘

     INVÁLIDO:
     ┌──────────────┐
     │ Mostrar error │
     │ "Credenciales │
     │ incorrectas"  │
     └──────┬───────┘
            ▼
     ┌──────────────┐
     │ Reintentar   │
     └──────────────┘
```

---

## 3.6 Diagrama de Flujo — Asignación de Rutina por el Entrenador

```
  ┌────────────────────────────┐
  │ Entrenador inicia sesión   │
  │ → redirigido a /rutinas    │
  └────────────┬───────────────┘
               ▼
  ┌────────────────────────────┐
  │ Ver tabla de afiliados     │
  │ (los sin rutina aparecen   │
  │  primero con resaltado)    │
  └────────────┬───────────────┘
               ▼
  ┌────────────────────────────┐
  │ Seleccionar afiliado       │
  │ → clic "Asignar Rutina"    │
  └────────────┬───────────────┘
               ▼
  ┌────────────────────────────────────────────┐
  │ Modal: Configurar Ciclo                    │
  │                                            │
  │ 1. Objetivo físico (dropdown)              │
  │ 2. Nivel experiencia (dropdown)             │
  │ 3. Disponibilidad (1-7 días)               │
  │ 4. Grupo muscular prioritario (opcional)   │
  │ 5. Fecha inicio / fecha fin                │
  └────────────┬───────────────────────────────┘
               ▼
  ┌────────────────────────────────────────────┐
  │ POST /afiliados/ciclos                     │
  │ { id_usuario, objetivo_fisico, ... }       │
  │ └→ Backend desactiva ciclo anterior       │
  │ └→ Inserta nuevo ciclo                    │
  └────────────┬───────────────────────────────┘
               ▼
  ┌────────────────────────────────────────────┐
  │ Modal: Agregar Ejercicios por Día          │
  │                                            │
  │ Para cada día de la semana:                │
  │ 1. GET /catalogo/ejercicios               │
  │ 2. GET /afiliados/:id/ejercicios-disp.    │
  │    (filtra por restricciones)              │
  │ 3. Seleccionar ejercicio + series + reps   │
  │ 4. POST /planes/rutinas + ejercicios      │
  └────────────┬───────────────────────────────┘
               ▼
  ┌────────────────────────────┐
  │ Guardar → confirmación     │
  │ El afiliado ya ve su       │
  │ rutina en la app móvil     │
  └────────────────────────────┘
```

---

## 3.7 Diagrama de Flujo — Consulta de Perfil por el Afiliado

```
  ┌────────────────────────────┐
  │ Afiliado abre la app móvil │
  │ → LandingScreen            │
  └────────────┬───────────────┘
               ▼
  ┌────────────────────────────┐
  │ ¿Token en AsyncStorage?    │
  └────────────┬───────────────┘
               │
        NO─────┴─────SI
        │             │
        ▼             ▼
  ┌──────────┐  ┌─────────────────────┐
  │ Login    │  │ Navegar a MainTabs  │
  │ Screen   │  │ (Bottom Tabs)       │
  └────┬─────┘  └──────────┬──────────┘
       │                    │
       ▼                    ├────────────────┬────────────────┬────────────────┐
  ┌──────────┐              ▼                ▼                ▼                ▼
  │ POST     │       ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐
  │ /login   │       │ MiPerfil   │  │ MiRutina   │  │ MiDieta    │  │ MiProgreso │
  └────┬─────┘       └─────┬──────┘  └──────┬─────┘  └──────┬─────┘  └──────┬─────┘
       │                    │                │                │                │
       ▼                    ▼                ▼                ▼                ▼
  ┌──────────┐       ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐
  │ Guardar  │       │ GET        │  │ GET        │  │ GET        │  │ GET        │
  │ token +  │       │ /afiliados/│  │ /afiliados/│  │ /afiliados/│  │ /afiliados/│
  │ user     │       │ me         │  │ me/ciclos  │  │ me/ciclos  │  │ me/progreso│
  └──────────┘       └─────┬──────┘  └──────┬─────┘  └──────┬─────┘  └──────┬─────┘
                           │                │                │                │
                           ▼                ▼                │                │
                     ┌────────────┐  ┌────────────┐          │                │
                     │ Mostrar    │  │ Encontrar  │          │                │
                     │ perfil     │  │ ciclo      │          │                │
                     │ completo   │  │ activo     │          │                │
                     │ + físicas  │  └──────┬─────┘          │                │
                     │ + restricc │         │                │                │
                     └────────────┘         ▼                ▼                │
                                      ┌────────────┐  ┌────────────┐          │
                                      │ GET        │  │ GET        │          │
                                      │ /planes/   │  │ /planes/   │          │
                                      │ entrenam.  │  │ nutricional│          │
                                      │ /:id_ciclo │  │ /:id_ciclo │          │
                                      └──────┬─────┘  └──────┬─────┘          │
                                             ▼                ▼                ▼
                                      ┌────────────┐  ┌────────────┐  ┌────────────┐
                                      │ Mostrar    │  │ Mostrar    │  │ Mostrar    │
                                      │ rutinas    │  │ comidas    │  │ historial  │
                                      │ por día    │  │ + macros   │  │ mediciones │
                                      │ expandibles│  │ expandibles│  │ FlatList   │
                                      └────────────┘  └────────────┘  └────────────┘
```
