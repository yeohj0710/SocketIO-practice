const socket = io();

const welcome = document.getElementById("welcome");
const form = welcome.querySelector("form");
const room = document.getElementById("room");

room.hidden = true;

let roomName = null;

function getTime() {
  const now = new Date();
  let hour = now.getHours();
  let minute = now.getMinutes();
  let period;

  if (hour >= 12) {
    period = "오후";
    hour = hour === 12 ? hour : hour - 12;
  } else {
    period = "오전";
    hour = hour === 0 ? 12 : hour;
  }

  minute = minute < 10 ? "0" + minute : minute;

  return `${period} ${hour}:${minute}`;
}

function addMessage(message, addTime = true) {
  const div = room.querySelector("div");
  const p = document.createElement("p");
  p.innerText = message;

  const timeSpan = document.createElement("span");
  timeSpan.innerText = getTime();
  timeSpan.style.fontSize = "small";
  timeSpan.style.color = "gray";
  timeSpan.style.marginLeft = "5px";

  if (addTime) p.appendChild(timeSpan);

  div.appendChild(p);
}

function handleMessageSubmit(event) {
  event.preventDefault();
  const messageInput = room.querySelector("#message input");
  const message = messageInput.value;
  let nickname = null;
  socket.emit("get_nickname");
  socket.on("send_nickname", (getNickname) => {
    nickname = getNickname;
  });
  socket.emit("new_message", messageInput.value, roomName, () => {
    addMessage(`${nickname} (나): ${message}`);
  });
  messageInput.value = "";
}

function handleNicknameSubmit(event) {
  event.preventDefault();
  const input = room.querySelector("#nickname input");
  socket.emit("nickname", input.value);
}

function showRoom(newCount) {
  welcome.hidden = true;
  room.hidden = false;
  const h3 = room.querySelector("h3");
  h3.innerText = `${roomName} (${newCount}명 접속 중)`;
  const messageForm = room.querySelector("#message");
  const nicknameForm = room.querySelector("#nickname");
  messageForm.addEventListener("submit", handleMessageSubmit);
  nicknameForm.addEventListener("submit", handleNicknameSubmit);
}

function handleRoomSubmit(event) {
  event.preventDefault();
  const input = form.querySelector("input");
  socket.emit("enter_room", input.value, showRoom);
  roomName = input.value;
  input.value = "";
  addMessage("채팅방에 입장했습니다.", false);
}

form.addEventListener("submit", handleRoomSubmit);

socket.on("welcome", (user, newCount) => {
  const h3 = room.querySelector("h3");
  h3.innerText = `${roomName} (${newCount}명 접속 중)`;
  addMessage(`${user}님이 채팅방에 입장했습니다.`, false);
});

socket.on("bye", (user, newCount) => {
  const h3 = room.querySelector("h3");
  h3.innerText = `${roomName} (${newCount}명 접속 중)`;
  addMessage(`${user}님이 채팅방을 나갔습니다.`, false);
});

socket.on("new_message", addMessage);

socket.on("room_change", (rooms) => {
  const roomList = welcome.querySelector("ul");
  roomList.innerHTML = "";
  if (rooms.length === 0) {
    const h5 = document.createElement("h5");
    h5.innerText = "현재 대화 중인 채팅방이 없습니다. 채팅방을 생성해 보세요!";
    roomList.append(h5);
    const enterButton = document.getElementById("enterButton");
    enterButton.innerText = "생성하기";
    return;
  }
  rooms.forEach((room) => {
    const li = document.createElement("li");
    const { roomName, roomCount } = room;
    li.innerText = `${roomName} (${roomCount}명 접속 중)`;
    roomList.append(li);
  });
});
