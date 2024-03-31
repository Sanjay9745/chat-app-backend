require("dotenv").config();
const express = require("express");
const socketIO = require("socket.io");
const http = require("http"); // Require the 'http' module directly
const mongoose = require("mongoose");
const cors = require("cors");
const morgan = require("morgan");
const User = require("./models/User");
const jwt = require("jsonwebtoken");
const app = express();
const server = http.createServer(app); // Create an HTTP server instance
const PORT = process.env.PORT || 3001;

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to the database");
  })
  .catch((err) => {
    console.error("Error connecting to the database:", err);
  });

// Middleware
app.use(cors());
app.use(morgan("dev"));
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/user", require("./routes/userRoutes"));

// Configure CORS for Socket.IO
const io = socketIO(server, {
  cors: {
    origin: "*", // Change this to the origin of your frontend application
    methods: ["GET", "POST"],
    allowedHeaders: ["my-custom-header"],
    credentials: true,
  },
});

// Create namespace
const chat = io.of("/chat");
chat.use((socket, next) => {
  // Get the token from the query parameters
  const token = socket.handshake.auth.token;

  // Verify the token
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      // If the token is not valid, disconnect the client
      return next(new Error("Authentication error"));
    }

    // If the token is valid, store the decoded token in the socket object
    socket.user = decoded;

    // Call next() to allow the client to connect if the token is valid
    next();
  });
});
// Handle connections to the '/chat' namespace
chat.on("connection", async (socket) => {
  console.log("New user connected to chat namespace");
  socket.on("join", async (data) => {
    // Handle user connection logic
    console.log("join");
    // console.log(socket.user)
    try {
      const user = await User.updateOne(
        { _id: socket.user.id },
        { is_online: "1", socket_id: socket.id }
      );
      socket.broadcast.emit("setUserOnline", socket.user.id);
    } catch (error) {
      console.log(error);
    }
  });
  socket.on("leave", async (data) => {
    // Handle user disconnection logic
    socket.broadcast.emit("setUserOffline", data.userId);
    console.log("leave");
    try {
      const user = await User.updateOne(
        { _id: socket.user.id },
        { is_online: "0" }
      );
      socket.broadcast.emit("setUserOffline", socket.user.id);
    } catch (error) {
      console.log(error);
    }
  });
  // Handle incoming messages
  socket.on("message", async (data) => {
    // Log the message data

    // Get the receiver's socket ID from the database
    const user = await User.findOne({ _id: data.receiver_id }).select(
      "socket_id"
    );

    // Check if the user and the socket ID exist
    if (user && user.socket_id) {
      // Send the message to the specific client
      socket.to(user.socket_id).emit("message", data);
    } else {
      console.log(
        `User not found or socket ID not set for user: ${data.receiver_id}`
      );
    }
  });
  socket.on("deleteMessage", async (data) => {
    // Log the message data

    // Get the receiver's socket ID from the database
    const user = await User.findOne({ _id: data.receiver_id }).select(
      "socket_id"
    );
    socket.to(user.socket_id).emit("deleteMessage", data);
  });
  //Handle Dlete All Chat
  socket.on("deleteAllChat", async (data) => {
    // Log the message data

    // Get the receiver's socket ID from the database
    const user = await User.findOne({ _id: data }).select(
      "socket_id"
    );
    socket.to(user.socket_id).emit("deleteAllChat", data);
  });
  //handle typing
  socket.on("typing", async (data) => {

    // Log the message data
      socket.broadcast.emit("typing", data);
  })
  // Handle disconnections
  socket.on("disconnect", async () => {
    console.log("User disconnected from chat namespace");
  });
});

// app.get("/", (req, res) => {
//   res.sendFile(__dirname + "/public/home.html");
// })
// Start the server
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
