# Instrucciones para crear el Atajo de iOS

Este atajo permite enviar mensajes de WhatsApp automáticamente desde la app web.

## Pasos para crear el Atajo:

### 1. Abrir la app Atajos en tu iPhone/iPad

### 2. Crear nuevo Atajo
- Toca el botón "+" en la esquina superior derecha
- Dale un nombre: **EnviarWhatsAppLBJ**

### 3. Agregar las siguientes acciones (en orden):

#### Acción 1: Obtener texto de entrada
1. Busca y agrega la acción **"Obtener texto de Entrada de atajo"**
2. Esta será tu entrada que contiene: `TELÉFONO|MENSAJE`

#### Acción 2: Dividir texto
1. Busca y agrega la acción **"Dividir texto"**
2. Conecta la entrada a "Texto de Entrada de atajo"
3. Configurar:
   - Dividir por: **Personalizado**
   - Separador personalizado: **|** (barra vertical)

#### Acción 3: Obtener elemento de lista (teléfono)
1. Busca y agrega **"Obtener elemento de la lista"**
2. Conecta entrada a "Dividir texto"
3. Configurar:
   - Obtener: **Primer elemento**

#### Acción 4: Establecer variable (guardar teléfono)
1. Busca y agrega **"Establecer variable"**
2. Conecta entrada al resultado anterior
3. Nombre de variable: **telefono**

#### Acción 5: Obtener elemento de lista (mensaje)
1. Busca y agrega **"Obtener elemento de la lista"**
2. Selecciona "Dividir texto" como entrada
3. Configurar:
   - Obtener: **Último elemento**

#### Acción 6: Establecer variable (guardar mensaje)
1. Busca y agrega **"Establecer variable"**
2. Conecta entrada al resultado anterior
3. Nombre de variable: **mensaje**

#### Acción 7: Enviar mensaje de WhatsApp
1. Busca y agrega **"Enviar mensaje en WhatsApp"**
2. Configurar:
   - Destinatario: Toca y selecciona la variable **telefono**
   - Mensaje: Toca y selecciona la variable **mensaje**
   - ⚠️ IMPORTANTE: Desactiva "Mostrar al ejecutar" (toggle a OFF)

### 4. Configurar permisos
- Cuando ejecutes el atajo por primera vez, iOS te pedirá permisos
- Acepta todos los permisos para WhatsApp y Atajos

### 5. Probar el Atajo
1. Abre la app Atajos
2. Busca tu atajo "EnviarWhatsAppLBJ"
3. Tócalo manteniendo presionado → Compartir
4. Copia el enlace del atajo
5. Pégalo en Safari con este formato de prueba:
   ```
   shortcuts://run-shortcut?name=EnviarWhatsAppLBJ&input=text&text=34633902936|Hola%20esto%20es%20una%20prueba
   ```

## ¿Cómo funciona con tu web?

Una vez creado el Atajo:

1. Abres el modal de WhatsApp en tu web
2. Seleccionas plantilla y editas el mensaje
3. Tocas "Abrir WhatsApp"
4. **iOS detecta que estás en iPhone/iPad**
5. **Ejecuta automáticamente el Atajo**
6. **El mensaje se envía sin intervención**

## Notas importantes:

- ✅ Solo funciona en iOS (iPhone/iPad)
- ✅ El nombre del Atajo DEBE ser exactamente: **EnviarWhatsAppLBJ**
- ✅ Debe estar en "Mis Atajos" (no en una carpeta)
- ⚠️ La primera vez pedirá permisos
- ⚠️ Si cambias el nombre del Atajo, debes actualizar el código

## Solución de problemas:

**El atajo no se ejecuta:**
- Verifica que el nombre sea exactamente "EnviarWhatsAppLBJ"
- Asegúrate de que "Mostrar al ejecutar" esté desactivado
- Revisa que WhatsApp tenga permisos en Atajos

**El mensaje no se envía:**
- Verifica que WhatsApp esté instalado
- Acepta todos los permisos cuando iOS los solicite
- Prueba el atajo manualmente primero

## ¿Necesitas ayuda?

Si tienes problemas, puedes:
1. Probar el atajo manualmente desde la app Atajos
2. Revisar los permisos en Ajustes → Atajos
3. Verificar que WhatsApp tenga todos los permisos necesarios
