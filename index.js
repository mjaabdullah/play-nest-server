const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
app.use(cors());
app.use(express.json());

const port = process.env.PORT || 5000;

const uri = process.env.MONGO_URI;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const run = async () => {
  try {
    // await client.connect(); // comment for production

    const db = client.db("PlayNest");
    const facilities = db.collection("facilities");
    const users = db.collection("user");

    app.get("/feature-facilities", async (req, res) => {
      try {
        const result = await facilities.find().limit(7).toArray();
        res.send(result);
      } catch (error) {
        console.error("Error fetching facilities:", error);
        res.status(500).send({ error: "Failed to fetch facilities" });
      }
    });

    app.get("/all-facilities", async (req, res) => {
      const result = await facilities.find().toArray();
      res.send(result);
    });

    app.get("/manage-facilities/:userId", async (req, res) => {
      const userId = req.params.userId;

      const user = await users.findOne({
        _id: new ObjectId(userId),
      });

      if (!user) {
        return res.status(404).send({ message: "User not found" });
      }

      const result = await facilities
        .find({
          owner_email: user.email,
        })
        .toArray();

      res.send(result);
    });

    app.post("/add-facility", async (req, res) => {
      const facility = req.body;
      const result = await facilities.insertOne(facility);
      res.send(result);
    });

    app.delete("/facility/:id", async (req, res) => {
      const id = req.params.id;
      const query = {
        _id: new ObjectId(id),
      };
      const result = await facilities.deleteOne(query);
      res.send(result);
    });

    // await client.db("admin").command({ ping: 1 }); // comment for production
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!",
    );
  } finally {
    //   await client.close();
  }
};
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello play-nest-server!");
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
