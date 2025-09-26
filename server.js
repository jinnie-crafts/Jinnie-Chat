const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

app.use(express.static("public")); // serve index.html, css, js, etc.

// In-memory rooms: { roomName: { password, users: [] } }
const rooms = {};

// Handle socket connections
io.on("connection", socket => {

  // Send current room list to new clients
  socket.emit("room list", Object.keys(rooms));

  // Create room
  socket.on("create room", (roomName, password, username) => {
    if(!rooms[roomName]) rooms[roomName] = { password, users: [] };
    socket.join(roomName);
    rooms[roomName].users.push(username);

    // Notify creator
    socket.emit("room joined", roomName);

    // Notify other users in room
    socket.to(roomName).emit("chat message", `${username} has joined the chat`);

    // Update all clients with room list
    io.emit("room list", Object.keys(rooms));
  });

  // Join existing room
  socket.on("join room request", (roomName, password, username) => {
    if(!rooms[roomName]) return socket.emit("error","Room does not exist");
    if(rooms[roomName].password !== password) return socket.emit("wrong password");

    socket.join(roomName);
    rooms[roomName].users.push(username);

    // Notify joining user
    socket.emit("room joined", roomName);

    // Notify other users in room
    socket.to(roomName).emit("chat message", `${username} has joined the chat`);
  });

  // Chat messages
  socket.on("chat message", msg => {
    const roomsJoined = Array.from(socket.rooms).filter(r => r !== socket.id);
    roomsJoined.forEach(r => socket.to(r).emit("chat message", { user: "Unknown", text: msg }));
  });

  // File upload
  socket.on("file upload", data => {
    const roomsJoined = Array.from(socket.rooms).filter(r => r !== socket.id);
    roomsJoined.forEach(r => socket.to(r).emit("file message", { user: "Unknown", ...data }));
  });

  // Typing indicator
  socket.on("typing", user => {
    const roomsJoined = Array.from(socket.rooms).filter(r => r !== socket.id);
    roomsJoined.forEach(r => socket.to(r).emit("typing", user));
  });
  socket.on("stop typing", user => {
    const roomsJoined = Array.from(socket.rooms).filter(r => r !== socket.id);
    roomsJoined.forEach(r => socket.to(r).emit("stop typing", user));
  });

  // Handle disconnect
  socket.on("disconnect", ()=>{
    for(const r in rooms){
      rooms[r].users = rooms[r].users.filter(u=>u!==socket.id);
    }
  });

});

const PORT = process.env.PORT || 3000;
http.listen(PORT, ()=> console.log(`Server running on port ${PORT}`));
