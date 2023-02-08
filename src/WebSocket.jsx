import React, { useRef } from 'react'

var data = {};//전송 데이터(JSON)
var ws;

function btnLogin(e){
    ws = new WebSocket("ws://127.0.0.1:9999/chatt");

    ws.onmessage = (data) => {
        if(data.type === "URL")
        {
            setVideoURL(data.msg);
        }
      };
}

function btnSend(e){
    send();
}

function send(type, msg){
    if(msg.trim() !== ''){
        data.type = type;
        data.msg = msg;
        var temp = JSON.stringify(data);
        ws.send(temp);
    }
}