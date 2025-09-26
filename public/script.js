const socket = io({ reconnection:true, reconnectionAttempts: Infinity, reconnectionDelay:1000 });

let username = null, room = null;

// ===== Elements =====
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

const typingIndicator = document.getElementById("typing-indicator");
const inviteBtn = document.getElementById("invite-btn");
const inviteModal = document.getElementById("inviteModal");
const closeInvite = document.getElementById("close-invite");
const inviteUrlInput = document.getElementById("invite-url");
const copyBtn = document.getElementById("copy-btn");

const toast = document.getElementById("toast");
let typingTimeout;

// ===== Splash Screen =====
window.addEventListener("load", ()=>{
  const splash = document.getElementById("splash-screen");
  setTimeout(()=>{
    splash.classList.add("fade-out");
  }, 1200);
});

// ===== URL-aware room join =====
window.addEventListener("load", ()=>{
  const params = new URLSearchParams(window.location.search);
  const roomFromUrl = params.get("room");
  if(roomFromUrl){
    joinPasswordContainer.classList.remove("hidden");
    newRoomInput.value = roomFromUrl;
    usernameModal.classList.remove("hidden");

    usernameBtn.onclick = ()=>{
      username = usernameInput.value.trim();
      if(!username) return;
      usernameModal.classList.add("hidden");
      joinPasswordContainer.classList.remove("hidden");

      joinRoomBtn.onclick = ()=>{
        const pwd = joinRoomPassword.value.trim();
        if(!pwd) return;
        socket.emit("join room request", roomFromUrl, pwd, username);
      };
    };
  } else {
    usernameModal.classList.add("show");
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

// ===== Join Room from List =====
roomList.addEventListener("click", e=>{
  if(e.target.tagName==="LI"){
    const selectedRoom = e.target.textContent;
    joinPasswordContainer.classList.remove("hidden");
    newRoomInput.value = selectedRoom;
    roomModal.style.display = "none"; // hide create section
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
  joinPasswordContainer.classList.add("hidden");
  chatTitle.textContent = "Jinnie Chat";
  chatSubtitle.textContent = `Room: ${room} (${username})`;
  addSystemMessage(`You joined the room "${room}"`);
});

// ===== Chat messages =====
function addMessage(user,text){
  const msg=document.createElement("div");
  msg.classList.add("message",user===username?"user":"other");
  const time=new Date();
  const hours=time.getHours()%12||12;
  const minutes=time.getMinutes()<10?"0"+time.getMinutes():time.getMinutes();
  const ampm=time.getHours()>=12?"PM":"AM";
  msg.innerHTML=`<strong>${user}:</strong> ${text} <span class="timestamp">${hours}:${minutes} ${ampm}</span>`;
  chatBody.appendChild(msg);
  chatBody.scrollTop=chatBody.scrollHeight;
}

function addSystemMessage(text){
  const msg=document.createElement("div");
  msg.classList.add("message","system");
  msg.innerHTML=`<em>${text}</em>`;
  chatBody.appendChild(msg);
  chatBody.scrollTop=chatBody.scrollHeight;
}

// ===== File messages =====
function addFileMessage(user,data){
  const msg=document.createElement("div");
  msg.classList.add("message",user===username?"user":"other");
  let fileContent="";
  if(data.fileType.startsWith("image/")) fileContent=`<img src="${data.fileData}" class="chat-image"/>`;
  else fileContent=`<a href="${data.fileData}" download="${data.fileName}">${data.fileName}</a>`;
  const time=new Date();
  const hours=time.getHours()%12||12;
  const minutes=time.getMinutes()<10?"0"+time.getMinutes():time.getMinutes();
  const ampm=time.getHours()>=12?"PM":"AM";
  msg.innerHTML=`<strong>${user}:</strong><br>${fileContent} <span class="timestamp">${hours}:${minutes} ${ampm}</span>`;
  chatBody.appendChild(msg);
  chatBody.scrollTop=chatBody.scrollHeight;
}

// ===== Socket chat events =====
socket.on("chat message", data=>{
  if(typeof data==="string") addMessage("Unknown",data);
  else addMessage(data.user||"Unknown",data.text||data);
});
socket.on("file message", data=>addFileMessage(data.user||"Unknown",data));

// ===== Typing =====
input.addEventListener("input", ()=>{
  socket.emit("typing", username);
  clearTimeout(typingTimeout);
  typingTimeout=setTimeout(()=>{ socket.emit("stop typing", username); },1000);
});

socket.on("typing", user=>{
  if(user!==username){
    typingIndicator.textContent=`${user} is typing...`;
    typingIndicator.style.display="block";
  }
});
socket.on("stop typing", user=>{
  if(user!==username){
    typingIndicator.style.display="none";
  }
});

// ===== Send message =====
sendBtn.addEventListener("click", ()=>{
  const msg=input.value.trim();
  if(!msg) return;
  addMessage(username,msg);
  socket.emit("chat message", msg);
  input.value="";
  socket.emit("stop typing", username);
});

input.addEventListener("keypress", e=>{
  if(e.key==="Enter") sendBtn.click();
});

// ===== File upload =====
fileBtn.addEventListener("click", ()=> fileInput.click());
fileInput.addEventListener("change", ()=>{
  const file = fileInput.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload=()=>{
    const data={ fileName:file.name, fileType:file.type, fileData:reader.result };
    addFileMessage(username,data);
    socket.emit("file upload", data);
  };
  reader.readAsDataURL(file);
});

// ===== Invite Modal =====
function setInviteUrl(){
  if(!room) return;
  inviteUrlInput.value=`${window.location.origin}?room=${room}`;
}
inviteBtn.addEventListener("click", ()=>{
  setInviteUrl();
  inviteModal.classList.remove("hidden");
});
closeInvite.addEventListener("click", ()=>inviteModal.classList.add("hidden"));
copyBtn.addEventListener("click", ()=>{
  inviteUrlInput.select();
  inviteUrlInput.setSelectionRange(0,99999);
  document.execCommand("copy");
  inviteModal.classList.add("hidden");
  showToast("Link copied!");
});

// ===== Toast =====
function showToast(msg,duration=1500){
  toast.textContent=msg;
  toast.classList.remove("hidden");
  toast.classList.add("show");
  setTimeout(()=>{
    toast.classList.remove("show");
    setTimeout(()=>toast.classList.add("hidden"),300);
  },duration);
}
