import { poolPromise, sql } from "./db.js";

const TABLE_NAME = "Cartelera3067";

export const getAllPeliculas = async () => {
  const pool = await poolPromise;
  const result = await pool.request().query(`SELECT * FROM ${TABLE_NAME}`);
  return result.recordset;
};

export const createPelicula = async (pelicula) => {
  const { imdbID, Title, Year, Type, Poster, Estado, description, Ubication } = pelicula;

  const pool = await poolPromise;
  await pool
    .request()
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
};

export const updatePelicula = async (imdbID, pelicula) => {
  const { Title, Year, Type, Poster, Estado, description, Ubication } = pelicula;

  const pool = await poolPromise;
  const result = await pool
    .request()
    .input("updateID", sql.NVarChar(50), imdbID)
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

  // Retornamos el número de filas afectadas para que el controlador pueda verificar si se actualizó algo.
  return result.rowsAffected[0];
};