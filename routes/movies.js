import express from "express";
import db from "../db/config.js";
import { ObjectId } from "mongodb";

const router = express.Router();


// 1 - return movies by pagination and limit
router.get("/", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  let results = await db.collection("movies").find({}).skip((page - 1) * 20).limit(limit).toArray();
  res.send(results).status(200);
});

// 3 - create a new movie
router.post("/", async (req, res) => {
  let movie = req.body;
  let results = await db.collection("movies").insertOne(movie);
  res.send(results).status(200);
});

// 5 - return movie by id and average rating
router.get("/:movie_id", async (req, res) => {
  let id = parseInt(req.params.movie_id);

  const averageRating = await db.collection('users').aggregate([
    { $unwind: "$movies" },
    { $match: { "movies.movieid": id } },
    { $group: {
        _id: "$movies.movieid",
        averageRating: { $avg: "$movies.rating" }
    }}
  ]).toArray();
  
  let results = await db.collection("movies").find({ _id: id }).toArray();
  if (results.length === 0) {
    res.send({}).status(404);
    return;
  }
  results[0].averageRating = parseFloat(averageRating[0].averageRating.toFixed(2));

  res.send(results[0]).status(200);
});

// 7 - delete movie by id
router.delete("/:movie_id", async (req, res) => {
  let id = parseInt(req.params.movie_id);
  let results = await db.collection("movies").deleteOne({ _id: id });
  res.send(results).status(200);
});

// 9 - update movie
router.put("/:movie_id", async (req, res) => {
  let id = parseInt(req.params.movie_id);
  let movie = req.body;
  let results = await db.collection("movies").updateOne({ _id: id }, { $set: movie });
  res.send(results).status(200);
});


router.get("/top/:limit", async (req, res) => {
  // return 10 movies by id
  let limit = parseInt(req.params.limit);
  let results = await db.collection("movies").find({}).limit(limit).toArray();
  res.send(results).status(200);
});


export default router;
