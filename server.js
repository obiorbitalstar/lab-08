'use strict';

require('dotenv').config();
const express = require('express');
const pg = require('pg');
const PORT = process.env.PORT || 4000;
const superagent= require('superagent');
const cors = require('cors');
const app = express();
app.use(cors());
const client = new pg.Client(process.env.DATABASE_URL);


app.get('/', (request, response) => {
  response.send('Home Page !');
});

app.get('/location', locationHandler);
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





function locationHandler(request,response){
  const city = request.query.city;
  getLocationData(city)
    .then(data => {render(data,response);})
    .catch(error =>{ errorHandler(error,request,response);});

}

function getLocationData(city){
  let SQL = ' SELECT * FROM locations WHERE search_query = $1';
  let values = [city];
  return client.query(SQL,values)
    .then(results =>{
      if(results.rowCount){return results.rows[0];}
      else{
        let key = process.env.GEOCODE_API_KEY;
        const url = `https://eu1.locationiq.com/v1/search.php?key=${key}&q=${city}&format=json&limit=1`;
        return superagent.get(url)
          .then(data => { cacheLocation(city,data.body);});
      }
    });
}

function cacheLocation(city,data){
  const location = new Location(data[0]);
  let SQL = `INSERT INTO locations (search_query,formatted_query,lattitude,longitude) VALUES($1,$2,$3,$4) RETURNING *`;
  let values= [city,location.formatted_query,location.latitude,location.longitude];
  return client.query(SQL,values)
    .then(results => results.rows[0]);

}


function render (data,response){

  response.status(200).json(data);
}

function notFoundHandler(request,response){
  response.status(404).send('Hmmm, not quit my tempo');

}

function errorHandler(error,request,response){

  response.status(500).send(error);

}
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
