import React, { Component } from 'react'
import ReactPlayer from 'react-player'
import styled from 'styled-components'
import SockJS from 'sockjs-client';
import webstomp from 'webstomp-client';

const PlayerWrapper = styled.div`
  position: relative;
  padding-top: 56.25% /* Player ratio: 100 / (1280 / 720) */;
  .react-player {
    position: absolute;
    top: 0;
    left: 0;
  }
`;

var data = {};//전송 데이터(JSON)
var sockJs;
var stomp;
var isHost = false;
var ref = React.createRef();

var stompClient = null;

class Player extends Component
{
    state = {
        url: null,
        pip: false,
        playing: false,
        controls: false,
        light: false,
        volume: 0.8,
        muted: true,
        played: 0,
        loaded: 0,
        duration: 0,
        playbackRate: 1.0,
        loop: false,
        progressInterval: 1000
    }

    setTime(time){
        if(Math.abs(ref.current.getCurrentTime() - time) > 0.250)
        {
            ref.current.seekTo(time);
        }
        
    }

    connect = () => {
        var socket = new SockJS('http://3.34.161.56:8084/my-chat');
        stompClient = webstomp.over(socket);
        stompClient.connect({}, this.onConnected);
    }

    onConnected = () => {
        // Subscribe to the Public Topic
        stompClient.subscribe('/topic/group', this.onMessageReceived);
    }

    sendMessage = (type, msg) => {
        var httpRequest = new XMLHttpRequest();
    
        var messageContent = msg;
    
        if(messageContent && stompClient) {
            var chatMessage = {
                author: type,
                content: messageContent,
                type: 'CHAT'
            };

            httpRequest.open('POST', 'http://3.34.161.56:8084/kafka/publish', true);
            /* Response Type을 Json으로 사전 정의 */
            httpRequest.responseType = "json";
            /* 요청 Header에 컨텐츠 타입은 Json으로 사전 정의 */
            httpRequest.setRequestHeader('Content-Type', 'application/json');
            /* 정의된 서버에 Json 형식의 요청 Data를 포함하여 요청을 전송 */
            httpRequest.send(JSON.stringify(chatMessage));
        }
        console.log(chatMessage);
    }

    onMessageReceived = (payload) => {
        var message = JSON.parse(payload.body);

        console.log(message);
    
        if(message.type === 'JOIN') {
            console.log('event-message');
            console.log(message.author + ' joined!');
        } else if (message.type === 'LEAVE') {
            console.log('event-message');
            console.log(message.author + ' left!');
        } else {
            if(message.author === "sys:host")
            {
                console.log(message.content);
                isHost = true;
                this.setState({controls: true});
            }
            else if(message.author === "URL")
            {
                if(this.state.url !== message.content)
                {
                    this.setState({url: message.content});
                }
            }
            else if(message.author === "Control:play")
            {
                this.setState({playing: !this.state.playing});
            }
            else if(message.author === "Control:sync")
            {
                if(!isHost)
                {
                    console.log(Number(message.content));
                    this.setTime(Number(message.content));
                }
            }
        }
    }

    // btnLogin = (e) => {
    //     sockJs = new SockJS("http://3.34.161.56:9092/my-chat");

    //     stomp = webstomp.over(sockJs);

    //     stomp.connect({}, function (){
    //         console.log("STOMP Connection");
    //         setTimeout(function() {stomp.subscribe("/topic/group", function (msg) {
    //             var data = JSON.parse(msg.data)
    //             if(data.type === "sys:host")
    //             {
    //                 console.log(data.msg);
    //                 isHost = true;
    //                 this.setState({controls: true});
    //             }
    //             else if(data.type === "URL")
    //             {
    //                 if(this.state.url !== data.msg)
    //                 {
    //                     this.setState({url: data.msg});
    //                 }
    //             }
    //             else if(data.type === "Control:play")
    //             {
    //                 this.setState({playing: !this.state.playing});
    //             }
    //             else if(data.type === "Control:sync")
    //             {
    //                 if(!isHost)
    //                 {
    //                     console.log(Number(data.msg));
    //                     this.setTime(Number(data.msg));
    //                 }
    //             }
    //         });},500);
    //     });
        
        

    // }
    
    // btnSend = (type,msg,e) => {
    //     this.send(type,msg);
    // }
    
    // send(type, msg){
    //     if(msg.toString().trim() !== ''){
    //         data.type = type;
    //         data.msg = msg;
    //         var temp = JSON.stringify(data);
    //         stomp.send('/kafka/sendMessage', {}, temp)
    //     }
    // }

    // onChangeUrl(e){
    //     setVideoURL(e.target.value);
    // }

    // setboolean(bool){
    //     setbool(!bool)
    // }

    // handleProgress = (state) => {
    //     console.log('onProgress',state);
    // }

    // endbufferhandler = (state) => {
    //     ref.current.seekTo(50,"seconds");
    // }

    // startbuffer = (stete) =>
    // {
    //     this.send("loading:start",1);
    // }

    // endBuffer = (state) =>
    // {
    //     this.send("loading:end",1);
    // }

    sync = (state) => {
        // this.send("URL",this.state.url);
        this.send("Control:sync",ref.current.getCurrentTime());
    }

    render(){
        const { url, playing, controls, light, volume, muted, loop, played, loaded, duration, playbackRate, pip, progressInterval } = this.state
        
        return(
            <>
                <button onClick={this.connect}>로그인</button>
                <input type="text" id='type' ref={input => { this.urlInput = input }}/>
                <button onClick={(e)=>{
                    this.sendMessage("URL",this.urlInput.value);
                }}>url</button>
                <button onClick={(e)=>{this.sendMessage("Control:play",playing.toString())}}>play</button>
                <button onClick={(e)=>{this.sendMessage("Control:time",10)}}>1:00</button>
                <PlayerWrapper>
                    <ReactPlayer
                        ref={ref}
                        className="react-player"
                        url={url}
                        width="100%"
                        height="100%"
                        controls={controls}
                        muted={muted}
                        playing={playing}
                        progressInterval={progressInterval}
                        onProgress={() => {if(isHost) {this.sync();}}}
                        // onBuffer={() => {console.log("onBuffer")}}
                        // onBufferEnd={() => {console.log("onBufferEnd")}}
                        // onPlay={() => {if(isHost) {this.sync();}}}
                        // onPause={(e)=>{this.btnSend("Control:play",true,e)}}
                        />
                </PlayerWrapper>
            </>
        );
    }
}

export default Player;