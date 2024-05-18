import express from "express";
import db from "../db/config.js";
import { ObjectId } from "mongodb";

const router = express.Router();


// 2 - return users by pagination and limit
router.get("/", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;

  let results = await db.collection("users").find({}).skip((page - 1) * 20).limit(limit).toArray();
  res.send(results).status(200);
});

// 14 - return for each user id, name, max rating, min rating, avg rating, order by avg rating
router.get("/stats", async (req, res) => {
  const results = await db.collection('users').aggregate([
    { $unwind: "$movies" },
    { $group: {
        _id: "$_id",
        name: { $first: "$name" },
        maxRating: { $max: "$movies.rating" },
        minRating: { $min: "$movies.rating" },
        avgRating: { $avg: "$movies.rating" }
    }},
    { $sort: { avgRating: -1 }}
  ]).toArray();
  res.status(200).json(results);
});

// 4 - create a new user
router.post("/", async (req, res) => {
  let user = req.body;
  let results = await db.collection("users").insertOne(user);
  res.send(results).status(200);
});

// 6 - return user by id and top 5 movies
router.get("/:id", async (req, res) => {
  let id = parseInt(req.params.id);

  const user = await db.collection('users').findOne({ _id: id });

  const moviesRating = await db.collection('users').aggregate([
    { $match: { _id: id } },
    { $unwind: "$movies" },
    { $sort: { "movies.rating": -1 } },
    { $limit: 5 },
    { $lookup: {
        from: 'movies',
        localField: 'movies.movieid',
        foreignField: '_id',
        as: 'movie'
    }},
    { $unwind: "$movie" },
    { $project: {
        _id: 0,
        movie: 1,
        rating: "$movies.rating"
    }}
  ]).toArray();

  res.status(200).json({ user, moviesRating });
});

// 8 - delete user by id
router.delete("/:user_id", async (req, res) => {
  let id = parseInt(req.params.user_id);
  let results = await db.collection("users").deleteOne({ _id: id });
  res.send(results).status(200);
});

// 10 - update user
router.put("/:user_id", async (req, res) => {
  let id = parseInt(req.params.user_id);
  let user = req.body;
  let results = await db.collection("users").updateOne({ _id: id }, { $set: user });
  res.send(results).status(200);
});

router.get("/:gender/:age", async (req, res) => {
  // return user with gender and age
  let gender = req.params.gender.toUpperCase();
  let age = parseInt(req.params.age);
  let results = await db
    .collection("users")
    .find({ gender: gender, age: age })
    .toArray();
  res.send(results).status(200);
});


export default router;
