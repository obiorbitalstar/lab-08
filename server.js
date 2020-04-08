'use strict';

require('dotenv').config();
const express = require('express');
const pg = require('pg');
const PORT = process.env.PORT || 4000;
// const superagent= require('superagent');
const app = express();

const client = new pg.Client(process.env.DATABASE_URL);


app.get('/', (request, response) => {
  response.send('Home Page !');
});

// app.get('/location', locationHandler);
app.use('*', notFoundHandler);
app.use(errorHandler);

app.get('/add', (req, res) => {
  let city = req.query.city;
  let longitude = req.query.longitude;
  let latitude = req.query.latitude;

  const SQL = 'INSERT INTO locations(search_query,latitude,longitude) VALUES ($1,$2,$3) RETURNING *';
  const safeValues = [city,longitude,latitude];
  client
    .query(SQL, safeValues)
    .then((results) => {
      res.status(200).json(results.rows);
    })
    .catch((err) => {
      res.status(500).send(err);
    });
});


app.get('/location',(request,response)=>{
  const SQL = 'SELECT * FROM locations;';
  client
    .query(SQL)
    .then((results) => {
      response.status(200).json(results.rows);
    })
    .catch((err) => {
      response.status(500).send(err);
    });
});



client.on('error', (err) => {
  throw new Error(err);
});
client
  .connect()
  .then(() => {
    app.listen(PORT, () =>
      console.log(`my server is up and running on port ${PORT}`)
    );
  })
  .catch((err) => {
    throw new Error(`startup error ${err}`);
  });




// function locationHandler(request, response) {
//   const city = request.query.city;
//   superagent(
//     `https://eu1.locationiq.com/v1/search.php?key=${process.env.GEOCODE_API_KEY}&q=${city}&format=json`
//   )
//     .then((res) => {
//       const geoData = res.body;
//       const locationData = new Location(city, geoData);
//       response.status(200).json(locationData);
//     })
//     .catch((error) => errorHandler(error, request, response));
// }

// function Location(city, geoData) {
//   this.search_query = city;
//   this.formatted_query = geoData[0].display_name;
//   this.latitude = geoData[0].lat;
//   this.longitude = geoData[0].lon;
// }

function notFoundHandler(request, response) {
  response.status(404).send('NOT FOUND!');
}

function errorHandler(error, request, response) {
  response.status(500).send(error);
}
