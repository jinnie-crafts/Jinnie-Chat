const socket = io({ reconnection:true, reconnectionAttempts: Infinity, reconnectionDelay:1000 });

let username = null, room = null;

// Elements
const usernameModal = document.getElementById("username-modal");
const usernameInput = document.getElementById("username-input");
const usernameBtn = document.getElementById("username-btn");

const roomModal = document.getElementById("room-modal");
const roomList = document.getElementById("room-list");
const newRoomInput = document.getElementById("new-room-input");
const newRoomPassword = document.getElementById("new-room-password");
const newRoomBtn = document.getElementById("new-room-btn");

const joinPasswordContainer = document.getElementById("join-password-container");
const joinRoomPassword = document.getElementById("join-room-password");
const joinRoomBtn = document.getElementById("join-room-btn");
const passwordAlert = document.getElementById("password-alert");

const chatContainer = document.querySelector(".chat-container");
const chatBody = document.getElementById("chat-body");
const chatTitle = document.getElementById("chat-title");
const chatSubtitle = document.getElementById("chat-subtitle");
const input = document.getElementById("message-input");
const sendBtn = document.getElementById("send-btn");
const fileBtn = document.getElementById("file-btn");
const fileInput = document.getElementById("file-input");

const inviteBtn = document.getElementById("invite-btn");
const inviteModal = document.getElementById("inviteModal");
const closeInvite = document.getElementById("close-invite");
const inviteUrlInput = document.getElementById("invite-url");
const copyBtn = document.getElementById("copy-btn");

const toast = document.getElementById("toast");
let typingTimeout;

// ===== Password Toggle =====
function togglePassword(fieldId){
  const input = document.getElementById(fieldId);
  input.type = input.type==="password"?"text":"password";
}

// ===== Handle URL for room =====
window.addEventListener("load", ()=>{
  const params = new URLSearchParams(window.location.search);
  const roomFromUrl = params.get("room");

  if(roomFromUrl){
    // Show join modal for this room
    joinPasswordContainer.classList.remove("hidden");
    newRoomInput.value = roomFromUrl;

    usernameModal.classList.remove("hidden");
    usernameBtn.onclick = ()=>{
      username = usernameInput.value.trim();
      if(!username) return;
      usernameModal.classList.add("hidden");

      joinRoomBtn.onclick = ()=>{
        const pwd = joinRoomPassword.value.trim();
        if(!pwd) return;
        socket.emit("join room request", roomFromUrl, pwd, username);
      };
    };
  } else {
    // Normal flow
    usernameModal.classList.remove("hidden");
  }
});

// ===== Username Modal =====
usernameBtn.addEventListener("click", ()=>{
  if(username) return;
  username = usernameInput.value.trim();
  if(!username) return;
  usernameModal.classList.add("hidden");
  roomModal.classList.remove("hidden");
});

// ===== Create Room =====
newRoomBtn.addEventListener("click", ()=>{
  const r = newRoomInput.value.trim();
  const p = newRoomPassword.value.trim();
  if(r && p){
    socket.emit("create room", r, p, username);
  }
});

// ===== Join Room from list =====
roomList.addEventListener("click", e=>{
  if(e.target.tagName==="LI"){
    const selectedRoom = e.target.textContent;
    joinPasswordContainer.classList.remove("hidden");
    passwordAlert.classList.add("hidden");
    joinRoomBtn.onclick = ()=>{
      const pwd = joinRoomPassword.value.trim();
      if(!pwd) return;
      socket.emit("join room request", selectedRoom, pwd, username);
    };
  }
});

// ===== Socket Events =====
socket.on("room list", rooms=>{
  roomList.innerHTML="";
  rooms.forEach(r=>{
    const li=document.createElement("li");
    li.textContent=r;
    roomList.appendChild(li);
  });
});

socket.on("wrong password", ()=>{
  passwordAlert.textContent = "Incorrect password!";
  passwordAlert.classList.remove("hidden");
});

socket.on("room joined", roomName=>{
  room = roomName;
  chatContainer.classList.remove("hidden");
  roomModal.classList.add("hidden");
  chatTitle.textContent = "Jinnie Chat";
  chatSubtitle.textContent = `Room: ${room} (${username})`;
});
window.addEventListener("load", () => {
  const splash = document.getElementById("splash-screen");
  setTimeout(() => {
    splash.classList.add("fade-out");
  }, 1200); // shows for 1.2s before fading
});
