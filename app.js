import { firebaseDB } from './config/Firebase.js'
import { auth_router, validateSession } from './controllers/auth_controller.js'
import { createRequire } from "module"
const require = createRequire(import.meta.url)

const express = require('express')
const bodyParser = require("body-parser")
const app = express()
app.use(bodyParser.json())
const port = 8080

// Define a route for GET requests to the root URL
app.get('/', validateSession, async (req, res) => {
  firebaseDB.collection
  const querySnapshot = await firebaseDB.collection("test").get()
      querySnapshot.forEach((doc) => {
      res.send(`${doc.id} => ${doc.data().field}`)
    }
  )
})

app.use("/auth", auth_router)

// Start the server
app.listen(port, () => {
  console.log(`City RPG listening at http://localhost:${port}`)
})