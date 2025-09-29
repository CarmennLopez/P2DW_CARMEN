import sql from "mssql";
import dotenv from "dotenv";

dotenv.config();

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  options: {
    encrypt: true,
    trustServerCertificate: true
  }
};
console.log("DB_SERVER:", process.env.DB_SERVER);

const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then(pool => {
    console.log("✅ Conectado a SQL Server en Azure");
    return pool;
  })
  .catch(err => {
    console.error("❌ Error al conectar a SQL Server:", err);
    throw err;
  });

export { sql, poolPromise };
