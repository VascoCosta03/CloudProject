import express from "express";
import db from "../db/config.js";
import { ObjectId } from "mongodb";

const router = express.Router();

// 17 - Add movies from movies collection to cinemas collection
// example = /cinemas/addMovie?movieID=2&cinemaID=1
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

// 19 - return movies near location
// example = /cinemas/near?lat=40.748817&lon=-73.985428
router.get("/near", async (req, res) => {
    const lon = parseFloat(req.query.lon);
    const lat = parseFloat(req.query.lat);
    console.log(lon)
    console.log(lat)
    let results = await db.collection("cinemas").find({
        'geometry': {
            $near: {
                $geometry: {
                    type: 'Point', 
                    coordinates: [lon, lat]
                },
                    $maxDistance: 5000
                }
            }
        }).toArray();

    res.status(200).send(results);
});

// 18 - Get all movies from a cinema
// example = /cinemas/1
router.get("/:cinemaID", async (req, res) => {
    const cinemaID = parseInt(req.params.cinemaID);
    const cinema = await db.collection("cinemas").findOne({ id: cinemaID });

    // check for cinema
    if (!cinema) {
        res.status(404).send("Cinema not found");
        return;
    }

    let results = await db.collection("cinemas").aggregate([
        { $unwind: "$movies" },
        { $match: { id: cinemaID } },
        {
            $lookup: {
                from: "movies",
                localField: "movies",
                foreignField: "_id",
                as: "movieInfo"
            }
        },
        { $unwind: "$movieInfo" }
    ]).toArray();

    // check for movies
    if (results.length === 0) {
        res.status(404).send("No movies found for this cinema");
        return;
    }
    else {
        results = results.map((result) => result.movieInfo);
        res.status(200).send(results);
        return
    }
    
});


export default router;