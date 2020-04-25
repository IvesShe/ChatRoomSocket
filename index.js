//載入要使用的庫
var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);

//記錄client使用的陣列
let client_list = [];

//服務導向index.html
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

//socket連接時，socket為該登入者
io.on('connection', (socket) => {
    //取出該客戶端暱稱
    let nickname = socket.handshake.query.nickname;

    //some() 方法會透過給定函式、測試陣列中是否至少有一個元素，通過該函式所實作的測試。這方法回傳的是布林值。
    if (!client_list.some(r => r.nickname === nickname)) { //檢查是否重覆登入
        //儲存至陣列
        client_list.push({
            nickname,
            socket
        })
        console.log('有客戶端連接', nickname);
        //廣播通知其它客戶端，有新客戶端上線
        socket.broadcast.emit('connection', "【系統】 " + nickname + " 上線了。當前有 " + client_list.length + "個客戶端在線");

    }

    //監聽client chat事件
    socket.on('chat', (obj) => {
        console.log(obj);
        //find() 方法會回傳第一個滿足所提供之測試函式的元素值。否則回傳 undefined。
        //找尋是否有私訊的對象
        let client = client_list.find(r => r.nickname === obj.receiver);
        if (client) { //若為私訊時
            client.socket.emit('msg', "【悄悄話】 " + nickname + "對你說: " + obj.msg);
        } else { //廣播
            socket.broadcast.emit('msg', "【廣播】 " + nickname + "說: " + obj.msg);
        }
    });

    //監聽client disconnect事件
    socket.on('disconnect', () => {
        console.log(nickname + '下線了。');
        //filter() 方法會建立一個經指定之函式運算後，由原陣列中通過該函式檢驗之元素所構成的新陣列。
        //刪除下線的客戶端資訊
        client_list = client_list.filter(r => r.nickname !== nickname);
        socket.broadcast.emit('offline', "【系統】 " + nickname + " 下線了。當前有 " + client_list.length + "個客戶端在線");
    });
});

//監聽port3000
http.listen(3000, () => {
    console.log('listening on *:3000');
});