const express = require("express");
const app = express();
// socket은 express가 아닌 http 모듈에 연결해야 사용 가능
const http = require("http").Server(app);
const io = require("socket.io")(http); // http-socket 연결
const PORT = 8000;

app.set("view engine", "ejs");
app.use("/views", express.static(__dirname + "/views"));
app.use("/static", express.static(__dirname + "/static"));

app.get("/", (req, res) => {
  res.render("chat");
});

const nickArray = {}; // 유저 목록

// [실습 46]
// 유저 목록 업데이트
function updateList() {
  io.emit("updateNicks", nickArray); // { socket.id : nick1, socket.id : nick2 ...}
}

// io.on()
// : socket과 관련된 통신작업을 처리
io.on("connection", (socket) => {
  // "connection" event
  // : 클라이언트가 접속했을 때 발생, 콜백으로 socket 객체를 제공!
  /*
  console.log("**** ⭕ Server Socket Connected >> ", socket.id);
  // socket.id: 소켓 고유 아이디 -> socket은 웹 페이지 별로 생김!!

  // [실습42]
  
  socket.on("hello", (data) => {
    // console.log('socket on hello >> ', data);
    console.log(`${data.who} : ${data.msg}`);
    socket.emit("helloKr", { who: "hello", msg: "안녕~~~" });
  });

  socket.on("study", (data) => {
    // console.log('socket on hello >> ', data);
    console.log(`${data.who} : ${data.msg}`);
    socket.emit("studyKr", { who: "study", msg: "공부~~~" });
  });

  socket.on("bye", (data) => {
    // console.log('socket on hello >> ', data);
    console.log(`${data.who} : ${data.msg}`);
    socket.emit("byeKr", { who: "bye", msg: "빠이루~~~" });
  });
  */
  // 실습 44 채팅 입장 안내
  // io.emit("notice", `${socket.id.slice(0, 5)}님이 입장하셨습니다.`);

  //실습 44-2 채팅창 입장 안내문 socket.id => nickname
  socket.on("setNick", (nick) => {
    console.log("socket on setNick >> ", nick);
    // console.log(Object.values(nickArray).indexOf(nick));
    //nickArray: {socket.id1: nick1, socket.id2: nick2, ....}
    // -> Object.values(): [nick1, nick2, nick3...]
    // -> indexOf() : nick이 존재하는지
    if (Object.values(nickArray).indexOf(nick) > -1) {
      // 닉네임 중복이 있다면
      socket.emit("error", "이미 존재하는 닉네임입니다. 다시 입력해 주세요");
    } else {
      // 닉네임 중복이 없다면
      nickArray[socket.id] = nick; // {socket.id : nick};
      console.log("접속 유저 목록 >> ", nickArray);
      io.emit("notice", `${nick}님이 입장하셨습니다.`);
      socket.emit("entrySuccess", nick);
      updateList();
    }
  });

  // 실습 44-3 접속자 퇴장시
  // 'notice' 이벤트로 퇴장 공지

  socket.on("disconnect", (nick) => {
    // 1. socket.id 콘솔로그 찍기
    console.log("disconnect >>> ", socket.id);
    // 2. 전체공지(io) ('notice', 퇴장메세지('유저 닉네임 포함해서);
    io.emit("notice", `${nickArray[socket.id]}님이 퇴장하셨습니다.`);
    // 3. nickArray에서 해당 유저 삭제 (객체에서 key-value 쌍 삭제)
    delete nickArray[socket.id];
    // console.log(nickArray);

    updateList(); // 유저 목록 업데이트
  });

  // [실습 45] 채팅창 메세지 전송 step1
  socket.on("send", (data) => {
    console.log("socket on send >> ", data); // {myNick: 'a', dm : 'all or 특정닉네임', msg: 'ss'}
    if (data.dm !== "all") {
      // [실습 46] DM 기능
      let dmSocketId = data.dm; // data.dm: 특정 유저의 socket id
      const sendData = { nick: data.myNick, msg: data.msg, dm: "(속닥속닥)" };
      io.to(dmSocketId).emit("newMessage", sendData); // 특정 소켓 아이디에게만 메세지 전송;
      socket.emit("newMessage", sendData); // 자기 자신에게도 DM 메세지 전송
    } else {
      // [실습 45] 채팅창 메세지 전송 step2
      const sendData = { nick: data.myNick, msg: data.msg };
      io.emit("newMessage", sendData);
    }
  });
});

// 주의!!!) 소켓을 사용하기 위해서는 http.listen()으로 포트를 열어야 함
http.listen(PORT, () => {
  console.log(`http://localhost:${PORT}`);
});
