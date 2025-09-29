import express from "express";
import "dotenv/config"; 
import { swaggerSpec, swaggerUiMiddleware } from "./swagger.js";
import { poolPromise } from "./db.js"; // Solo para verificar la conexión al inicio
import * as carteleraService from "./cartelera.service.js";

// ================================
// Variables de entorno
// ================================
console.log("📌 Variables de entorno cargadas:");
console.log("DB_SERVER:", process.env.DB_SERVER); // Mantenemos esto para feedback inicial

// ================================
// Servidor Express
// ================================
const app = express();
app.use(express.json());

app.use("/api-docs", swaggerUiMiddleware.serve, swaggerUiMiddleware.setup(swaggerSpec));

/**
 * @swagger
 * components:
 *   schemas:
 *     Pelicula:
 *       type: object
 *       required:
 *         - imdbID
 *         - Title
 *         - Year
 *       properties:
 *         imdbID:
 *           type: string
 *           description: ID de la película (Clave Primaria, formato ttXXXX)
 *           example: "tt80000"
 *         Title:
 *           type: string
 *           description: Título de la película
 *           example: "Titanes del Atlantico"
 *         Year:
 *           type: string
 *           description: Año de lanzamiento
 *           example: "2013"
 *         Type:
 *           type: string
 *           description: Género de la película
 *           example: "Ciencia Ficcion"
 *         Poster:
 *           type: string
 *           description: URL del póster
 *           example: "https://demo/demoimages.png"
 *         Estado:
 *           type: boolean
 *           description: Estado de disponibilidad (True=en Cartelera)
 *           example: true
 *         description:
 *           type: string
 *           description: Sinopsis o descripción de la trama
 *           example: "La humanidad se transforma en robots gigantes..." 
 *         Ubication:
 *           type: string
 *           description: Ubicación o sala de cine
 *           example: "POPCINEMA"
 */

// ===============================================
// RUTAS DE LA API (Serie I, II, III)
// ===============================================

/**
 * @swagger
 * /api/cartelera:
 *   get:
 *     summary: Consulta todas las películas (Serie III)
 *     tags: [Cartelera]
 *     responses:
 *       '200':
 *         description: Lista de películas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Pelicula'
 *       '500':
 *         description: Error del servidor o conexión a BD
 */
app.get("/api/cartelera", async (req, res) => {
    try {
        const peliculas = await carteleraService.getAllPeliculas();
        res.json(peliculas);
    } catch (err) {
        res.status(500).json({ codError: "500", msgRespuesta: err.message });
    }
});

/**
 * @swagger
 * /api/cartelera:
 *   post:
 *     summary: Inserta una nueva película (Serie I)
 *     tags: [Cartelera]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Pelicula'
 *     responses:
 *       '201':
 *         description: Registro insertado correctamente
 *         content:
 *           application/json:
 *             example:
 *               codError: "201"
 *               msgRespuesta: "Registro Insertado"
 *       '400':
 *         description: Error en los datos o clave primaria duplicada
 */
app.post("/api/cartelera", async (req, res) => {
    try {
        const { imdbID, Title, Year } = req.body;
        
        if (!imdbID || !Title || !Year) { // La validación se queda en el controlador
            return res.status(400).json({ codError: "400", msgRespuesta: "Faltan campos clave (imdbID, Title, Year)" });
        }

        await carteleraService.createPelicula(req.body);

        res.status(201).json({ codError: "201", msgRespuesta: "Registro Insertado" });
    } catch (err) {
        // El error 400 es común para datos inválidos o duplicados (violación de PK)
        res.status(400).json({ codError: "400", msgRespuesta: err.message });
    }
});

/**
 * @swagger
 * /api/cartelera:
 *   put:
 *     summary: Actualiza una película existente (Serie II)
 *     tags: [Cartelera]
 *     parameters:
 *       - in: query
 *         name: imdbID
 *         required: true
 *         schema:
 *           type: string
 *         description: El imdbID de la película a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Pelicula'
 *     responses:
 *       '200':
 *         description: Registro actualizado correctamente
 *         content:
 *           application/json:
 *             example:
 *               codError: "200"
 *               msgRespuesta: "Registro actualizado correctamente"
 *       '400':
 *         description: Solicitud inválida (falta imdbID en QueryString)
 *       '404':
 *         description: Registro no encontrado
 */
app.put("/api/cartelera", async (req, res) => {
    try {
        const { imdbID: updateID } = req.query;

        if (!updateID) return res.status(400).json({ codError: "400", msgRespuesta: "Falta parámetro 'imdbID' en QueryString" });

        const rowsAffected = await carteleraService.updatePelicula(updateID, req.body);

        if (rowsAffected === 0) {
            return res.status(404).json({ codError: "404", msgRespuesta: "Registro no encontrado" });
        }

        res.status(200).json({ codError: "200", msgRespuesta: "Registro actualizado correctamente" });
    } catch (err) {
        res.status(400).json({ codError: "400", msgRespuesta: err.message });
    }
});


// ================================
// Servidor
// ================================
const PORT = process.env.PORT || 3001;

// Verificamos la conexión a la BD antes de iniciar el servidor
poolPromise.then(pool => {
    if (pool) {
        app.listen(PORT, () => {
            console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
            console.log(`📝 Documentación de la API en http://localhost:${PORT}/api-docs`);
        });
    } else {
        console.log("❌ No se pudo iniciar el servidor por falta de conexión a la BD.");
    }
}).catch(err => console.log("❌ Falló el inicio del servidor.", err));
