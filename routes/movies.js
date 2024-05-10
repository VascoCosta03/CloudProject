import express from "express";
import db from "../db/config.js";
import { ObjectId } from "mongodb";

const router = express.Router();

router.get("/", async (req, res) => {
  let results = await db.collection("movies").find({}).toArray();
  res.send(results).status(200);
});

router.get("/:movie_id", async (req, res) => {
  // return movie by id
  let id = parseInt(req.params.movie_id);
  let results = await db.collection("movies").findOne({ _id: id });
  res.send(results).status(200);
});

router.get("/top/:limit", async (req, res) => {
  // return 10 movies by id
  let limit = parseInt(req.params.limit);
  let results = await db.collection("movies").find({}).limit(limit).toArray();
  res.send(results).status(200);
});

router.post("/", async (req, res) => {
  // create a new movie
  let movie = req.body;
  let results = await db.collection("movies").insertOne(movie);
  res.send(results).status(200);
});

router.delete("/:movie_id", async (req, res) => {
  // delete movie by id
  let id = parseInt(req.params.movie_id);
  let results = await db.collection("movies").deleteOne({ _id: id });
  res.send(results).status(200);
});

router.post("/", async (req, res) => {
  // inserir varios movies
  let movie = req.body;
  let results = await db.collection('movies').insertMany(movie);
  res.send(results).status(200);
});

router.get("/:id", async (req, res) => {
  // retornar os 5 melhores filmes pelo rating
  let id = parseInt(req.params.id); // adicionar o match

  const topMovies = await db.collection('users').aggregate([
      { $unwind: "$movies" },
      { $group: {
          _id: "$movies.movieid",
          ratings_totais: { $count: "movies.rating"}
      }},
      { $sort: { ratings_totais: -1 }}.limit(5),
  ]).toArray();

  res.status(200).json({ id, topMovies });
});

export default router;
