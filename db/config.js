import { MongoClient } from "mongodb";

const connectionString = "mongodb+srv://vmbca:vascocosta03@cloud.549jtzm.mongodb.net/";

const client = new MongoClient(connectionString);

let conn;

try {
  conn = await client.connect();
} catch (e) {
  console.error(e);
}

// Database name
let db = conn.db("CloudProject");
export default db;
