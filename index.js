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
const verifyToken = (req, res, next) => {
  const authHeader = req?.headers?.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "unauthorized" });
  }
  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "unauthorized" });
  }

  next();
};
const run = async () => {
  try {
    // await client.connect(); // comment for production

    const db = client.db("PlayNest");
    const facilities = db.collection("facilities");
    const users = db.collection("user");
    const bookings = db.collection("bookings");

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

    app.get("/manage-facilities/:userId", verifyToken, async (req, res) => {
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

    app.get("/facility/:id", async (req, res) => {
      try {
        const id = req.params.id;

        const result = await facilities.findOne({
          _id: new ObjectId(id),
        });

        if (!result) {
          return res.status(404).send({
            message: "Facility not found",
          });
        }

        res.send(result);
      } catch (error) {
        res.status(500).send({
          message: "Invalid facility id",
        });
      }
    });

    app.patch("/facility/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const updatedFacility = req.body;

        const result = await facilities.updateOne(
          {
            _id: new ObjectId(id),
          },
          {
            $set: updatedFacility,
          },
        );

        res.send(result);
      } catch (error) {
        res.status(500).send({
          message: "Failed to update facility",
        });
      }
    });
    app.get("/booking/:id", async (req, res) => {
      const userId = req.params.id;
      const result = await bookings
        .find({
          user_id: userId,
        })
        .toArray();
      if (result.length === 0) {
        return res.status(400).send({
          success: false,
          message: "You have no booking!",
        });
      }
      res.send(result);
    });

    app.delete("/booking", async (req, res) => {
      const id = req.query.id;
      const user = req.query.user;
      console.log(req.query);
      const query = {
        _id: new ObjectId(id),
        user_id: user,
      };
      const result = await bookings.deleteOne(query);
      res.send(result);
    });

    app.post("/booking", async (req, res) => {
      const newBooking = req.body;

      const existingBooking = await bookings.findOne({
        facility_id: newBooking.facility_id,
        user_id: newBooking.user_id,
        booking_date: newBooking.booking_date,
      });

      if (existingBooking) {
        return res.status(400).send({
          success: false,
          message: "You have already booked this facility on this date!",
        });
      }

      const result = await bookings.insertOne(newBooking);
      res.send({
        success: true,
        message: "Booking successful!",
        data: result,
      });
    });
    app.post("/add-facility", verifyToken, async (req, res) => {
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
