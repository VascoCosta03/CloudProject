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

// Nao funciona
// 11 - return movies with highest average rating limited by num_movies
router.get("/higher/:num_movies", async (req, res) => {
  let num_movies = parseInt(req.params.num_movies);
  let results = await db.collection("movies").aggregate([
    { $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: 'movies.movieid',
        as: 'users'
    }},
    { $unwind: "$users" },
    { $unwind: "$users.movies" },
    { $group: {
        _id: "$_id",
        title: { $first: "$title" },
        averageRating: { $avg: "$users.movies.rating" }
    }},
    { $sort: { averageRating: -1 }},
    { $limit: num_movies }
  ]).toArray();
  res.send(results).status(200);
});

// Nao funciona
// 12 - return movies with most ratings asc or desc 
router.get("/ratings/:order", async (req, res) => {
  let order = req.params.order;
  let sortOrder = order === "asc" ? 1 : -1;
  let results = await db.collection("movies").aggregate([
    { $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: 'movies.movieid',
        as: 'users'
    }},
    { $unwind: "$users" },
    { $group: {
        _id: "$_id",
        title: { $first: "$title" },
        ratings: { $sum: 1 }
    }},
    { $sort: { ratings: sortOrder }}
  ]).toArray();
  res.send(results).status(200);
});

// 13 - return movies with most 5 star ratings
router.get("/teste/star", async (req, res) => {
  const topRatedMovies = await db.collection('users').aggregate([
    { $unwind: "$movies" },
    { $match: { "movies.rating": 5 }},
    { $group: {
        _id: "$movies.movieid",
        count: { $sum: 1 }
    }},
    { $sort: { count: -1 }},
    { $limit: 5 },
    {
      $lookup: {
        from: "movies",
        localField: "_id",
        foreignField: "_id",
        as: "movieInfo"
      }
    },
    {
      $unwind: "$movieInfo"
    }
  ]).toArray();

  res.status(200).json(topRatedMovies);
});

router.get("/top/:limit", async (req, res) => {
  // return 10 movies by id
  let limit = parseInt(req.params.limit);
  let results = await db.collection("movies").find({}).limit(limit).toArray();
  res.send(results).status(200);
});


export default router;
