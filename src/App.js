import React, { useEffect, useRef, useState } from "react";
import Peer from "peerjs";
import { MicrophoneIcon, VideoCameraIcon, PhoneIcon } from "@heroicons/react/24/solid";
import "./App.css";

function App() {
  const [peerId, setPeerId] = useState("");
  const [remotePeerIdValue, setRemotePeerIdValue] = useState("");
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const remoteVideoRef = useRef(null);
  const currentUserVideoRef = useRef(null);
  const peerInstance = useRef(null);
  const mediaStreamRef = useRef(null);

  useEffect(() => {
    const peer = new Peer();

    peer.on("open", (id) => {
      setPeerId(id);
      console.log("Your peer ID is:", id);
    });

    peer.on("call", (call) => {
      if (mediaStreamRef.current) {
        call.answer(mediaStreamRef.current);
        call.on("stream", (remoteStream) => {
          remoteVideoRef.current.srcObject = remoteStream;
          remoteVideoRef.current.play().catch((error) =>
            console.error("Failed to play remote stream", error)
          );
        });
        setIsConnected(true);
      }
    });

    peerInstance.current = peer;

    return () => {
      if (peer) {
        peer.destroy();
      }
    };
  }, []);

  const getUserMedia = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      mediaStreamRef.current = mediaStream;
      currentUserVideoRef.current.srcObject = mediaStream;
      await currentUserVideoRef.current.play();
    } catch (error) {
      console.error("Error accessing media devices.", error);
    }
  };

  const toggleAudio = () => {
    if (mediaStreamRef.current) {
      const audioTrack = mediaStreamRef.current
        .getAudioTracks()
        .find((track) => track.kind === "audio");
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (mediaStreamRef.current) {
      const videoTrack = mediaStreamRef.current
        .getVideoTracks()
        .find((track) => track.kind === "video");
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  const handleCall = () => {
    if (remotePeerIdValue && peerInstance.current) {
      const call = peerInstance.current.call(remotePeerIdValue, mediaStreamRef.current);
      call.on("stream", (remoteStream) => {
        remoteVideoRef.current.srcObject = remoteStream;
        remoteVideoRef.current.play().catch((error) =>
          console.error("Failed to play remote stream", error)
        );
      });
      setIsConnected(true);
    }
  };

  const handleHangup = () => {
    if (peerInstance.current) {
      peerInstance.current.destroy(); // Destroy the current peer connection
      setIsConnected(false);          // Update connection state
      setRemotePeerIdValue("");       // Clear the Peer ID input field

      // Create a new peer instance for future calls
      const newPeer = new Peer();
      newPeer.on("open", (id) => {
        setPeerId(id);
        console.log("Your new peer ID is:", id);
      });
      peerInstance.current = newPeer;
    }
  };

  useEffect(() => {
    getUserMedia();
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <h1>🎥 Video Chat</h1>
        <p>
          <span>Your Peer ID:</span>{" "}
          <span className="peer-id">{peerId ? peerId : "Connecting..."}</span>
        </p>
      </header>

      <div className="video-container">
        <div className="video-grid">
          <div className="video-wrapper">
            <video ref={currentUserVideoRef} autoPlay playsInline muted />
            <div className="video-overlay">
              <h2>Your Video</h2>
            </div>
          </div>
          <div className="video-wrapper">
            <video ref={remoteVideoRef} autoPlay playsInline />
            <div className="video-overlay">
              <h2>Remote Video</h2>
            </div>
          </div>
        </div>

        <div className="floating-controls">
          <button
            onClick={toggleAudio}
            className={`control-button ${isAudioMuted ? "muted" : ""}`}
            title={isAudioMuted ? "Unmute" : "Mute"}
          >
            <MicrophoneIcon className="h-5 w-5" />
          </button>
          <button
            onClick={toggleVideo}
            className={`control-button ${isVideoOff ? "off" : ""}`}
            title={isVideoOff ? "Turn On Video" : "Turn Off Video"}
          >
            <VideoCameraIcon className="h-5 w-5" />
          </button>
          {!isConnected ? (
            <button onClick={handleCall} className="control-button call">
              <PhoneIcon className="h-5 w-5" />
            </button>
          ) : (
            <button onClick={handleHangup} className="control-button hangup">
              <PhoneIcon className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {!isConnected && (
        <div className="peer-id-container">
          <input
            type="text"
            value={remotePeerIdValue}
            onChange={(e) => setRemotePeerIdValue(e.target.value)}
            placeholder="Enter remote peer ID"
            className="peer-id-input"
          />
        </div>
      )}
    </div>
  );
}

export default App;
