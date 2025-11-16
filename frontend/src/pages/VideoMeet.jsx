import React, { useEffect, useRef, useState, useCallback } from 'react';
import io from "socket.io-client";
import { Badge, IconButton, TextField, CircularProgress } from '@mui/material';
import { Button } from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import CallEndIcon from '@mui/icons-material/CallEnd';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare';
import ChatIcon from '@mui/icons-material/Chat';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import styles from '../styles/videoComponent.module.css';

// Server URL (backend socket server) — backend runs on port 8000
const server_url = import.meta.env.VITE_SERVER_URL || "http://localhost:8000";

const peerConfigConnections = {
    "iceServers": [
        { "urls": "stun:stun.l.google.com:19302" }
    ]
};

let connections = {};

export default function VideoMeetComponent() {
    const socketRef = useRef();
    const socketIdRef = useRef();
    const localVideoRef = useRef();
    const localStreamRef = useRef();
    const videoRef = useRef([]);

    const [videoAvailable, setVideoAvailable] = useState(true);
    const [audioAvailable, setAudioAvailable] = useState(true);
    const [video, setVideo] = useState(false);
    const [audio, setAudio] = useState(false);
    const [screen, setScreen] = useState(false);
    const [showModal, setModal] = useState(false);
    const [screenAvailable, setScreenAvailable] = useState(false);
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState("");
    const [newMessages, setNewMessages] = useState(0);
    const [askForUsername, setAskForUsername] = useState(true);
    const [username, setUsername] = useState("");
    const [videos, setVideos] = useState([]);
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [activeModalView, setActiveModalView] = useState('chat'); // 'chat' or 'ai'
    const [aiWelcomeMessageSent, setAiWelcomeMessageSent] = useState(false);

    const getDisplayMedia = useCallback(() => {
        if (screen) {
            if (navigator.mediaDevices.getDisplayMedia) {
                navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
                    .then(getDislayMediaSuccess)
                    .catch((e) => console.log(e));
            }
        }
    }, [screen]);

    const getDislayMediaSuccess = useCallback((stream) => {
        try {
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(track => track.stop());
            }
        } catch (e) { console.log(e); }

        localStreamRef.current = stream;
        if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
        }

        for (let id in connections) {
            if (id === socketIdRef.current) continue;

            connections[id].addStream(localStreamRef.current);

            connections[id].createOffer().then((description) => {
                connections[id].setLocalDescription(description)
                    .then(() => {
                        socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }));
                    })
                    .catch(e => console.log(e));
            });
        }

        stream.getTracks().forEach(track => track.onended = () => {
            setScreen(false);

            try {
                if (localVideoRef.current && localVideoRef.current.srcObject) {
                    let tracks = localVideoRef.current.srcObject.getTracks();
                    tracks.forEach(track => track.stop());
                }
            } catch (e) { console.log(e); }

            let blackSilence = (...args) => new MediaStream([black(...args), silence()]);
            localStreamRef.current = blackSilence();
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = localStreamRef.current;
            }

            getUserMedia();
        });
    }, []);

    const getUserMediaSuccess = useCallback((stream) => {
        try {
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(track => track.stop());
            }
        } catch (e) { console.log(e); }

        localStreamRef.current = stream;
        if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
        }

        for (let id in connections) {
            if (id === socketIdRef.current) continue;

            connections[id].addStream(localStreamRef.current);

            connections[id].createOffer().then((description) => {
                connections[id].setLocalDescription(description)
                    .then(() => {
                        socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }));
                    })
                    .catch(e => console.log(e));
            });
        }

        stream.getTracks().forEach(track => track.onended = () => {
            setVideo(false);
            setAudio(false);

            try {
                if (localVideoRef.current && localVideoRef.current.srcObject) {
                    let tracks = localVideoRef.current.srcObject.getTracks();
                    tracks.forEach(track => track.stop());
                }
            } catch (e) { console.log(e); }

            let blackSilence = (...args) => new MediaStream([black(...args), silence()]);
            localStreamRef.current = blackSilence();
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = localStreamRef.current;
            }

            for (let id in connections) {
                connections[id].addStream(localStreamRef.current);

                connections[id].createOffer().then((description) => {
                    connections[id].setLocalDescription(description)
                        .then(() => {
                            socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }));
                        })
                        .catch(e => console.log(e));
                });
            }
        });
    }, []);

    const getUserMedia = useCallback(() => {
        if ((video && videoAvailable) || (audio && audioAvailable)) {
            navigator.mediaDevices.getUserMedia({ video: video, audio: audio })
                .then(getUserMediaSuccess)
                .catch((e) => console.log(e));
        } else {
            try {
                if (localVideoRef.current && localVideoRef.current.srcObject) {
                    let tracks = localVideoRef.current.srcObject.getTracks();
                    tracks.forEach(track => track.stop());
                }
            } catch (e) { console.log(e); }
        }
    }, [video, audio, videoAvailable, audioAvailable, getUserMediaSuccess]);

    useEffect(() => {
        getPermissions();
    }, []);

    useEffect(() => {
        if (video !== undefined && audio !== undefined) {
            getUserMedia();
        }
    }, [video, audio, getUserMedia]);

    useEffect(() => {
        if (screen !== undefined) {
            getDisplayMedia();
        }
    }, [screen, getDisplayMedia]);

    const getPermissions = async () => {
        try {
            const videoPermission = await navigator.mediaDevices.getUserMedia({ video: true });
            setVideoAvailable(!!videoPermission);

            const audioPermission = await navigator.mediaDevices.getUserMedia({ audio: true });
            setAudioAvailable(!!audioPermission);

            if (navigator.mediaDevices.getDisplayMedia) {
                setScreenAvailable(true);
            }

            if (videoAvailable || audioAvailable) {
                const userMediaStream = await navigator.mediaDevices.getUserMedia({
                    video: videoAvailable,
                    audio: audioAvailable
                });
                if (userMediaStream) {
                    localStreamRef.current = userMediaStream;
                    if (localVideoRef.current) {
                        localVideoRef.current.srcObject = userMediaStream;
                    }
                }
            }
        } catch (error) {
            console.log(error);
            setVideoAvailable(false);
            setAudioAvailable(false);
        }
    };

    const getMedia = () => {
        setVideo(videoAvailable);
        setAudio(audioAvailable);
        connectToSocketServer();
    };

    const connectToSocketServer = () => {
        socketRef.current = io.connect(server_url, { secure: false });

        socketRef.current.on('signal', gotMessageFromServer);

        socketRef.current.on('connect', () => {
            // Emit a normalized meeting id (last path segment) instead of full href
            const pathParts = window.location.pathname.split('/').filter(Boolean);
            const meetingId = pathParts.length ? pathParts[pathParts.length - 1] : window.location.href;
            socketRef.current.emit('join-call', meetingId);
            socketIdRef.current = socketRef.current.id;

            socketRef.current.on('chat-message', addMessage);

            socketRef.current.on('user-left', (id) => {
                setVideos((videos) => videos.filter((video) => video.socketId !== id));
            });

            socketRef.current.on('user-joined', (id, clients) => {
                clients.forEach((socketListId) => {
                    connections[socketListId] = new RTCPeerConnection(peerConfigConnections);

                    connections[socketListId].onicecandidate = function (event) {
                        if (event.candidate != null) {
                            socketRef.current.emit('signal', socketListId, JSON.stringify({ 'ice': event.candidate }));
                        }
                    };

                    connections[socketListId].onaddstream = (event) => {
                        let videoExists = videoRef.current.find(video => video.socketId === socketListId);

                        if (videoExists) {
                            setVideos(videos => {
                                const updatedVideos = videos.map(video =>
                                    video.socketId === socketListId ? { ...video, stream: event.stream } : video
                                );
                                videoRef.current = updatedVideos;
                                return updatedVideos;
                            });
                        } else {
                            let newVideo = {
                                socketId: socketListId,
                                stream: event.stream,
                                autoplay: true,
                                playsinline: true
                            };

                            setVideos(videos => {
                                const updatedVideos = [...videos, newVideo];
                                videoRef.current = updatedVideos;
                                return updatedVideos;
                            });
                        }
                    };

                    if (localStreamRef.current) {
                        connections[socketListId].addStream(localStreamRef.current);
                    } else {
                        let blackSilence = (...args) => new MediaStream([black(...args), silence()]);
                        localStreamRef.current = blackSilence();
                        connections[socketListId].addStream(localStreamRef.current);
                    }
                });

                if (id === socketIdRef.current) {
                    for (let id2 in connections) {
                        if (id2 === socketIdRef.current) continue;

                        try {
                            connections[id2].addStream(localStreamRef.current);
                        } catch (e) { }

                        connections[id2].createOffer().then((description) => {
                            connections[id2].setLocalDescription(description)
                                .then(() => {
                                    socketRef.current.emit('signal', id2, JSON.stringify({ 'sdp': connections[id2].localDescription }));
                                })
                                .catch(e => console.log(e));
                        });
                    }
                }
            });
        });
    };

    const gotMessageFromServer = (fromId, message) => {
        const signal = JSON.parse(message);
        if (fromId === socketIdRef.current) return;
        if (!connections[fromId]) {
            connections[fromId] = new RTCPeerConnection(peerConfigConnections);
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(track => {
                    connections[fromId].addTrack(track, localStreamRef.current);
                });
            }
            connections[fromId].onicecandidate = event => {
                if (event.candidate) {
                    socketRef.current.emit('signal', fromId, JSON.stringify({ 'ice': event.candidate }));
                }
            };
            connections[fromId].ontrack = event => {
                const remoteStream = event.streams[0];
                setVideos(prevVideos => {
                    const existingVideo = prevVideos.find(v => v.socketId === fromId);
                    if (existingVideo) {
                        return prevVideos.map(v =>
                            v.socketId === fromId ? { ...v, stream: remoteStream } : v
                        );
                    }
                    return [...prevVideos, {
                        socketId: fromId,
                        stream: remoteStream,
                        autoplay: true,
                        playsinline: true
                    }];
                });
            };
        }
        if (signal.sdp) {
            connections[fromId]
                .setRemoteDescription(new RTCSessionDescription(signal.sdp))
                .then(() => {
                    if (signal.sdp.type === 'offer') {
                        return connections[fromId].createAnswer();
                    }
                })
                .then(description => {
                    if (description) {
                        return connections[fromId].setLocalDescription(description);
                    }
                })
                .then(() => {
                    if (connections[fromId].localDescription) {
                        socketRef.current.emit('signal', fromId, JSON.stringify({ 'sdp': connections[fromId].localDescription }));
                    }
                })
                .catch(e => console.log("SDP error:", e));
        }
        if (signal.ice) {
            connections[fromId]
                .addIceCandidate(new RTCIceCandidate(signal.ice))
                .catch(e => console.log("ICE error:", e));
        }
    };

    const silence = () => {
        let ctx = new AudioContext();
        let oscillator = ctx.createOscillator();
        let dst = oscillator.connect(ctx.createMediaStreamDestination());
        oscillator.start();
        ctx.resume();
        return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false });
    };

    const black = ({ width = 640, height = 480 } = {}) => {
        let canvas = Object.assign(document.createElement("canvas"), { width, height });
        canvas.getContext('2d').fillRect(0, 0, width, height);
        let stream = canvas.captureStream();
        return Object.assign(stream.getVideoTracks()[0], { enabled: false });
    };

    const handleVideo = () => setVideo(!video);
    const handleAudio = () => setAudio(!audio);
    const handleScreen = () => setScreen(!screen);

    const handleEndCall = () => {
        try {
            if (localVideoRef.current && localVideoRef.current.srcObject) {
                localVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
            }
        } catch (e) { }
        window.location.href = "/";
    };

    const addMessage = (data, sender, socketIdSender, isAiPrompt = false) => {
        setMessages((prevMessages) => [
            ...prevMessages,
            { sender: sender, data: data, socketId: socketIdSender, isAiPrompt }
        ]);
        if (socketIdSender !== socketIdRef.current && !isAiPrompt && socketIdSender !== 'ai-assistant') {
            setNewMessages((prevNewMessages) => prevNewMessages + 1);
        }
    };

    const getAiResponse = async (prompt, chatHistory) => {
        setIsAiLoading(true);
        // Vite exposes env vars prefixed with VITE_ via import.meta.env
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

        const history = chatHistory
            .filter(msg => msg.isAiPrompt || msg.socketId === 'ai-assistant')
            .map(msg => ({
                role: msg.socketId === socketIdRef.current ? 'user' : 'model',
                parts: [{ text: msg.data }]
            })).slice(-10);

        const payload = {
            contents: [...history, { role: 'user', parts: [{ text: prompt }] }]
        };

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await response.json();
            const aiText = result.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't process that.";
            addMessage(aiText, 'AI Assistant', 'ai-assistant', false);
        } catch (error) {
            console.error("Error fetching AI response:", error);
            addMessage("Sorry, an error occurred with the AI assistant.", 'AI Assistant', 'ai-assistant', false);
        } finally {
            setIsAiLoading(false);
        }
    };

    const handleSendMessage = () => {
        if (!message.trim()) return;

        if (activeModalView === 'ai') {
            addMessage(message, username, socketIdRef.current, true);
            getAiResponse(message, messages);
        } else {
            socketRef.current.emit('chat-message', message, username);
            addMessage(message, username, socketIdRef.current, false);
        }
        setMessage("");
    };

    const connect = () => {
        if (username.trim()) {
            setAskForUsername(false);
            getMedia();
        }
    };

    const openChat = () => {
        if (showModal && activeModalView === 'chat') {
            setModal(false);
        } else {
            setActiveModalView('chat');
            setModal(true);
            setNewMessages(0);
        }
    };

    const openAiAssistant = () => {
        if (showModal && activeModalView === 'ai') {
            setModal(false);
        } else {
            setActiveModalView('ai');
            setModal(true);
            if (!aiWelcomeMessageSent) {
                addMessage("Hey! Do you need any help with the topics we discussed in the meeting?", 'AI Assistant', 'ai-assistant', false);
                setAiWelcomeMessageSent(true);
            }
        }
    };

    const closeModal = () => setModal(false);

    const chatMessages = messages.filter(m => !m.isAiPrompt && m.socketId !== 'ai-assistant');
    const aiMessages = messages.filter(m => m.isAiPrompt || m.socketId === 'ai-assistant');

    return (
        <div className={styles.mainContainer}>
            {askForUsername === true ? (
                <div className={styles.lobbyContainer}>
                    <div className={styles.lobbyContent}>
                        <h2 className={styles.lobbyTitle}>Enter the meeting Lobby</h2>
                        <p className={styles.lobbySubtitle}>Join the conversation with your team</p>
                        
                        <div className={styles.inputContainer}>
                            <TextField 
                                id="outlined-basic" 
                                label="Enter Full Name" 
                                value={username} 
                                onChange={e => setUsername(e.target.value)} 
                                variant="outlined" 
                                className={styles.usernameInput}
                            />
                            <Button 
                                variant="contained" 
                                onClick={connect}
                                className={styles.connectButton}
                                disabled={!username.trim()}
                            >
                                Join Meeting
                            </Button>
                        </div>
                        
                        <div className={styles.videoPreview}>
                            <video 
                                ref={localVideoRef} 
                                autoPlay 
                                muted
                                className={styles.previewVideo}
                            ></video>
                        </div>
                    </div>
                </div>
            ) : (
                <div className={styles.meetVideoContainer}>
                    <div className={`${styles.chatRoom} ${!showModal ? styles.hidden : ''}`}>
                        <button onClick={closeModal} className={styles.closeChatButton}>&times;</button>
                        {activeModalView === 'chat' ? (
                            <div className={styles.chatContainer}>
                                <h1>Team Chat</h1>
                                <div className={styles.chattingDisplay}>
                                    {chatMessages.map((item, index) => {
                                        const isSender = item.socketId === socketIdRef.current;
                                        return (
                                            <div key={index} className={`${styles['message-container']} ${isSender ? styles.sender : styles.receiver}`}>
                                                <div className={styles['profile-pic']}></div>
                                                <div className={styles['message-bubble']}>
                                                    {!isSender && <strong>{item.sender}</strong>}
                                                    <div>{item.data}</div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            <div className={styles.chatContainer}>
                                <h1>AI Assistant</h1>
                                <div className={styles.chattingDisplay}>
                                    {aiMessages.map((item, index) => {
                                        const isSender = item.socketId === socketIdRef.current;
                                        return (
                                            <div key={index} className={`${styles['message-container']} ${isSender ? styles.sender : styles.ai}`}>
                                                <div className={styles['profile-pic']}></div>
                                                <div className={styles['message-bubble']}>
                                                    {isSender && <strong>You</strong>}
                                                    {!isSender && <strong>AI Assistant</strong>}
                                                    <div>{item.data}</div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {isAiLoading && <div className={`${styles['message-container']} ${styles.ai}`}><div className={styles['profile-pic']}></div><div className={styles['message-bubble']}><CircularProgress size={20} /></div></div>}
                                </div>
                            </div>
                        )}
                         <div className={styles.chattingArea}>
                            <TextField 
                                value={message} 
                                onChange={(e) => setMessage(e.target.value)} 
                                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                id="outlined-basic" 
                                label={activeModalView === 'chat' ? "Type a message..." : "Ask the AI..."}
                                variant="outlined" 
                                fullWidth
                            />
                            <Button variant='contained' onClick={handleSendMessage}>Send</Button>
                        </div>
                    </div>

                    <div className={styles.buttonContainers}>
                        <IconButton onClick={handleVideo} style={{ color: "white" }}>
                            {(video === true) ? <VideocamIcon /> : <VideocamOffIcon />}
                        </IconButton>
                        <IconButton onClick={handleEndCall} style={{ color: "red" }}>
                            <CallEndIcon />
                        </IconButton>
                        <IconButton onClick={handleAudio} style={{ color: "white" }}>
                            {audio === true ? <MicIcon /> : <MicOffIcon />}
                        </IconButton>

                        {screenAvailable === true ? (
                            <IconButton onClick={handleScreen} style={{ color: "white" }}>
                                {screen === true ? <StopScreenShareIcon /> : <ScreenShareIcon />}
                            </IconButton>
                        ) : null}

                         <IconButton onClick={openAiAssistant} style={{ color: "white" }}>
                            <SmartToyIcon />
                        </IconButton>

                        <Badge badgeContent={newMessages} max={999} color="secondary">
                            <IconButton onClick={openChat} style={{ color: "white" }}>
                                <ChatIcon />
                            </IconButton>
                        </Badge>
                    </div>

                    <video className={styles.meetUserVideo} ref={localVideoRef} autoPlay muted></video>

                    <div className={styles.conferenceView}>
                        {videos.map((video) => (
                            <div key={video.socketId}>
                                <video
                                    data-socket={video.socketId}
                                    ref={ref => {
                                        if (ref && video.stream) {
                                            ref.srcObject = video.stream;
                                        }
                                    }}
                                    autoPlay
                                    playsInline
                                ></video>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
