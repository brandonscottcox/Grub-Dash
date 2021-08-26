const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass

//Middleware

function requiredFields(req, res, next) {
  const data = req.body.data || {};
  const information = ["deliverTo", "mobileNumber", "dishes"];
  for (const info of information) {
    if (!data[info]) {
      return next({
        status: 400,
        message: `Order must include a ${info}.`,
      });
    }
  }
  const dishes = data.dishes;
  if (!Array.isArray(dishes) || dishes.length === 0) {
    return next({
      status: 400,
      message: "Dish must include at least one dish.",
    });
  }
  dishes.forEach((dish, index) => {
    if (
      !Number.isInteger(dish.quantity) ||
      dish.quantity < 0 ||
      !dish.quantity
    ) {
      return next({
        status: 400,
        message: `Dish ${index} must have a quantity that is an integer greater than zero.`,
      });
    }
  });
  res.locals.data = data;
  next();
}

function orderExist(req, res, next) {
  const { orderId } = req.params;
  const order = orders.find((order) => order.id === orderId);
  if (!order) {
    return next({
      status: 404,
      message: `Order does not exist ${orderId}.`,
    });
  }
  res.locals.order = order;
  next();
}

function idValidate(req, res, next) {
  const { data: { id, status } = {} } = req.body;
  const { orderId } = req.params;

  if (id && id !== orderId) {
    return next({
      status: 400,
      message: `Order id does not match route id. Order: ${id}, Route: ${orderId}`,
    });
  }
  if (
    !status ||
    !["pending", "preparing", "out-for-delivery", "delivered"].includes(status)
  ) {
    return next({
      status: 400,
      message:
        "Order must have a status of pending, preparing, out-for-delivery, delivered.",
    });
  }
  next();
}

function statusIsValid(req, res, next) {
  const order = res.locals.order;
  if (order.status !== "pending") {
    return next({
      status: 400,
      message: `Can not delete with ${order.status}; Status must be pending`,
    });
  }
  next();
}

//create, read, update, and list orders
const list = (req, res) => {
  res.json({ data: orders });
};

const create = (req, res, next) => {
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
  const orderDish = req.params;

  const newOrder = {
    id: nextId(),
    deliverTo: deliverTo,
    mobileNumber: mobileNumber,
    status: status,
    dishes: dishes,
  };

  orders.push(newOrder);

  res.status(201).json({ data: newOrder });
};

const read = (req, res, next) => {
  res.json({ data: res.locals.order });
};

const update = (req, res, next) => {
  if (res.locals.data.hasOwnProperty("id")) {
    delete res.locals.data.id;
  }
  const updatedOrder = Object.assign(res.locals.order, res.locals.data);
  res.json({ data: updatedOrder });
};

const destroy = (req, res, next) => {
  orders.splice(orders.indexOf(res.locals.order), 1);
  res.sendStatus(204);
};

module.exports = {
  list,
  create: [requiredFields, create],
  read: [orderExist, read],
  update: [orderExist, requiredFields, idValidate, update],
  delete: [orderExist, statusIsValid, destroy],
};
