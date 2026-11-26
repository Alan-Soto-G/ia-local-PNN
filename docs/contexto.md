# Contexto del sistema: Asistente de interpretación ambiental offline

> Nivel 1 de C4. El contexto no es una vista de 4+1: es el marco que encuadra a todas. Diagrama: [contexto.puml](diagramas/contexto.puml)

## 1. Presentación principal

El Asistente de interpretación ambiental aparece como una caja negra: una app Android que funciona sin conexión en el PNN Los Nevados. La rodean las personas que la usan, el administrador que prepara el conocimiento en su computador, el backend RAG de ese computador (al que solo se llega por su punto de acceso Wi-Fi y solo durante CU-01) y dos servicios del propio teléfono: las notificaciones y el instalador de paquetes de Android. Responde: ¿qué hay afuera y cómo se comunica el sistema con ello?

Diagrama: [diagramas/contexto.puml](diagramas/contexto.puml)

## 2. Catálogo de elementos

| Elemento | Tipo | Rol o responsabilidad | Interacción con el sistema |
|----------|------|-----------------------|----------------------------|
| Visitante / Turista | Persona | Actualiza la información antes del recorrido y pregunta al asistente | App en su teléfono |
| Guía / Intérprete ambiental | Persona | Igual que el visitante; además es a quien el asistente remite cuando no tiene certeza | App en su teléfono |
| Administrador del computador | Persona | Carga y versiona los PDF validados en el backend y enciende el punto de acceso | No usa la app: trabaja en el computador administrador |
| Asistente de interpretación ambiental | Sistema en alcance | Carga los PDF vectorizados, responde por texto sin conexión y vence la información a las 24 h | Con todos los demás elementos |
| Backend RAG del computador administrador | Sistema externo | Fragmenta y vectoriza los PDF y los sirve ([API.md](../API.md), [qué usa la app](backend-esperado.md)) | HTTP en la red local del punto de acceso, solo en CU-01 |
| Notificaciones de Android | Sistema externo (en el teléfono) | Muestra el aviso de vencimiento aunque la app esté cerrada (ADR-015) | API del sistema a través de expo-notifications |
| Instalador de paquetes de Android | Sistema externo (en el teléfono) | Muestra el diálogo de desinstalación cuando el usuario elige "Sí" (ADR-015) | Intent `android.intent.action.DELETE` a través de expo-intent-launcher |

## 3. Justificación

- RT-01 y EAC-02: la única flecha de red sale hacia el backend local y solo durante CU-01; no hay Internet en el camino.
- RT-05 y ADR-013: no hay flecha hacia Hugging Face ni hacia ningún repositorio de modelos: los modelos vienen en el APK.
- RN-01: el administrador solo carga en el backend PDF validados; el teléfono los recibe tal cual.
- RN-02 y ADR-015: las notificaciones y el instalador de Android son los que permiten avisar y desinstalar al vencer.
- PA-08: ninguna flecha lleva preguntas ni conversaciones fuera del teléfono.

## 4. Comportamiento

Los escenarios (+1) empiezan aquí: [CU-01 actualizar información](diagramas/secuencia/cu01-actualizar-informacion.puml) es el único que cruza la red hacia el backend. [CU-02 consultar por texto](diagramas/secuencia/cu02-consultar-texto.puml) ocurre sin salir del teléfono. [CU-03 vencer la vigencia](diagramas/secuencia/cu03-vencer-vigencia.puml) usa las notificaciones y el instalador de Android.

## 5. Vistas relacionadas

- [Procesos](vistas/02-procesos.md): qué contenedor del teléfono habla con cada sistema externo.
- [Física](vistas/04-fisica.md): por qué red sale cada conexión.
