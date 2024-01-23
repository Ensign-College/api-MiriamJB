/* COMMANDS:
    npm run dev = run this program with automatic restarts on updates
    node index.js = run this program
    docker-compose up -d = runs docker in the background (deamon) & rebuilds containers (specified in docker-compose.yml)
*/

//express is a framework for node.js
//it makes APIs - connects frontend to database backend
//require = import (import needs more steps to work)
const express = require('express');
const Redis = require('redis');

const redisClient = Redis.createClient({
    url : `redis://localhost:6379`
});

const app = express(); //creates an express application
const port = 3000;
app.listen(port, ()=>{
    redisClient.connect(); //connects to the redis database
    console.log(`API is listening on port ${port}`);
}); //listens for web requests from frontend on port 3000 (and doesn't stop)

/* Using an API:
    1. URL
    2. function to return boxes
    req = resquest from the browser
    res = response to the bowser    
*/

app.get('/boxes', (req,res) => {
    let boxes = redisClient.json.get('boxes', {path:'$'}); //gets boxes

    //send boxes to browser
    res.send(JSON.stringify(boxes)); //convert boxes to a string
}); //return boxes to user

console.log("Hello World");