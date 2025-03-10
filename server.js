  // server.js
  const express = require("express");
  const http = require("http");
  const { Server } = require("socket.io");

  const app = express();
  const server = http.createServer(app);
  const io = new Server(server);

  // Store chat history per room
  const roomMessages = {};

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

      // Initialize room history if it doesn't exist
      if (!roomMessages[room]) {
        roomMessages[room] = [];
      }
      
      // Send the previous chat history to the new user
      socket.emit("previousMessages", roomMessages[room]);

      // Send a welcome message to the new user (this one is not stored in history to avoid duplicates)
      socket.emit("chatMessage", {
        sender: "System",
        message: `Welcome to room ${room}, ${username}!`
      });

      // Notify other users in the room that a new user has joined,
      // and store that notification in the chat history
      const joinMessage = {
        sender: "System",
        message: `${username} has joined the chat.`
      };
      socket.to(room).emit("chatMessage", joinMessage);
      roomMessages[room].push(joinMessage);
    });

    // Broadcast chat messages to everyone in the room and store them in history
    socket.on("chatMessage", (data) => {
      io.to(data.room).emit("chatMessage", data);
      if (roomMessages[data.room]) {
        roomMessages[data.room].push(data);
      }
    });

    // Notify the room when a user disconnects and store that message
    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
      if (socket.room && socket.username) {
        const leaveMessage = {
          sender: "System",
          message: `${socket.username} has left the chat.`
        };
        socket.to(socket.room).emit("chatMessage", leaveMessage);
        if (roomMessages[socket.room]) {
          roomMessages[socket.room].push(leaveMessage);
        }
      }
    });
  });

  // Start the server
  server.listen(3000, () => {
    console.log("Server listening on http://localhost:3000");
  });
