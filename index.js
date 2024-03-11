/* COMMANDS:
    npm run dev = run this program with automatic restarts on updates
    node index.js = run this program
    docker-compose up -d = runs docker in the background (deamon) & rebuilds containers (specified in docker-compose.yml)
    http://localhost:3001/boxes - address it is running on
*/

//require = import (import needs more steps to work)
const express = require('express'); //express is a framework for node.js. It makes APIs - connects frontend to database backend
const Redis = require('redis');
const bodyParser = require('body-parser');
const cors = require('cors');

//customer stuff
const { checkValidCustomer } = require("./services/customerService.js");

//order stuff
const { addOrder, getOrder } = require ("./services/orderservice.js");
const { addOrderItem, getOrderItem } = require("./services/orderItems");
const fs = require("fs");
const Schema = JSON.parse(fs.readFileSync("./services/orderItemSchema.json", "utf8")); //read the orderItemSchema.json file
const Ajv = require("ajv");
const ajv = new Ajv(); //create an ajv object to validate JSON

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


/* BOXES */
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


/* CUSTOMERS */
//post a customer
app.post('/customers', async (req,res) => {
    let newCustomer = req.body;
    response = await checkValidCustomer({redisClient, newCustomer});
    res.status(response.status).send(response.body);
});

//get a customer by id
app.get('/customer:id', async (req,res) => {
    let id = req.params.id; //includes the ":" with the id
    let customer = await redisClient.json.get(`customer${id}`, {path:'$'});
    if (customer) {
        res.json(customer);
    } else {
        res.send(`Error: customer${id} does not exist`);
    }
});


/* ORDER */
//post order
app.post("/order", async (req, res) => {
    let order = req.body;

    //order details, include product quantiy and shipping address
    let responseStatus = order.productQuantity ? 200 : 400
        && order.shippingAddress ? 200 : 400;
    
        if (responseStatus === 200) {
            try {
                await addOrder({ redisClient, order}); //addOrder function to handle order creation in the database
                res.send(order);
            } catch (error) {
                console.error(error);
                res.status(500).send("Internal Server Error");
                return;
            }
        } else {
            res.status(responseStatus);
            res.send(`Error: missing one of the following fields: customerId, productQuantity, shippingAddress`);
        }
        res.status(responseStatus).send();
});

//get order
app.get("/order/:orderId", async(req, res) => {
    //get the order from the database
    const orderId = req.params.orderId;
    let order = await getOrder({ redisClient, orderId });
    if (order === null) {
        res.status(404).send("Order not found");
    } else {
        res.json(order);
    }
});


/* ORDER ITEM */
//post order items
app.post("/orderItems", async (req, res) => {
    try {
        const validate = ajv.compile(Schema);
        const valid = validate(req.body);
        if (!valid) {
            return res.status(400).json({ error: "Invalid request body" });
        }
        
        //calling addOrderItem function and string the result
        const orderItemId = await addOrderItem({ redisClient, orderItem: req.body });

        //responding with the result
        res.status(201).json({ orderItemId, message: "Order item added successfully"});

    } catch (error) {
        console.error("Error adding order item: ", error);
        res.status(500).json({error: "Internal server error"});
    }
});

// get an order item by ID
app.get("/orderItems/:orderItemId", async (req, res) => {
    try{
        const orderItemId = req.params.orderItemId;
        const orderItem = await getOrderItem({ redisClient, orderItemId });
        res.json(orderItem);
    } catch (error) {
        console.error("Error getting order item: ", error);
        res.status(500).json({ error: "Internal server error"});
    }
})
