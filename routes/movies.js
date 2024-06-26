import express from "express";
import db from "../db/config.js";
import { ObjectId } from "mongodb";

const router = express.Router();


// 1 - return movies by pagination and limit
// 
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

// 12 - return movies with most ratings asc or desc 
router.get("/ratings/:order", async (req, res) => {

  let order = req.params.order;
  let orderType = order === "asc" ? 1 : -1;
  let results = await db.collection("users").aggregate([
    { $unwind: "$movies" },
    { $group: {
        _id: "$movies.movieid",
        count: { $sum: 1 }
    }
    },
    { $sort: { count: orderType } },
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
  res.status(200).send(results);
});

// 13 - return movies with most 5 star ratings
router.get("/star", async (req, res) => {
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

// 16 - list all movies that contain their original title and return it as a new field
router.get("/originaltitle", async (_, res) => {
  let results = await db.collection("movies").aggregate([
    { 
      $addFields: { 
        original_title: {
          $regexFind: {
            input: "$title", 
            regex: /\((.*?)\)/,
          }
        } 
      } 
    },
    {
      $match: {
        "original_title.match": { $ne: null } 
      }
    },
    {
      $project: {
        original_title: "$original_title.match",
        _id: 1,
        title: 1,
        genres: 1,
        year: 1
      }
    }
  ]).toArray();
  res.status(200).send(results);
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

// 11 - return movies with highest average rating limited by num_movies
router.get("/higher/:num_movies", async (req, res) => {
  let num_movies = parseInt(req.params.num_movies);
  let results = await db.collection("users").aggregate([
    { $unwind: "$movies" },
    { $group: {
        _id: "$movies.movieid",
        averageRating: { $avg: "$movies.rating" }
    }},
    { $sort: { averageRating: -1 }},
    { $limit: num_movies },
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
  res.status(200).send(results);
});

// 15 - return movies by genre and year
router.get("/genres/:genre_name/year/:year", async (req, res) => {
  let genre = req.params.genre_name;
  // capitalize first letter of genre
  genre = genre.charAt(0).toUpperCase() + genre.slice(1);
  let year = req.params.year;
  let results = await db.collection("movies").aggregate([
    { $unwind: "$genres"},
    { $match: { genres: genre, year: year } }
  ]).toArray();
  res.status(200).send(results);
});


export default router;
