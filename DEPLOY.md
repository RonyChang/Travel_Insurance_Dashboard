# Deploy en Render con Docker

## Local con Docker

```powershell
docker build -t travel-insurance-dashboard .
docker run --rm --name travel-insurance-dashboard -p 3000:3000 travel-insurance-dashboard
```

Abre `http://localhost:3000`.

