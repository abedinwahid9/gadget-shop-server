const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion } = require("mongodb");
const { emit } = require("nodemon");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 4000;

app.use(
  cors({
    origin: "http://localhost:5173",
    optionsSuccessStatus: 200,
  })
);
app.use(express.json());

// middleware
// verify JWT token
const verifyToken = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    res.send({ message: "no token" });
  }

  const token = authorization.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_KEY_TOKEN, (err, decoded) => {
    if (err) {
      return res.send({ message: "invalid token" });
    }
    req.decoded = decoded;
    next();
  });
};

// verify seller
const verifySeller = async (req, res, next) => {
  const email = req.decoded.email;
  const query = { email: email };
  const user = await userCollection.find(query);

  if (user.role !== "seller") {
    return res.send({ message: "forbidden access" });
  }
  next();
};

// mongodb
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.os721gq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// database & collection

const dbName = client.db("gadgetDB");

const userCollection = dbName.collection("users");
const productCollection = dbName.collection("products");

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );

    // get user
    app.get("/user/:email", async (req, res) => {
      const query = { email: req.params.email };
      const user = await userCollection.findOne(query);

      res.send(user);
    });

    // insert user
    app.post("/users", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const existingUser = await userCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: "this user already exists" });
      }

      const result = await userCollection.insertOne(user);

      res.send(result);
    });

    // add products
    app.post("/add-products", verifyToken, verifyToken, async (req, res) => {
      const product = req.body;
      const result = await productCollection.insertOne(product);

      res.send(result);
    });

    //
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

// api

app.get("/", (req, res) => {
  res.send("server is running");
});

// jwt
app.post("/authentication", async (req, res) => {
  const userEmail = req.body;
  const token = jwt.sign(userEmail, process.env.ACCESS_KEY_TOKEN, {
    expiresIn: "10d",
  });

  res.send({ token });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// create a api for the server
