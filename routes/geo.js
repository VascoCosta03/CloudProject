import express from "express";
import db from "../db/config.js";
import { ObjectId } from "mongodb";

const router = express.Router();

router.get("/", async (req, res) => {
  let results = await db.collection("geo").find({}).toArray();
  res.send(results).status(200);
});

router.get("/:name", async (req, res) => {
  // return geo by name
  const name = req.params.name;
  let results = await db.collection("geo").findOne({ name: name });
  res.send(results).status(200);
});

function getGeo1km(lan, lat) {
  return db.collection("geo").find({
    location: {
      $geoWithin: {
        $center: [[lan, lat], 1 / 6371],
      },
    },
  });
}

router.get("/near/:lan/:lat", async (req, res) => {
  // return geo by name
  const lan = parseFloat(req.params.lan);
  const lat = parseFloat(req.params.lat);
  let results = await getGeo1km(lan, lat).toArray();
  res.send(results).status(200);
});

export default router;
