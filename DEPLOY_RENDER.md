# Deploy en Render con Docker

## Local con Docker

```powershell
docker build -t travel-insurance-dashboard .
docker run --rm --name travel-insurance-dashboard -p 3000:3000 travel-insurance-dashboard
```

Abre `http://localhost:3000`.

## Render desde GitHub

1. Sube este repo a GitHub.
2. En Render, crea un nuevo Web Service desde el repo.
3. Elige `Docker` como runtime/language.
4. Usa el `Dockerfile` de la raiz del repo.
5. No agregues Docker Command; Render usara el `CMD` del Dockerfile.

Render define `PORT` automaticamente. El contenedor escucha en `0.0.0.0` y usa ese puerto en produccion.
