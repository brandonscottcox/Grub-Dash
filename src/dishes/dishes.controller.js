const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass

//MiddleWare

function requiredFields(req, res, next) {
  const data = req.body.data || {};
  const information = ["name", "description", "price", "image_url"];
  for (const info of information) {
    if (!data[info]) {
      return next({
        status: 400,
        message: `Dish must include a ${info}.`,
      });
    }
  }
  next();
}

function dishExist(req, res, next) {
  const { dishId } = req.params;
  const dish = dishes.find((dish) => dish.id === dish.id);
  if (!dish) {
    return next({
      status: 404,
      message: "Not Found",
    });
  }
  res.locals.dish = dish;
  next();
}

//create, read, update, and list dishes
const list = (req, res) => {
  res.json({ data: dishes });
};

const create = (req, res, next) => {
  const { data: { name, description, price, image_url } = {} } = req.body;

  if (price < 0) {
    return next({
      status: 400,
      message: "Dish must have a price that is an integer greater than 0.",
    });
  }

  const newDish = {
    id: nextId(),
    name: name,
    description: description,
    price: price,
    image_url: image_url,
  };

  dishes.push(newDish);

  res.status(201).json({ data: newDish });
};

const read = (req, res, next) => {
  res.json({ data: res.locals.dish });
};

const update = (req, res, next) => {
  const { data: { id, name, description, price, image_url } = {} } = req.body;
  const { dishId } = req.params;
  const dish = res.locals.dish;
  if (id && id !== dish.id) {
    return next({
      status: 400,
      message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`,
    });
  }
  if (price < 0 || !Number.isInteger(price)) {
    return next({
      status: 400,
      message: "Dish must have a price that is an integer greater than 0.",
    });
  }
  const updatedDish = {
    id:dish.id,
    name,
    description,
    price,
    image_url,
  };
  res.json({ data: updatedDish });
};

module.exports = {
  list,
  create: [requiredFields, create],
  read: [dishExist, read],
  update: [dishExist, requiredFields, update],
};
