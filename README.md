# 👋 ByeTOC

Registro personal de interruptores con marca temporal. Una PWA mínima, **offline** y sin servidor para anotar acciones binarias —hecho / no hecho— y poder consultar *cuándo* fue la última vez. Pensada como apoyo para reducir la recomprobación.

**App:** https://josepalaciospro.github.io/bytoc/

---

## Qué hace

- Crea tus propios interruptores con la etiqueta que quieras.
- Un toque cambia ON/OFF y guarda la fecha y hora exactas del cambio.
- Bajo cada interruptor ves la fecha y hora del último cambio, o "Sin registro reciente" si no lo hay.
- Cada interruptor guarda su historial interno de cambios (estado anterior → nuevo, con marca temporal), oculto por defecto.
- Renombrar, eliminar y restablecer cada interruptor. Restablecer pone el estado en OFF y borra la marca temporal **sin** perder la etiqueta ni el historial.
- Reordenar arrastrando desde el tirador, o con las flechas del teclado.
- Copia de seguridad: exportar e importar todo en un archivo JSON.

## Privacidad y datos

No hay backend, ni cuentas, ni sincronización en la nube. Todo se guarda en el `localStorage` del navegador, **solo en tu dispositivo**. Cada persona que use la app tiene sus propios datos, aislados.

Esto implica dos cosas a tener en cuenta: borrar los datos del navegador o desinstalar la app elimina los registros, y los datos están atados a la dirección exacta de la app. Usa **Exportar** como respaldo de forma periódica.

## Instalación

Ábrela en Chrome (Android) y pulsa **Instalar app**, o "Instalar aplicación" en el menú del navegador. Queda como app independiente y funciona sin conexión.

## Tecnología

HTML, CSS y JavaScript sin framework ni proceso de compilación. Service worker para uso offline, manifest para instalación como PWA, y [SortableJS](https://github.com/SortableJS/Sortable) para el reordenado. Alojada gratis en GitHub Pages.

## Créditos

Por [José Alberto Palacios](https://www.linkedin.com/in/palaciosjosealberto).
