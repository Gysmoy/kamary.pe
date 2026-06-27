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
