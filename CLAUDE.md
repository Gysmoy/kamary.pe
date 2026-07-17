# Kamary

Laravel 10 + Inertia + React (Vite). ERP / e-commerce de farmacia.

## Cómo subir cambios (commit + push)

1. **Compilar el frontend antes de subir:** `npm run build`
2. **Subir TODO el build** recompilado (`public/build/`) junto con los cambios.
3. **Mensajes de commit:** en español, **cortos**, en una sola línea, **sin firmas**
   (nada de `Co-Authored-By` ni texto extra). Solo lo que se hizo, breve.
4. Push a la rama `main` (master).

Ejemplo:
```bash
npm run build
git add -A
git commit -m "agrega boton + para crear categoria de gasto"
git push origin main
```

## Desarrollo local

- Servir app: `php artisan serve --host=127.0.0.1 --port=8001`
- Compilar frontend: `npm run build`
- Base de datos: MySQL/MariaDB (XAMPP), base `kamary_db`

<!-- BEGIN graphify -->
## graphify

Este proyecto tiene un **grafo de conocimiento** (graphify) para responder preguntas
del código sin leer/grep-ear todo el repo (ahorra tokens). Vive en `graphify-out/`
(`graph.json`, `GRAPH_REPORT.md`).

**Antes de responder preguntas sobre el código** (arquitectura, dónde está X, qué usa Y):
1. Si existe `graphify-out/`, consulta el grafo **primero** en vez de grep/lectura masiva:
   - Resumen: lee `graphify-out/GRAPH_REPORT.md`.
   - Consulta puntual: `graphify query "<pregunta>"`.
2. Solo cae a grep/lectura de archivos si el grafo no cubre lo que necesitas.

**Después de cambiar código**, reconstruye el grafo para mantenerlo fresco:
- `graphify .` (o `graphify --update` para incremental).
- El hook post-commit (`graphify hook install`) lo reconstruye solo tras cada commit.

Si `graphify-out/` aún no existe, córrelo una vez: `graphify .`
<!-- END graphify -->

