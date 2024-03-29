const User = require("../Models/User");
const jsonwebtoken = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const Message = require("../Models/Message");
const Room = require("../Models/Room");

exports.login = (req, res) => {
  User.findOne({ username: req.body.username })
    .then((user) => {
      if (!user) {
        res.status(400).json({ message: "User not found" });
      } else {
        bcrypt
          .compare(req.body.password, user.password)
          .then((password) => {
            if (!password) {
              res.status(400).json({ message: "Password incorrect" });
            } else {
              if (user.loggedIn) {
                res.status(200).json({
                  message: "User Already Logged!!!",
                  userAlreadyLogged: true,
                });
                return;
              }

              user.loggedIn = true;
              user
                .save()
                .then((user) => {})
                .catch((err) => {
                  res.status(500).json({ message: "Error", err: err });
                });

              const token = jsonwebtoken.sign(
                { id: user._id },
                process.env.JWT_TOKEN
              );
              console.log({ message: "User Login | Controller" });

              res.status(200).json({
                message: "Login",
                userID: user._id,
                token: token,
                userAlreadyLogged: false,
              });
            }
          })
          .catch((err) => {
            res.status(500).json({ message: "Error", err: err });
          });
      }
    })
    .catch((err) => {
      res.status(500).json({ message: "Error", err: err });
    });
};

exports.loginVerifyAndCheckIfUserAlreadyLogged = (req, res) => {
  User.findOne({ _id: req.body.id })
    .then((user) => {
      if (!user) {
        res.status(400).json({ message: "User Not Exist" });
      } else {
        const isLegalToken = jsonwebtoken.verify(
          req.body.token,
          process.env.JWT_TOKEN
        );
        if (isLegalToken) {
          res.status(200).json({
            message: "Token Legal",
            isLegalToken: true,
            isAlreadyLogged: user.loggedIn,
          });
        } else {
          res
            .status(400)
            .json({ message: "Token Not Legal", isLegalToken: false });
        }
      }
    })
    .catch((err) => {
      res.status(500).json({ message: "Error", err, isLegalToken: false });
    });
};

exports.logout = (req, res) => {
  User.findOneAndUpdate({ _id: req.body.id }, { loggedIn: false })
    .then((user) => {
      if (!user) res.status(400).json({ message: "User Not Found!!!" });
      else {
        res.status(200).json({ message: "User Logout" });
      }
    })
    .catch((err) => {
      res.status(500).json({ message: "Error", err });
    });
};

exports.getOneUser = (req, res) => {
  User.findOne({ _id: req.body.id })
    .then((user) => {
      if (!user) res.status(400).json({ message: "User Not Exist!!!" });
      else res.status(200).json({ message: "User Found", user });
    })
    .catch((err) => {
      res.status(500).json({ message: "Error", err });
    });
};

exports.getAllUsers = (req, res) => {
  User.find({})
    .then((users) => {
      if (!users) {
        res.status(400).json({ message: "Users Not Found" });
      } else {
        // const populateUsersList = [];
        // users.map((user, index) => {
        //   user
        //     .populate(["FriendRequestsSentFromUserInPending", "FriendRequestsSentToUserInPending"])
        //     .then((populateUser) => {
        //       populateUsersList.push(populateUser);

        //       if (index == users.length - 1) {
        //         console.log(populateUsersList, 5435);

        //         res
        //           .status(200)
        //           .json({message: "Users Found", users: populateUsersList});
        //       }
        //     })
        //     .catch((err) => {
        //       res.status(500).json({message: "Error", err});
        //     });
        // });

        res.status(200).json({ message: "Users Found", users: users });
      }
    })
    .catch((err) => {
      res.status(500).json({ message: "Error", err });
    });
};

exports.getAllRooms = (req, res) => {
  User.findOne({ _id: req.body.id }).then((user) => {
    if (!user) {
      res.status(400).json({ message: "User Not Found" });
    } else {
      user.populate("previousRooms").then((rooms) => {
        if (!rooms) {
          res.status(400).json({ message: "Rooms List Empty" });
        } else {
          const newRoomsArray = rooms.previousRooms.map((room) => {
            const unreadMessagesItem = user.unreadMessages.find((item) => {
              // console.log(item);
              return item.roomID.toString() == room._id.toString();
            });

            return {
              ...room.toObject(),
              numberOfUnreadMessages: unreadMessagesItem.numberOfUnreadMessages,
            };
          });

          res.status(200).json({ message: "Room List", rooms: newRoomsArray });
        }
      });
    }
  });
};

exports.getAllRoomUsers = (req, res) => {
  Room.findOne({ _id: req.body.id }).then((room) => {
    if (!room) {
      res.status(400).json({ message: "Room Not Found" });
    } else {
      room.populate("participants").then((users) => {
        if (!users) {
          res.status(400).json({ message: "users List Empty" });
        } else {
          res
            .status(200)
            .json({ message: "Room List", users: users.participants });
        }
      });
    }
  });
};

exports.getAllUserMessages = (req, res) => {
  User.findOne({ _id: req.body.id })
    .then((user) => {
      if (!user) {
        res.status(400).json({ message: "User Not Found" });
      } else {
        user
          .populate("previousMessages")
          .then((messages) => {
            if (!messages) {
              res.status(400).json({ message: "Message list Empty" });
            } else {
              res.status(200).json({
                message: "Message list",
                data: messages.previousMessages,
              });
            }
          })
          .catch((err) => {
            res.status(500).json({ message: err });
          });
      }
    })
    .catch((err) => {
      res.status(500).json({ message: "Error", err });
    });
};

exports.updateUnreadMessage = (req, res) => {
  User.findById(req.body.id)
    .then((user) => {
      if (!user) res.status(400).json({ message: "User Not Found" });
      else {
        const unreadMessagesIndex = user.unreadMessages.findIndex(
          (item) => item.roomID == req.body.roomID
        );

        // console.log(unreadMessagesIndex);

        if (unreadMessagesIndex >= 0) {
          user.unreadMessages[unreadMessagesIndex] = {
            roomID: user.unreadMessages[unreadMessagesIndex].roomID,
            numberOfUnreadMessages: req.body.newUnreadMessagesNumber,
          };
          // console.log("user");

          user
            .save()
            .then()
            .catch((err) => {
              res.status(500).json({ message: "Error", err });
            });
        }

        res.status(200).json({ message: "Successful - UnreadMessage Update" });
      }
    })
    .catch((err) => {
      res.status(500).json({ message: "Error", err });
    });
};

exports.getAllFriendsList = (req, res) => {
  User.findById(req.body.user_id)
    .then((user) => {
      if (!user) res.status(400).json({ message: "User Not Found" });
      else {
        user.populate("friendsList").then((populateUser) => {
          res.status(200).json({
            message: "Successful - Friends List",
            friendsList: populateUser.friendsList,
          });
        });
      }
    })
    .catch((err) => {
      res.status(500).json({ message: "Error", err });
    });
};

exports.changePassword = async (req, res) => {
  try {
    if (req.body.password.length < 1) return;
    const hashPassword = await bcrypt.hash(req.body.password, 10);
    User.findById(req.body.userID).then((user) => {
      if (!user) res.status(400).json({ message: "User Not Found" });
      else {
        user.update({ password: hashPassword }).then(() => {
          res.status(200).json({
            message: "Successful - Password Changed",
          });
        });
      }
    });
  } catch (err) {
    res.status(500).json({ message: "Error", err });
  }
};
