use("CloudProject");

db.geo.find({
  location: {
    $geoWithin: {
      $center: [[-74.011, 40.703], 1 / 6371],
    },
  },
});

db.geo.find({
  location: {
    $geoWithin: {
      $center: [[-74.005, 40.712], 0.5 / 6371],
    },
  },
});

db.geo.find({
  location: {
    $geoWithin: {
      $geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-74.011, 40.703],
            [-73.985, 40.703],
            [-73.985, 40.758],
            [-74.011, 40.758],
            [-74.011, 40.703],
          ],
        ],
      },
    },
  },
});
