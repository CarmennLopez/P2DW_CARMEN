import express from "express";
import sql from "mssql";
import "dotenv/config"; 
// Importamos la especificación y el middleware del archivo swagger.js
import { swaggerSpec, swaggerUiMiddleware } from "./swagger.js";

// ================================
// Variables de entorno
// ================================
console.log("📌 Variables de entorno cargadas:");
console.log("DB_USER:", process.env.DB_USER);
console.log("DB_PASS:", process.env.DB_PASS ? "****" : "❌ NO DEFINIDO");
console.log("DB_SERVER:", process.env.DB_SERVER);
console.log("DB_NAME:", process.env.DB_NAME);

// ================================
// Configuración SQL Server
// ================================
const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    server: process.env.DB_SERVER, 
    database: process.env.DB_NAME, 
    options: {
        encrypt: true,
        trustServerCertificate: true,
    },
};

// Nombre de la tabla de Cartelera
const TABLE_NAME = "Cartelera3067";

// ================================
// Pool de conexión
// ================================
const poolPromise = new sql.ConnectionPool(dbConfig)
    .connect()
    .then(pool => {
        console.log("✅ Conectado a SQL Server");
        return pool;
    })
    .catch(err => {
        console.error("❌ Error de conexión a SQL Server:");
        console.error("Detalles:", err.message);
        return null;
    });

// ================================
// Servidor Express
// ================================
const app = express();
app.use(express.json());

// Configuración de Swagger
// Usamos el middleware importado de swagger.js
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
        const pool = await poolPromise;
        if (!pool) return res.status(500).json({ codError: "500", msgRespuesta: "BD no conectada" });

        const result = await pool.request().query(`SELECT * FROM ${TABLE_NAME}`);
        res.json(result.recordset);
    } catch (err) {
        console.error("❌ Error GET:", err);
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
        const pool = await poolPromise;
        if (!pool) throw new Error("No hay conexión a la BD");

        const { imdbID, Title, Year, Type, Poster, Estado, description, Ubication } = req.body;
        
        if (!imdbID || !Title || !Year) {
            return res.status(400).json({ codError: "400", msgRespuesta: "Faltan campos clave (imdbID, Title, Year)" });
        }

        await pool.request()
            .input("imdbID", sql.NVarChar(50), imdbID)
            .input("Title", sql.NVarChar(255), Title)
            .input("Year", sql.NVarChar(10), Year)
            .input("Type", sql.NVarChar(50), Type)
            .input("Poster", sql.NVarChar(500), Poster)
            .input("Estado", sql.Bit, Estado)
            .input("description", sql.NVarChar(sql.MAX), description)
            .input("Ubication", sql.NVarChar(100), Ubication)
            .query(`INSERT INTO ${TABLE_NAME} (imdbID, Title, Year, Type, Poster, Estado, description, Ubication)
                     VALUES (@imdbID, @Title, @Year, @Type, @Poster, @Estado, @description, @Ubication)`);

        // Respuesta de éxito (Serie I)
        res.status(201).json({ codError: "201", msgRespuesta: "Registro Insertado" });
    } catch (err) {
        console.error("❌ Error POST:", err);
        // El error 400 también captura la violación de Clave Primaria (Duplicado)
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
        const pool = await poolPromise;
        if (!pool) throw new Error("No hay conexión a la BD");

        // Obtiene el ID a actualizar de la Query String (?imdbID=...)
        const { imdbID: updateID } = req.query;
        // Desestructuración completa de los 8 campos del Body
        const { Title, Year, Type, Poster, Estado, description, Ubication } = req.body;

        if (!updateID) return res.status(400).json({ codError: "400", msgRespuesta: "Falta parámetro 'imdbID' en QueryString" });

        const result = await pool.request()
            .input("updateID", sql.NVarChar(50), updateID)
            .input("Title", sql.NVarChar(255), Title)
            .input("Year", sql.NVarChar(10), Year)
            .input("Type", sql.NVarChar(50), Type)
            .input("Poster", sql.NVarChar(500), Poster)
            .input("Estado", sql.Bit, Estado)
            .input("description", sql.NVarChar(sql.MAX), description)
            .input("Ubication", sql.NVarChar(100), Ubication)
            .query(`UPDATE ${TABLE_NAME} SET 
                     Title=@Title, Year=@Year, Type=@Type, Poster=@Poster, Estado=@Estado, description=@description, Ubication=@Ubication
                     WHERE imdbID=@updateID`);

        // Si no se afectó ninguna fila, el registro no existe
        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ codError: "404", msgRespuesta: "Registro no encontrado" });
        }

        // Respuesta de éxito (Serie II)
        res.status(200).json({ codError: "200", msgRespuesta: "Registro actualizado correctamente" });
    } catch (err) {
        console.error("❌ Error PUT:", err);
        res.status(400).json({ codError: "400", msgRespuesta: err.message });
    }
});


// ================================
// Servidor
// ================================
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`📝 Documentación de la API en http://localhost:${PORT}/api-docs`);
});
