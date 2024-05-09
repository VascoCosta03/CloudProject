import express from "express";
import movies from "./routes/movies.js";
import users from "./routes/users.js";
import geo from "./routes/geo.js";
import db from "./db/config.js";

const app = express();
const port = 3000;

app.use(express.json());
// Load the /movies routes
app.use("/movies", movies);
// Load the /users routes
app.use("/users", users);

app.use("/geo", geo);

app.listen(port, () => {
  console.log(`backend listening on port ${port}`);
});
