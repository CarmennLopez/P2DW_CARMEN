import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            // Título específico para el examen UMG
            title: "API Cartelera (Examen UMG)", 
            version: "1.0.0",
            description: "Documentación para la API REST de Cartelera, cubriendo Series I (POST), II (PUT) y III (GET).",
        },
        // Definición de Tags para organizar los métodos
        tags: [
            {
                name: "Cartelera",
                description: "Operaciones de la API (GET, POST, PUT) de la tabla Cartelera3067",
            },
        ],
        servers: [
            {
                url: "http://localhost:3001",
                description: "Servidor local",
            },
        ],
    },
    // Es crucial que apunte correctamente a index.js para leer las anotaciones /** @swagger */
    apis: ["./index.js"], 
};

// Generar la especificación Swagger
export const swaggerSpec = swaggerJsdoc(options);

// Exportar el middleware UI para ser usado en index.js
export const swaggerUiMiddleware = swaggerUi;
