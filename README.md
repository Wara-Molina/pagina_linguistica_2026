# Lingüística e Idiomas 2026

Proyecto web desarrollado con Next.js, TypeScript y Tailwind CSS para la gestión y difusión de información institucional, eventos, cursos, gacetas y publicaciones de la carrera de Lingüística e Idiomas.

## Carreras asociadas

Este sistema está orientado a la carrera de:
- Lingüística e Idiomas

## Descripción

Esta aplicación permite mostrar información relevante, comunicados, eventos, cursos, gacetas, publicaciones y videos institucionales consumidos directamente desde la API centralizadora de la universidad. Incluye páginas públicas, componentes reutilizables y una arquitectura moderna orientada a la escalabilidad y mantenibilidad dentro de la infraestructura universitaria.

## Estructura del proyecto

De acuerdo con el espacio de trabajo actual, la arquitectura mantiene la distribución modular estándar:
- `/app` — Páginas principales y rutas dinámicas (App Router)
- `/components` — Componentes reutilizables UI y de dominio
- `/context` — Contextos globales de React
- `/hooks` — Hooks personalizados
- `/lib` — Utilidades y helpers
- `/public` — Imágenes y recursos estáticos
- `/styles` — Hojas de estilo globales

## Instalación

```bash
# Clona el repositorio
git clone <URL-del-repositorio>

# Instala las dependencias utilizando pnpm (recomendado según el archivo lock)
pnpm install
# o alternativamente con npm
npm install

# Copia y configura las variables de entorno reales
cp .env.copy .env

# Inicia el entorno de desarrollo
pnpm dev
# o
npm run dev

## Scripts principales
npm dev — Inicia el servidor en modo desarrollo

npm build — Compila la aplicación para producción

npm start — Inicia el servidor en producción

npm lint — Ejecuta el linter para verificación de código

## Variables de entorno

Ajusta las variables en tu archivo .env configurando el ID correspondiente asignado por la API central para la carrera de Lingüística.

## Dependencias clave
next — Framework principal con soporte nativo para .mjs

react y react-dom — Librería base UI

tailwindcss — Estilos utilitarios y configuración de PostCSS

typescript — Tipado estático para robustez del código

shadcn/ui / @radix-ui/* — Componentes accesibles configurados mediante components.json

Optimización y Seguridad (Next Config)
El proyecto cuenta con una configuración estricta en next.config.mjs para garantizar el rendimiento y la protección de los datos:

1. Optimización de Imágenes (next/image)
Se permite la carga optimizada de recursos multimedia en formato WebP desde los servidores oficiales:

archivosminio.upea.bo (Ruta: /archivospaginasnode/imagenes/)

apiadministrador.upea.bo (Ruta total: /)

2. Cabeceras de Seguridad HTTP
Todas las rutas (/:path*) implementan los siguientes headers de protección activa:

X-Content-Type-Options: nosniff — Previene el sniffing de tipos MIME.

X-Frame-Options: DENY — Protege la aplicación contra ataques de Clickjacking.

X-XSS-Protection: 1; mode=block — Filtro básico contra Cross-Site Scripting.

Referrer-Policy: strict-origin-when-cross-origin — Controla el envío de información de origen en peticiones de terceros.

## Notas adicionales
Asegúrate de verificar el archivo next.config.mjs antes de pasar a producción para validar que las cabeceras de seguridad y los dominios de MinIO apunten correctamente a los repositorios de imágenes de la universidad.

Desarrollado por el equipo UTIC — 2026.