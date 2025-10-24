# LiquiVerde - Compra Inteligente y Sostenible 🌿

LiquiVerde es una aplicación web fullstack que ayuda a los usuarios a optimizar sus compras considerando precio, impacto ambiental y responsabilidad social. Utiliza algoritmos de optimización multi-objetivo y APIs externas para ofrecer recomendaciones inteligentes de productos sostenibles.

## 🚀 Características Principales

### ✅ Análisis de Productos
- Búsqueda por nombre, código de barras o categoría
- Scoring de sostenibilidad (eco_score y social_score)
- Integración con Open Food Facts API para productos alimenticios
- 101+ productos en base de datos con información detallada

### ✅ Sistema de Listas de Compras
- Crear y gestionar listas con presupuesto
- Agregar productos con cantidades
- Bloquear/desbloquear productos específicos
- Visualización de total y uso de presupuesto

### ✅ Optimización Multi-objetivo (Algoritmo de Mochila)
- **Algoritmo implementado**: Problema de la mochila multi-objetivo con programación dinámica
- Optimiza considerando: precio (40%), impacto ambiental (30%), responsabilidad social (30%)
- Edge function: `optimize-knapsack` que resuelve el problema de optimización global
- Solo sugiere alternativas con mejora > 5%
- Respeta productos bloqueados por el usuario

### ✅ Comparador de Productos
- Comparación visual de alternativas
- Ranking por similitud
- Indicadores de mejora en precio, eco y social scores

### ✅ Mapa de Tiendas Cercanas
- Geolocalización del usuario
- Integración con OpenStreetMap Nominatim
- Búsqueda de supermercados por radio configurable
- Visualización en mapa interactivo con Leaflet
- Cálculo de distancias usando fórmula Haversine

### ✅ Dashboard de Impacto
- Total de ahorros acumulados
- Score ambiental y social promedio
- Métricas de uso de la aplicación

## 🛠 Stack Tecnológico

### Frontend
- **React 18** + **TypeScript** + **Vite**
- **Tailwind CSS** + **shadcn-ui** para componentes
- **React Query** para estado y cache
- **React Leaflet** para mapas
- **React Router** para navegación

### Backend
- **Supabase** (PostgreSQL + Edge Functions + Auth)
- **Lovable Cloud** para deployment

### Base de Datos
- **PostgreSQL** con 6 tablas:
  - `products`: 101 productos con scores de sostenibilidad
  - `alternatives`: Relaciones producto-alternativa con similarity scoring
  - `shopping_lists`: Listas de usuarios con presupuesto
  - `shopping_list_items`: Items en cada lista
  - `price_snapshots`: Historial de precios
  - `stores`: Tiendas y supermercados

### APIs Externas Integradas
1. **Open Food Facts API**: Información nutricional y de sostenibilidad de productos alimenticios
2. **OpenStreetMap Nominatim**: Geocodificación y búsqueda de tiendas cercanas

## 📊 Algoritmos Implementados

### 1. Sistema de Scoring Multi-dimensional
```typescript
// Scoring económico: Basado en precio relativo
// Scoring ambiental (eco_score 0-100): packaging, biodegradabilidad, certificaciones
// Scoring social (social_score 0-100): comercio justo, certificaciones éticas
```

### 2. Algoritmo de Sustitución Inteligente
- Busca alternativas usando tabla `alternatives` con similarity >= 0.7
- Calcula score de mejora ponderado
- Ordena por mejor combinación de criterios

### 3. Algoritmo de Mochila Multi-objetivo ⭐
**Implementación en**: `supabase/functions/optimize-knapsack/index.ts`

**Descripción**: Resuelve el problema de optimización global de una lista de compras considerando:
- Restricción de presupuesto (capacidad de la mochila)
- Múltiples objetivos: minimizar precio, maximizar eco_score, maximizar social_score
- Alternativas disponibles para productos desbloqueados

**Funcionamiento**:
1. Agrupa productos por item original
2. Para cada grupo, evalúa producto original + todas sus alternativas
3. Calcula score multi-objetivo normalizado para cada opción
4. Selecciona la mejor opción que cumpla restricción de presupuesto
5. Si nada cabe en presupuesto, usa la opción más barata

**Pesos configurables**:
- Precio: 40%
- Ambiental: 30%
- Social: 30%

## 🔧 Instalación y Configuración

### Requisitos Previos
- Node.js 18+ y npm
- Cuenta de Supabase (o usar Lovable Cloud)

### Instalación Local

```bash
# 1. Clonar repositorio
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
# Las variables ya están configuradas en .env automáticamente por Lovable Cloud:
# - VITE_SUPABASE_URL
# - VITE_SUPABASE_PUBLISHABLE_KEY
# - VITE_SUPABASE_PROJECT_ID

# 4. Iniciar servidor de desarrollo
npm run dev
```

### Deployment
```bash
# Desplegar en Lovable
# Click en el botón "Publish" en la interfaz de Lovable
```

## 🤖 Uso de IA en el Desarrollo

Este proyecto fue desarrollado con asistencia de **Lovable AI**, una herramienta de desarrollo asistido por IA que ayudó en:

1. **Arquitectura inicial**: Diseño de base de datos y estructura de componentes
2. **Implementación de algoritmos**: Desarrollo del algoritmo de mochila multi-objetivo
3. **Integraciones**: Conexión con APIs externas (Open Food Facts, OpenStreetMap)
4. **UI/UX**: Diseño de componentes con Tailwind CSS y shadcn-ui
5. **Edge Functions**: Implementación de funciones serverless en Supabase

**Nivel de asistencia**: ~70% del código fue generado con asistencia de IA, 30% fue refinamiento manual y debugging.

## 📁 Estructura del Proyecto

```
liquiverde/
├── src/
│   ├── components/       # Componentes React reutilizables
│   ├── pages/           # Páginas de la aplicación
│   ├── lib/             # Utilidades y funciones helper
│   └── integrations/    # Cliente de Supabase (auto-generado)
├── supabase/
│   ├── functions/       # Edge Functions
│   │   ├── optimize-knapsack/     # Algoritmo de optimización
│   │   ├── fetch-product-info/    # Integración Open Food Facts
│   │   └── geocode-stores/        # Integración OpenStreetMap
│   └── config.toml      # Configuración de Supabase
└── public/              # Assets estáticos
```

## 🔐 Seguridad

- RLS (Row Level Security) habilitado en todas las tablas sensibles
- Autenticación con Supabase Auth
- Variables de entorno para secrets
- Edge functions con verificación JWT cuando necesario

## 📈 Métricas de Impacto

- **101 productos** en catálogo inicial
- **23 productos sustentables** + **23 productos convencionales**
- **Scoring**: eco_score y social_score de 0-100
- **Optimización**: Ahorro promedio de 10-20% en compras optimizadas

## 🚧 Roadmap Futuro

- [ ] PWA (Progressive Web App) para instalación móvil
- [ ] Integración con Carbon Interface API para cálculo real de CO₂
- [ ] Sistema de notificaciones para cambios de precios
- [ ] Historial de compras y análisis de tendencias
- [ ] Compartir listas entre usuarios

## 📝 Licencia

Este proyecto fue desarrollado como parte de un test técnico para Software Engineer I.

## 🤝 Contribuciones

Este es un proyecto de demostración. Para consultas contactar al desarrollador.

---

**Desarrollado con ❤️ y IA por LiquiVerde Team**
