import "regenerator-runtime";
import http from "http";
import { Server } from "socket.io";
import { instrument } from "@socket.io/admin-ui";
import express from "express";

const app = express();

app.set("view engine", "pug");
app.set("views", process.cwd() + "/src/views");
app.use("/public", express.static(process.cwd() + "/src/public"));
app.get("/", (_, res) => res.render("home"));
app.get("/*", (_, res) => res.redirect("/"));

const httpServer = http.createServer(app);
const wsServer = new Server(httpServer, {
  cors: {
    origin: ["https://admin.socket.io"],
    credentials: true,
  },
});

instrument(wsServer, {
  auth: false,
});

function countUsers(roomName) {
  return wsServer.sockets.adapter.rooms.get(roomName)?.size;
}

function publicRooms() {
  const {
    sockets: {
      adapter: { sids, rooms },
    },
  } = wsServer;
  const publicRooms = [];
  rooms.forEach((_, key) => {
    if (sids.get(key) === undefined) {
      publicRooms.push({
        roomName: key,
        roomCount: countUsers(key),
      });
    }
  });
  return publicRooms;
}

function getRandomAnimalName() {
  const animalNames = [
    "토끼",
    "고양이",
    "강아지",
    "호랑이",
    "코끼리",
    "사자",
    "원숭이",
    "판다",
    "독수리",
    "물개",
    "하마",
    "앵무새",
    "거북이",
    "다람쥐",
    "고릴라",
    "해마",
    "캥거루",
    "낙타",
  ];

  const randomIndex = Math.floor(Math.random() * animalNames.length);

  return animalNames[randomIndex];
}

wsServer.on("connection", (socket) => {
  socket.nickname = `익명의 ${getRandomAnimalName()}`;
  wsServer.sockets.emit("room_change", publicRooms());
  socket.onAny((event) => {
    console.log(`Socket event: ${event}`);
  });
  socket.on("enter_room", (roomName, done) => {
    socket.join(roomName);
    done(countUsers(roomName));
    socket.to(roomName).emit("welcome", socket.nickname, countUsers(roomName));
    wsServer.sockets.emit("room_change", publicRooms());
  });
  socket.on("disconnecting", () => {
    socket.rooms.forEach((room) =>
      socket.to(room).emit("bye", socket.nickname, countUsers(room) - 1)
    );
  });
  socket.on("disconnect", () => {
    wsServer.sockets.emit("room_change", publicRooms());
  });
  socket.on("new_message", (message, room, done) => {
    socket.to(room).emit("new_message", `${socket.nickname}: ${message}`);
    done();
  });
  socket.on("nickname", (nickname) => (socket.nickname = nickname));
  socket.on("get_nickname", () => {
    socket.emit("send_nickname", socket.nickname);
  });
});

const PORT = 8000;

httpServer.listen(PORT, () =>
  console.log(`✅ Server listening on http://localhost:${PORT} 🚀`)
);
