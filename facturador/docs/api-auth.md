# API Auth (Factu Lite)

Flujo de autenticacion para consumir APIs con Bearer token.

## Endpoints

1. `POST /api/auth/login`
2. `GET /api/auth/verify`
3. `GET /api/auth/me`
4. `POST /api/auth/logout`

## Flujo recomendado

1. Enviar credenciales a `POST /api/auth/login`.
2. Guardar `token` retornado.
3. Enviar `Authorization: Bearer {token}` en cada request protegido.
4. Validar token con `GET /api/auth/verify` o `GET /api/auth/me`.
5. Revocar token con `POST /api/auth/logout` al cerrar sesion.

## Ejemplos cURL

```bash
curl --request POST \
  --url "https://tu-dominio.com/api/auth/login" \
  --header "Accept: application/json" \
  --header "Content-Type: application/json" \
  --data '{"email":"admin@empresa.com","password":"123456"}'
```

```bash
curl --request GET \
  --url "https://tu-dominio.com/api/auth/verify" \
  --header "Accept: application/json" \
  --header "Authorization: Bearer {token}"
```

```bash
curl --request POST \
  --url "https://tu-dominio.com/api/auth/logout" \
  --header "Accept: application/json" \
  --header "Authorization: Bearer {token}"
```
