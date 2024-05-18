import express from "express";
import db from "../db/config.js";
import { ObjectId } from "mongodb";

const router = express.Router();

// 1 - Add movies from movies collection to cinemas collection
router.get("/addMovie", async (req, res) => {
    const movieID = parseInt(req.query.movieID);
    const cinemaID = parseInt(req.query.cinemaID);

    const movie = await db.collection("movies").findOne({ _id: movieID });
    const cinema = await db.collection("cinemas").findOne({ id: cinemaID });

    if (!movie || !cinema) {
        res.status(404).send("Movie or Cinema not found");
        return;
    }

    let result;
    if (!cinema.movies) {
        // If the movies field doesn't exist, create it as an array with the first movie
        result = await db.collection("cinemas").updateOne(
            { id: cinemaID },
            { $set: { movies: [movieID] } }
        );
    } else {
        // If the movies field exists, add the new movie to the array
        result = await db.collection("cinemas").updateOne(
            { id: cinemaID },
            { $push: { movies: movieID } }
        );
    }

    if (result.modifiedCount > 0) {
        res.status(200).send("Movie added to cinema successfully");
    } else {
        res.status(500).send("Failed to add movie to cinema");
    }
});

export default router;