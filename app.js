import { firebaseDB } from './config/Firebase.js'
import { auth_router, validateSession } from './controllers/auth_controller.js'
import { createRequire } from "module"
const require = createRequire(import.meta.url)

const express = require('express')
const bodyParser = require("body-parser")
const app = express()
app.use(bodyParser.json())
const port = 8080

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization, uid"
  );
  res.header("Access-Control-Expose-Headers", "uid, id_token, refresh_token")
  next();
});

// Define a route for GET requests to the root URL
app.get('/', validateSession, async (req, res) => {
  firebaseDB.collection
  const querySnapshot = await firebaseDB.collection("test").get()
      querySnapshot.forEach((doc) => {
      res.send({"text": `${doc.id} => ${doc.data().field}`})
    }
  )
})

app.use("/auth", auth_router)

// Start the server
app.listen(port, () => {
  console.log(`City RPG listening at http://localhost:${port}`)
})