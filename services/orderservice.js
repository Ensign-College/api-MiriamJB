const addOrder = async ({ redisClient, order }) => {
  const customerKey = `customer:${order.customerId}`;
  const existingCustomer = await redisClient.json.get(customerKey, {path:'$'});

  if (existingCustomer !== null) {
    const orderKey = `order:${order.customerId}-${Date.now()}`;
    order.orderId = orderKey;
    await redisClient.json.set(orderKey, "$", order); // Create the order data in Redis
  } else {
    throw new Error(`Customer ${customerKey} does not exist`); // crashes service...
  }
};

const getOrder = async ({ redisClient, orderId }) => {
  const resultObject = await redisClient.json.get(`order:${orderId}`);
  return resultObject;
};

module.exports = { addOrder, getOrder };
