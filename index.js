// run this script: npm run start-dev
const express = require("express");
const { MongoClient, ServerApiVersion } = require("mongodb");
const cors = require("cors");
require("dotenv").config();
const bson = require("bson");

const app = express();
const port = process.env.PORT || 5000;

//midleware
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).send("Holla. The TBPL client server is ON");
});

app.listen(port, () => {
  console.log("Server is running on port", port);
});

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@tbpl-web.0khaa.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    await client.connect();
    const database = client.db(`${process.env.DB_NAME}`);

    // ALL useCollection API
    const userCollection = database.collection(
      `${process.env.DB_COLLECTION_USERS}`
    );

    app.post("/user/add", async (req, res) => {
      const user = req.body;
      const { email } = user;
      const userInfoFromDB = await userCollection.findOne({ email: email });
      console.log(userInfoFromDB);
      if (!userInfoFromDB) {
        const result = await userCollection.insertOne(user);
        console.log(
          `A document was inserted with the _id: ${result.insertedId}`
        );
        console.log(result);
        const userInfoFromDB = await userCollection.findOne({ email: email });
        res.json(userInfoFromDB);
      } else {
        userInfoFromDB.error =
          "An account is already existing with this email!";
        res.json(userInfoFromDB);
      }
    });

    app.post("/user/update", async (req, res) => {
      const user = req.body;
      delete user._id;
      const { email } = user;
      const result = await userCollection.updateOne(
        { email: email },
        { $set: user },
        { upsert: true }
      );
      console.log(result);
      const userInfoFromDB = await userCollection.findOne({ email: email });
      if (result.upsertedCount == 1) {
        console.log(
          `A document was inserted with the _id: ${result.upsertedId}`
        );
        res.json(userInfoFromDB);
      } else {
        res.json(userInfoFromDB);
      }
    });

    app.post("/user/login", async (req, res) => {
      const loginInfo = req.body;
      const { formEmail, formPassword } = loginInfo;
      const userInfoFromDB = await userCollection.findOne({ email: formEmail });
      console.log(loginInfo, userInfoFromDB);
      if (userInfoFromDB) {
        if (!userInfoFromDB.password) {
          res.json({
            error:
              "No password found for this email. Please Sign in with Google!",
          });
        } else {
          if (userInfoFromDB.password === formPassword) {
            res.json(userInfoFromDB);
          } else {
            res.json({
              error:
                "Password Incorrect! to reset password please call 0405601033",
            });
          }
        }
      } else {
        res.json({
          error:
            "No account found for this email! please create a new account!",
        });
      }
    });

    app.get("/users/all", (req, res) => {
      userCollection.find().toArray((err, items) => {
        res.send(items);
        err && console.log(err);
      });
    });

    // ALL eventsCollection API

    const eventsCollection = database.collection(
      `${process.env.DB_COLLECTION_EVENTS}`
    );

    app.post("/event/add", async (req, res) => {
      const event = req.body;
      const result = await eventsCollection.insertOne(event);
      console.log(`A document was inserted with the _id: ${result.insertedId}`);
      res.json({
        msg: `A event was inserted with the _id: ${result.insertedId}`,
      });
    });

    app.get("/events/all", (req, res) => {
      eventsCollection.find().toArray((err, items) => {
        res.send(items);
        err && console.log(err);
      });
    });

    app.get("/event/:id", (req, res) => {
      const id = bson.ObjectId(req.params.id);
      console.log(id);
      eventsCollection.find({ _id: id }).toArray((err, documents) => {
        console.log(documents);
        res.send(documents);
        err && console.log(err);
      });
    });

    app.post("/event/update/:id", async (req, res) => {
      const id = bson.ObjectId(req.params.id);
      const event = req.body;
      delete event._id;
      const result = await eventsCollection.updateOne(
        { _id: id },
        { $set: event },
        { upsert: false }
      );
      {
        result.modifiedCount && console.log(`Event updated _id: ${id}`);
      }
      res.json(event);
    });

    app.post("/event/delete/:id", async (req, res) => {
      const id = bson.ObjectId(req.params.id);
      const result = eventsCollection.deleteOne({ _id: id });
      if (result.deletedCount === 1) {
        console.log("Successfully deleted one document.");
      } else {
        console.log("No documents matched the query. Deleted 0 documents.");
      }
    });

    //EID 2022

    const eidCollection = database.collection(
      `${process.env.DB_COLLECTION_EID2022}`
    );

    app.post("/eid/2022/participant/add", async (req, res) => {
      const participant = req.body;
      delete participant._id;
      const result = await eidCollection.insertOne(participant);
      console.log(`A document was inserted with the _id: ${result.insertedId}`);
      res.json({
        msg: `A eid festival 2022 participant added with the _id: ${result.insertedId}`,
      });
    });

    app.post("/eid/2022/participant/edit/:id", async (req, res) => {
      const id = bson.ObjectId(req.params.id);
      const participant = req.body;
      delete participant._id;
      const result = await eidCollection.updateOne(
        { _id: id },
        { $set: participant },
        { upsert: false }
      );
      {
        result.modifiedCount && console.log(`Event updated _id: ${id}`);
      }
      res.json(participant);
    });

    app.get("/eid/2022/participants/all", (req, res) => {
      eidCollection.find().toArray((err, items) => {
        res.send(items);
        err && console.log(err);
      });
    });

    app.post("/eid/2022/participant/del/:id", async (req, res) => {
      const id = bson.ObjectId(req.params.id);
      const result = eidCollection.deleteOne({ _id: id });
      if (result.deletedCount === 1) {
        console.log("Successfully deleted one document.");
      } else {
        console.log("No documents matched the query. Deleted 0 documents.");
      }
    });

    //All TBPL participants

    const participantCollection = database.collection(
      `${process.env.DB_COLLECTION_PARTICIPANTS}`
    );

    app.get("/2022/participants/all", (req, res) => {
      participantCollection.find().toArray((err, items) => {
        res.send(items);
        err && console.log(err);
      });
    });

    app.post("/participant/add/2022", async (req, res) => {
      const participant = req.body;
      delete participant._id;
      const result = await participantCollection.insertOne(participant);
      console.log(`A document was inserted with the _id: ${result.insertedId}`);
      res.json({
        msg: `A tbpl participant is added with the _id: ${result.insertedId}`,
      });
    });

    app.post("/participant/2022/del/:email", async (req, res) => {
      const email = req.params.email;
      const result = participantCollection.deleteOne({ email: email });
      if (result.deletedCount === 1) {
        console.log("Successfully deleted one document.");
      } else {
        console.log("No documents matched the query. Deleted 0 documents.");
      }
      res.json({
        msg: `A TBPL participant Signed out!!`,
      });
    });
  } finally {
    //await client.close();
  }
}
run().catch(console.dir);
