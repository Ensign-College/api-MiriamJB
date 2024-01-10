//express is a framework for node.js
//it makes APIs - connects frontend to database backend
const express = require('express');

const app = express(); //creates an express application
app.listen(3000); //listens for web requests from frontend on port 3000 (and doesn't stop)

//boxes database
const boxes = [
    {boxId: 1},
    {boxId: 2},
    {boxId: 3},
    {boxId: 4}
];

/*Using the API:
    1. URL
    2. function to return boxes
    req = resquest from the browser
    res = response to the bowser 
*/
app.get('/boxes', (req,res) => {
    //send boxes to browser
    res.send(JSON.stringify(boxes)); //convert boxes to a string
}); //return boxes to user

console.log("Hello World");