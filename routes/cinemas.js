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

// 19 - return cinemas near location
// example = /cinemas/near?lat=38.7155597377788&lon=-9.14217296415889
router.get("/near", async (req, res) => {
    try {
        const lon = parseFloat(req.query.lon);
        const lat = parseFloat(req.query.lat);

        // Check if lon and lat are valid numbers
        if (isNaN(lon) || isNaN(lat)) {
            return res.status(400).send({ error: 'Invalid coordinates' });
        }

        let results = await db.collection("cinemas").find({
            'geometry': {
                $near: {
                    $geometry: {
                        type: 'Point', 
                        coordinates: [lon, lat],
                    },
                    $maxDistance: 5000
                }
            }
        }).toArray();

        res.status(200).send(results);
    } catch (error) {
        console.error('Error executing geo query:', error);
        res.status(500).send({ error: 'Internal server error' });
    }
});

//20 - return cinemas near route
// example = /cinemas/nearRoute?lon=-9.14217296415889&lat=38.7155597377788&lon2=-9.94217296415889&lat2=39.9155597377788
router.get("/nearRoute", async (req, res) => {
    try {
        const lon = parseFloat(req.query.lon);
        const lat = parseFloat(req.query.lat);
        const lon2 = parseFloat(req.query.lon2);
        const lat2 = parseFloat(req.query.lat2);

        // Define the LineString route
        const route = {
            type: "LineString",
            coordinates: [[lon, lat], [lon2, lat2]]
        };

        // Find cinemas that intersect with the LineString route
        let results = await db.collection("cinemas").find({
            'geometry': {
                $geoIntersects: {
                    $geometry: route
                }
            }
        }).toArray();

        if (results.length > 0) {
            res.status(200).send(results);
        } else {
            res.status(404).send({ message: 'No cinemas found near the route' });
        }
    } catch (error) {
        console.error('Error executing geo query:', error);
        res.status(500).send({ error: 'Internal server error' });
    }
});

// 21 - return how many cinemas near location
// example = /cinemas/howmany?lat=38.7155597377788&lon=-9.14217296415889
router.get("/howmany", async (req, res) => {
    try {
        const lon = parseFloat(req.query.lon);
        const lat = parseFloat(req.query.lat);

        if (isNaN(lon) || isNaN(lat)) {
            return res.status(400).send({ error: 'Invalid coordinates' });
        }

        const results = await db.collection("cinemas").aggregate([
            {
                $geoNear: {
                    near: {
                        type: "Point",
                        coordinates: [lon, lat]
                    },
                    distanceField: "dist.calculated",
                    maxDistance: 5000,
                }
            },
            {
                $count: "Count"
            }
        ]).toArray();

        if (results.length > 0) {
            res.status(200).send({results});
        } else {
            res.status(200).send({results: 0});
        }
    } catch (error) {
        console.error('Error executing geo query:', error);
        res.status(500).send({ error: 'Internal server error' });
    }
});

// 22 - Return if point inside festival
// example = /cinemas/festival?lat=38.7155597377788&lon=-9.14217296415889
router.get("/festival", async (req, res) => {
    try {
        const lon = parseFloat(req.query.lon);
        const lat = parseFloat(req.query.lat);

        if (isNaN(lon) || isNaN(lat)) {
            return res.status(400).send({ error: 'Invalid coordinates' });
        }

        const festival = await db.collection("cinemas").findOne({ id: 15 });

        if (!festival) {
            return res.status(404).send({ error: 'Festival not found' });
        }

        const point = { type: "Point", coordinates: [lon, lat] };

        // Query for polygons that intersect with the point
        const results = await db.collection("cinemas").findOne({
            geometry: {
                $geoWithin: {
                    $geometry: {
                        type: "Polygon",
                        coordinates: festival.geometry.coordinates
                    }
                }
            }
        });

        if (results.length > 0) {
            res.status(200).send({ inside: true });
        } else {
            res.status(200).send({ inside: false });
        }
    } catch (error) {
        console.error('Error executing geo query:', error);
        res.status(500).send({ error: 'Internal server error' });
    }
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