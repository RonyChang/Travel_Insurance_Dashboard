# AuditPro Insurance - Revisor de JSON

Dashboard para revisar y validar archivos JSON de seguros de viaje desde comparaonline.cl.

## Cómo usar

### Copiar archivos directamente al proyecto
1. Copia tus archivos JSON a la carpeta: `/public`
2. Los archivos se cargarán automáticamente cuando recargues la página
3. Puedes tener múltiples archivos .json en esa carpeta

## Carpeta de almacenamiento

Los archivos JSON se deben copiar a:
```
/public/
```

Por ejemplo:
```
/public/allianz_basico.json
/public/ccpp_premium.json
/public/bci_mundo.json
```

## Funcionalidades

### 6 Tabs para análisis completo:

1. **Resumen**: Información general del producto
   - Compañía y plan
   - Datos de la empresa
   - Cobertura territorial
   - Resumen de coberturas, exclusiones y upgrades

2. **Coberturas**: Tabla interactiva con filtros
   - Búsqueda por nombre, descripción o ID
   - Filtro por categoría
   - Filtro por estado (Incluido/No incluido)
   - Filas expandibles con todos los detalles

3. **Exclusiones**: Visualización de exclusiones generales
   - Badges de inclusión correctos
   - Descripción de cada exclusión
   - Validación automática

4. **Upgrades**: Tabla de productos adicionales
   - Categorías afectadas
   - Descripciones completas
   - Referencias a coberturas relacionadas

5. **Calidad**: Validación automática de datos
   - Alertas de 20+ tipos de problemas
   - Detección de encoding errors (mojibake)
   - Validación de references y duplicados
   - Severidad: Critical, Warning, Info

6. **JSON**: Visor de código fuente
   - JSON formateado y legible
   - Búsqueda dentro del JSON
   - Botón para copiar el JSON completo

## Botones y controles

- **X (eliminar)**: Quitar un producto de la lista
- Hacer clic en un producto: Seleccionarlo para ver detalles
- **Expandir filas**: En las tablas, haz clic en el chevron (v) para expandir

## Filtros en Coberturas

- **Buscar**: Filtra por nombre, descripción o ID
- **Categoría**: Filtra por categoría de cobertura
- **Estado**: Filtra por Incluido/No incluido/Sin estado
- **Solo con alertas**: Muestra solo coberturas con problemas de calidad

## Ejemplo

Cuando abres la aplicación ves un producto de ejemplo "Allianz - Seguro de Viaje Básico" que muestra cómo funciona toda la interfaz.

Para analizar tus propios productos:
1. Descarga los JSONs de comparaonline.cl
2. Cópialos a `/public/`
3. Selecciona cada producto para revisar todos sus detalles
4. Usa la pestaña "Calidad" para identificar problemas

## Notas técnicas

- Los datos se procesan completamente en el cliente (navegador)
- No se envían datos a servidores externos
- Compatible con archivos JSON de cualquier tamaño
- Manejo seguro de datos null/missing
- Validación de 20+ tipos de errores automáticamente
