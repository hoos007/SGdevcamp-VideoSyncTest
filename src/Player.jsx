import React, { Component } from 'react'
import ReactPlayer from 'react-player'
import styled from 'styled-components'
import SockJS from 'sockjs-client';
import webstomp from 'webstomp-client';
import axios from 'axios';

const PlayerWrapper = styled.div`
  position: relative;
  padding-top: 56.25% /* Player ratio: 100 / (1280 / 720) */;
  .react-player {
    position: absolute;
    top: 0;
    left: 0;
  }
`;

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
        progressInterval: 1000,
        style: { pointerEvents: 'none' }
    }

    getData = (id) => {
        try {
          const response = axios.post("http://3.34.161.56:8084/room/create/"+id);
          console.log(response);
        } catch (error) {
          console.error(error);
        }
    }

    connect = () => {
        var socket = new SockJS('http://3.34.161.56:8084/my-chat');
        stompClient = webstomp.over(socket);
        stompClient.connect({}, this.onConnected);
    }

    onConnected = () => {
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
            httpRequest.responseType = "json";
            httpRequest.setRequestHeader('Content-Type', 'application/json');
            httpRequest.send(JSON.stringify(chatMessage));
        }
        console.log(chatMessage);
    }

    onMessageReceived = (payload) => {
        var message = JSON.parse(payload.body);

        console.log(message);
    
        if(message.type === 'CHAT')  {
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
                if(!isHost)
                {
                    this.setState({playing: !this.state.playing});
                }
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
        messageOn = false;
    }

    sync = (state) => {
        this.sendMessage("Control:sync",ref.current.getCurrentTime());
    }

    setTime = (time) => {
        if(Math.abs(ref.current.getCurrentTime() - time) > 0.250)
        {
            ref.current.seekTo(time);
        }
        
    }

    render(){
        const { url, playing, controls, light, volume, muted, loop, played, loaded, duration, playbackRate, pip, progressInterval, style } = this.state
        
        return(
            <>
                <button onClick={(e)=>{
                    isHost = true;
                    this.setState({controls: true});
                    this.setState({style: {}})
                }}>호스트설정</button>
                <br/>
                <button onClick={this.connect}>로그인</button>
                <input type="text" id='type' ref={input => { this.urlInput02 = input }}/>
                <button onClick={(e)=>{
                    this.sendMessage("URL",this.urlInput02.value);
                }}>url</button>
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
                        style={style}
                        onProgress={() => {if(isHost) {this.sync();}}}
                        onPause={(e)=>{
                            if(isHost){
                                this.sendMessage("Control:play","true");
                            }
                        }}
                        onPlay={(e)=>{
                            if(isHost){
                                this.sendMessage("Control:play","false");
                            }
                        }}
                        />
                </PlayerWrapper>
            </>
        );
    }
}

export default Player;