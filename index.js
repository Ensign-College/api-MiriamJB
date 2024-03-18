/* This is the index file to run on AWS */

//redis database
const Redis = require('redis');

//customer stuff
const { checkValidCustomer } = require("./services/customerService.js");

//order stuff
const { addOrder, getOrder } = require ("./services/orderservice.js");
const { addOrderItem, getOrderItem } = require("./services/orderItems");
const fs = require("fs");
const Schema = JSON.parse(fs.readFileSync("./services/orderItemSchema.json", "utf8")); //read the orderItemSchema.json file
const Ajv = require("ajv");
const ajv = new Ajv(); //create an ajv object to validate JSON


const redisClient = Redis.createClient({
    url : `redis://localhost:6379`
});

/* BOXES */
exports.getBoxes = async (event) => {
    let boxes = await redisClient.json.get('boxes', {path:'$'});
    return {
        statusCode: 200,
        body: JSON.stringify(boxes[0])
    };
};

exports.postBoxes = async (event) => {
    const newBox = JSON.parse(event.body);
    newBox.id = parseInt(await redisClient.json.arrLen('boxes', '$')) + 1;
    await redisClient.json.arrAppend('boxes', '$', newBox);
    return {
        statusCode: 200,
        body: JSON.stringify(newBox)
    };
};


/* CUSTOMERS */
//post a customer
exports.postCustomer = async (event) => {
    let newCustomer = JSON.parse(event.body);
    let response = await checkValidCustomer({ redisClient, newCustomer });
    return {
        statusCode: response.status,
        body: JSON.stringify(response.body)
    };
};

//get a customer by id
exports.getCustomerById = async (event) => {
    let id = event.pathParameters.id;
    let customer = await redisClient.json.get(`customer${id}`, {path:'$'});
    if (customer) {
        return {
            statusCode: 200,
            body: JSON.stringify(customer)
        };
    } else {
        return {
            statusCode: 404,
            body: `Error: customer${id} does not exist`
        };
    }
};


/* ORDER */
//post order
exports.postOrder = async (event) => {
    let order = JSON.parse(event.body);

    let responseStatus = order.productQuantity && order.shippingAddress ? 200 : 400;

    if (responseStatus === 200) {
        try {
            await addOrder({ redisClient, order });
            return {
                statusCode: 200,
                body: JSON.stringify(order)
            };
        } catch (error) {
            console.error(error);
            return {
                statusCode: 500,
                body: "Internal Server Error"
            };
        }
    } else {
        return {
            statusCode: responseStatus,
            body: `Error: missing one of the following fields: customerId, productQuantity, shippingAddress`
        };
    }
};


//get order
exports.getOrderById = async (event) => {
    const orderId = event.pathParameters.orderId;
    let order = await getOrder({ redisClient, orderId });
    if (order === null) {
        return {
            statusCode: 404,
            body: "Order not found"
        };
    } else {
        return {
            statusCode: 200,
            body: JSON.stringify(order)
        };
    }
};


/* ORDER ITEM */
//post order items
exports.postOrderItems = async (event) => {
    try {
        const validate = ajv.compile(Schema);
        const valid = validate(JSON.parse(event.body));
        if (!valid) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "Invalid request body" })
            };
        }
        
        const orderItemId = await addOrderItem({ redisClient, orderItem: JSON.parse(event.body) });
        return {
            statusCode: 201,
            body: JSON.stringify({ orderItemId, message: "Order item added successfully" })
        };
    } catch (error) {
        console.error("Error adding order item: ", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Internal server error" })
        };
    }
};


// get an order item by ID
exports.getOrderItemById = async (event) => {
    try {
        const orderItemId = event.pathParameters.orderItemId;
        const orderItem = await getOrderItem({ redisClient, orderItemId });
        return {
            statusCode: 200,
            body: JSON.stringify(orderItem)
        };
    } catch (error) {
        console.error("Error getting order item: ", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Internal server error" })
        };
    }
};
