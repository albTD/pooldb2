let app = require('express')();
let http = require('http').Server(app);
let io = require('socket.io')(http);
const mysql = require('mysql');
var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "poolapp"
});

io.on('connection', (socket) => {

  socket.on('disconnect', function () {
    io.emit('users-changed', {
      user: socket.nickname,
      event: 'left'
    });
  });

  socket.on('set-nickname', (nickname) => {
    socket.nickname = nickname;
    io.emit('users-changed', {
      user: nickname,
      event: 'joined'
    });
  });

  socket.on('add-message', (message) => {
    io.emit('message', {
      text: message.text,
      from: socket.nickname,
      created: new Date()
    });
    //sql query to store messages into database;
    var query = 'INSERT INTO `' + message.title + '` (name,message,postid,userid) VALUES ("' + socket.nickname + '","' + message.text + '","' + message.postid + '","' + message.userid + '")';
    con.query(query, [message.text], (err, results) => {
      if (err) console.log(err);
      else {
        console.count("Message stored in respective DB");
      };
    });
    //to store groupChatName and userid if it already doesn't exist
    var query2 = 'SELECT * FROM chatList WHERE groupName = "' + message.title + '" AND userid = "' + message.userid + '" ';
    con.query(query2, (err, results) => {
      if (err) {
        console.log(err);
      } else if (results.length === 0) {
        var query3 = 'INSERT INTO chatList (groupName,groupId,userId,userName) VALUES ("' + message.title + '", "' + message.postid + '" ,"' + message.userid + '", "' + socket.nickname + '")';
        con.query(query3, (err, results) => {
          if (err) {
            console.error("Error in storing groupName & userDetails", err);
          } else {
            console.log("SUCCESSFUL");
          }
        });
      };
    });
  });
});

var port = process.env.PORT || 3001;

con.connect((err) => {
  if (!err)
    console.log('DB connection succeded.');
  else
    console.log('DB connection failed \n Error : ' + JSON.stringify(err, undefined, 2));
});

http.listen(port, function () {
  console.log('listening in http://localhost:' + port);
});