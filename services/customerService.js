const checkValidCustomer = async ({ redisClient, newCustomer }) => {
    if (newCustomer.firstName && newCustomer.lastName && newCustomer.phoneNumber) { //check for all the needed fields
        if (!Number.isInteger(newCustomer.phoneNumber)) { //check phone number is an int
            return { 
                status:500, 
                body:"Error: please enter a valid phone number"
            };
        } else if ( await redisClient.exists(`customer:${newCustomer.phoneNumber}`) === 1 ) { //check if phone number is being used
            return { 
                status:409, 
                body:`Error: phone number ${newCustomer.phoneNumber} is already in use`
            };
        } else {
            await redisClient.json.set(`customer:${newCustomer.phoneNumber}`, '$', newCustomer); //add customer to database
            return {
                status:200,
                body:newCustomer
            }
        }
    } else {
        return {
            status:500,
            body:"Error: missing one of the following fields: firstName, lastName, phoneNumber"
        }
    }
}

module.exports = {checkValidCustomer};




//ORIGINAL CODE: (from index.js)
    // if (newCustomer.firstName && newCustomer.lastName && newCustomer.phoneNumber) {
    //     if (!Number.isInteger(newCustomer.phoneNumber)) {
    //         res.status(500).send("Error: please enter a valid phone number");
    //     } else if ( await redisClient.exists(`customer:${newCustomer.phoneNumber}`) === 1 ) {
    //         res.status(409).send(`Error: phone number ${newCustomer.phoneNumber} is already in use`);
    //     } else {
    //         await redisClient.json.set(`customer:${newCustomer.phoneNumber}`, '$', newCustomer);
    //         res.status(200).json(newCustomer);
    //     }
    // } else {
    //     res.status(500).send("Error: missing one of the following fields: firstName, lastName, phoneNumber");
    // }