const {Socket} = require("./Controller/Socket");

require("dotenv").config();

const cors = require("cors");
const mongoose = require("mongoose");
const express = require("express");

const port = 8001 || 8002 || process.env.PORT;

const app = express();
const server = require("http").createServer(app);
const io = require("socket.io")({
  cors: [
    "http://localhost:3000/",
    "http://localhost:3001/",
    process.env.FRONTEND_URL,
  ],
}).listen(server);

exports.io = io;

const UserController = require("./Controller/UserController");

app.use(
  cors([
    "http://localhost:3000/",
    "http://localhost:3001/",
    process.env.FRONTEND_URL,
  ])
);

app.use(express.json());

app.post("/Login", UserController.login);
app.post(
  "/LoginVerifyAndCheckIfUserAlreadyLogged",
  UserController.loginVerifyAndCheckIfUserAlreadyLogged
);
app.post("/Logout", UserController.logout);
app.post("/ChangePassword", UserController.changePassword);

app.post("/GetAllUsers", UserController.getAllUsers);
app.post("/GetAllUserMessages", UserController.getAllUserMessages);
app.post("/GetAllRooms", UserController.getAllRooms);
app.post("/GetOneUser", UserController.getOneUser);
app.post("/GetAllFriendsList", UserController.getAllFriendsList);

app.post("/UpdateUnreadMessage", UserController.updateUnreadMessage);

mongoose
  .connect(
    `mongodb+srv://${process.env.MONGOOSE_USERNAME}:${process.env.MONGOOSE_PASSWORD}@cluster0.cuw4ebp.mongodb.net/?retryWrites=true&w=majority`,
    {}
  )
  .then(() => {
    server.listen(port);
    console.log("Listen To Port: " + port);
    console.log("connected");
  })
  .catch((err) => {
    console.log(err);
  });

Socket(io);
