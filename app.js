import { firebaseDB } from './config/Firebase.js';
import { getDocs, collection } from 'firebase/firestore';
import { auth_router } from './controllers/auth_controller.js';
import { createRequire } from "module";
const require = createRequire(import.meta.url);

const express = require('express');
const bodyParser = require("body-parser");
const app = express();
app.use(bodyParser.json());
const port = 8080;

// Define a route for GET requests to the root URL
app.get('/', async (req, res) => {
  console.log("local")
  const querySnapshot = await getDocs(collection(firebaseDB, "test"));
      querySnapshot.forEach((doc) => {
      res.send(`${doc.id} => ${doc.data().field}`);
    }
  );

  // res.send('Hello World from Express!');
});

app.use("/auth", auth_router);

// Start the server
app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});