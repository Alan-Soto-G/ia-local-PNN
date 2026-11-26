# Contexto del sistema: Asistente de interpretación ambiental offline

> Nivel 1 de C4. El contexto no es una vista de 4+1: es el marco que encuadra a todas. Diagrama: [contexto.puml](diagramas/contexto.puml)

## 1. Presentación principal

El Asistente de interpretación ambiental aparece como una caja negra: una app Android que funciona sin conexión en el PNN Los Nevados. La rodean las personas que la usan en campo, las que alimentan su conocimiento desde fuera y los tres sistemas externos con los que se relaciona, que **solo se usan cuando hay conexión** o, en el caso de la voz del sistema, dentro del mismo teléfono. Responde: ¿qué hay afuera y cómo se comunica el sistema con ello?

Diagrama: [diagramas/contexto.puml](diagramas/contexto.puml)

## 2. Catálogo de elementos

| Elemento | Tipo | Rol o responsabilidad | Interacción con el sistema |
|----------|------|-----------------------|----------------------------|
| Guía / Intérprete ambiental | Persona | Consulta por texto, foto y voz durante el recorrido, genera guiones por perfil e idioma, descarga los paquetes antes de salir | App en su teléfono, sin conexión en campo |
| Visitante / Turista | Persona | Pregunta al asistente desde el teléfono del guía o desde el suyo, deja reseñas | App en el teléfono, sin conexión |
| Biólogo / Curador de contenido | Persona | Sube y valida especies, imágenes, rutas y documentos fuente (RN-01) | No usa la app para eso: trabaja en el Backend de conocimiento |
| Administrador del área protegida | Persona | Revisa las reseñas y la calidad del servicio (OB-02) | Backend de conocimiento |
| Asistente de interpretación ambiental | Sistema en alcance | Chat multimodal offline con base de conocimiento local, rutas, fichas y reseñas | Con todos los demás elementos |
| Backend de conocimiento PNN | Sistema externo (aún no definido) | Guarda el contenido validado en PostgreSQL, lo vectoriza y publica los cambios y el manifest de paquetes ([qué se espera](backend-esperado.md)) | HTTPS cuando hay conexión; backend propio o Supabase |
| Hugging Face Hub | Sistema externo | Aloja los archivos GGUF y ONNX de los modelos que lista el manifest | HTTPS por Wi-Fi, solo en CU-05 |
| Motor de voz de Android | Sistema externo (en el teléfono) | Lee las respuestas en voz alta con las voces instaladas (ADR-003) | API del sistema a través de `expo-speech`, sin red |

## 3. Justificación

- RT-01 y EAC-02: ninguna flecha de red sale del sistema durante la guianza; las de red están marcadas como "con conexión".
- RT-05 y S-02: los modelos se bajan después de instalar, desde Hugging Face, según el manifest del backend (ADR-007).
- RN-01: el Biólogo valida en el backend; el móvil solo recibe lo publicado (ADR-006).
- OB-02: las reseñas viajan del teléfono al backend cuando hay conexión, y allí las revisa el Administrador.
- PA-08: fotos, audio y conversaciones no salen del teléfono; no hay flecha que los lleve afuera.
- ADR-003: la voz de salida usa el motor de Android, que no ocupa memoria de la app ni requiere descarga.

## 4. Comportamiento

Los escenarios (+1) empiezan aquí: [CU-01 consultar por texto](diagramas/secuencia/cu01-consultar-texto.puml) ocurre sin cruzar el borde del sistema. [CU-05 descargar paquetes](diagramas/secuencia/cu05-descargar-paquetes.puml) y [CU-06 sincronizar](diagramas/secuencia/cu06-sincronizar.puml) son los únicos que hablan con los sistemas externos de red.

## 5. Vistas relacionadas

- [Procesos](vistas/02-procesos.md): qué contenedor del teléfono habla con cada sistema externo.
- [Física](vistas/04-fisica.md): por qué red sale cada conexión.
