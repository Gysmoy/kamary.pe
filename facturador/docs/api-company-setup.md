# API Setup de Empresa (Factu Lite)

Estas APIs permiten que un sistema externo administre la configuracion de empresa, logo y certificado para que Factu Lite se encargue solo del envio a SUNAT.

> Este proyecto esta en modo monoempresa: una sola empresa activa por instancia.

## Autenticacion recomendada

- Metodo: `Bearer Token` usando el guard `auth:api`.
- Header:

```http
Authorization: Bearer {api_token}
Accept: application/json
```

- Recomendado en produccion:
  - `API_REQUIRE_AUTH=true`
  - Servir solo por `HTTPS`
  - Rotar `api_token` periodicamente
- Flujo completo en: `docs/api-auth.md`

## Endpoints

- `GET /api/company/tables`: catalogos (`soap_types`, `soap_sends`).
- `GET /api/company/record`: obtiene empresa activa y estado de certificado/logo.
- `POST /api/company`: crea/actualiza datos de empresa.
- `POST /api/company/logo`: sube logo en `multipart/form-data` (`file`).
- `POST /api/company/certificate`: sube certificado `.pfx|.p12` + `password` en `multipart/form-data`.
- `DELETE /api/company/certificate`: elimina certificado activo.

## Flujo sugerido de integracion

1. Consultar `GET /api/company/tables`.
2. Registrar/actualizar empresa con `POST /api/company`.
3. Subir logo con `POST /api/company/logo`.
4. Subir certificado con `POST /api/company/certificate`.
5. Emitir comprobantes por `/api/documents` y derivados.
