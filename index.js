/* COMMANDS:
    npm run dev = run this program with automatic restarts on updates
    node index.js = run this program
    docker-compose up -d = runs docker in the background (deamon) & rebuilds containers (specified in docker-compose.yml)
    http://localhost:3001/boxes - address it is running on
*/

//require = import (import needs more steps to work)
//express is a framework for node.js
//it makes APIs - connects frontend to database backend
const express = require('express');
const Redis = require('redis');
const bodyParser = require('body-parser');
const cors = require('cors');

const options = {
    origin: 'http://localhost:3000' //allow frontend to call this URL for the backend
}

const redisClient = Redis.createClient({
    url : `redis://localhost:6379`
});

const app = express(); //creates an express application
const port = 3001;

app.use(bodyParser.json());
app.use(cors(options)); //allow frontend to call backend

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

app.get('/boxes', async (req,res) => {
    let boxes = await redisClient.json.get('boxes', {path:'$'}); //gets boxes; without 'await' it returns a Promise to the frontend (that's bad)
    res.json(boxes[0]); //convert boxes to a string and send to browser
}); //return boxes to user

app.post('/boxes', async (req,res) => {
    const newBox = req.body;
    newBox.id = parseInt(await redisClient.json.arrLen('boxes', '$')) + 1;
    await redisClient.json.arrAppend('boxes', '$', newBox); //saves the new JSON in Redis
    res.json(newBox);
});

app.post('/customers', async (req,res) => {
    const newCustomer = req.body;
    let responseStatus = (newCustomer.firstName && newCustomer.lastName && newCustomer.phoneNumber) ? 200 : 400;
    if (responseStatus === 200) {
        if (!Number.isInteger(newCustomer.phoneNumber)) {
            res.status(500);
            res.send("Error: please enter a valid phone number");
        } else if ( await redisClient.exists(`customer:${newCustomer.phoneNumber}`) === 1 ) {
            res.status(409);
            res.send("Error: that phone number is already in use");
        } else {
            await redisClient.json.set(`customer:${newCustomer.phoneNumber}`, '$', newCustomer);
            res.json(newCustomer);
        }
    } else {
        res.status(responseStatus);
        res.send("Error: cannot create customer due to missing feilds");
    }
});

// TODO: this method doesn't work
app.get('/customer:$id', async (req,res) => {
    let customer = await redisClient.json.get(`customer:${id}`, {path:'$'}); //gets boxes; without 'await' it returns a Promise to the frontend (that's bad)
    res.json(customer); //convert boxes to a string and send to browser
}); //return boxes to user

console.log("Hello World");