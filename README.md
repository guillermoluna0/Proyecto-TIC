# Autenticación con Google (Firebase)

Esta pequeña guía te ayuda a configurar el inicio de sesión con Google usando Firebase en este proyecto.

Pasos:

1. Crea un proyecto en https://console.firebase.google.com/
2. En Authentication -> Sign-in method habilita "Google".
3. En Project settings -> General -> Tus apps -> Agrega una app Web (si no tienes). Copia la configuración y pega los valores en `script.js` reemplazando `firebaseConfig`.

Ejemplo de `firebaseConfig` (reemplaza las cadenas):

```js
const firebaseConfig = {
  apiKey: "API_KEY",
  authDomain: "PROJECT_ID.firebaseapp.com",
  projectId: "PROJECT_ID",
  appId: "APP_ID"
};
```

4. Asegúrate de que la URL donde pruebas (por ejemplo `http://localhost:5500`) esté añadida en Authentication -> Sign-in method -> Authorized domains.

5. Ejecuta un servidor local para probar (por ejemplo con ext Live Server de VSCode o `npx http-server`):

```bash
npx http-server -c-1 .
# o
python3 -m http.server 5500
```

> No abras el archivo directamente con `file://`. Firebase Auth no funciona bien desde el sistema de archivos; usa `http://localhost` o `http://127.0.0.1`.

6. Abre la página, haz clic en "Iniciar sesión con Google" y acepta la cuenta. La UI mostrará nombre y avatar.

Notas:
- El código usa los módulos CDN de Firebase (Firebase 10). Si prefieres instalar con npm, adapta las importaciones.
- Guarda las credenciales con seguridad; no publicarlas en repositorios públicos.

