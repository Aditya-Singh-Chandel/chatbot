// server.js
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files from the "public" folder
app.use(express.static("public"));

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // Listen for joining a room with username and room
  socket.on("joinRoom", ({ username, room }) => {
    socket.join(room);
    socket.username = username;
    socket.room = room;
    console.log(`User ${username} (${socket.id}) joined room: ${room}`);

    // Welcome message to the new user
    socket.emit("chatMessage", {
      sender: "System",
      message: `Welcome to room ${room}, ${username}!`
    });

    // Notify other users in the room
    socket.to(room).emit("chatMessage", {
      sender: "System",
      message: `${username} has joined the chat.`
    });
  });

  // Broadcast chat messages to everyone in the room
  socket.on("chatMessage", (data) => {
    io.to(data.room).emit("chatMessage", data);
  });

  // Notify room when a user disconnects
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    if (socket.room && socket.username) {
      socket.to(socket.room).emit("chatMessage", {
        sender: "System",
        message: `${socket.username} has left the chat.`
      });
    }
  });
});

// Start the server
server.listen(3000, () => {
  console.log("Server listening on http://localhost:3000");
});
