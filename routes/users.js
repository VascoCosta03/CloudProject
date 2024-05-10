import express from "express";
import db from "../db/config.js";
import { ObjectId } from "mongodb";

const router = express.Router();

router.get("/", async (req, res) => {
  let results = await db.collection("users").find({}).toArray();
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

router.post("/", async (req, res) => {
  // create a new user
  let user = req.body;
  let results = await db.collection("users").insertOne(user);
  res.send(results).status(200);
});

router.get("/:user_id", async (req, res) => {
  // return user by id
  let id = parseInt(req.params.user_id);
  let results = await db.collection("users").findOne({ _id: id });
  res.send(results).status(200);
});

router.delete("/:user_id", async (req, res) => {
  // delete user by id
  let id = parseInt(req.params.user_id);
  let results = await db.collection("users").deleteOne({ _id: id });
  res.send(results).status(200);
});

router.get("/", async (req, res) => {
  //retornar por paginação e limite de users ex1
  const page = parseInt(req.query.page);
  const limit = parseInt(req.query.limit);

  const totalMovies = await db.collection('users').countDocuments();
  const totalPages = Math.ceil(totalMovies / limit);

  const skip = (page - 1) * limit;
  const movies = await db.collection('users').find({}).skip(skip).limit(limit).toArray();

  res.status(200).json({
      movies,
      currentPage: page,
      totalPages,
      totalMovies
  });
});

export default router;
