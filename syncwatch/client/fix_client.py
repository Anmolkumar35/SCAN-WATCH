code = """import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";

export default function WatchRoomPage({ roomId, username, onLeave }) {
  const [videoUrl, setVideoUrl] = useState("https://www.w3schools.com/html/mov_bbb.mp4");
  const [inputUrl, setInputUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");

  const socketRef = useRef(null);
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);
  const isRemote = useRef(false);

  // Automatically use laptop's IP if opened from phone
  const serverBase = `http://${window.location.hostname}:5000`;

  useEffect(() => {
    const socket = io(serverBase);
    socketRef.current = socket;
    socket.emit("join-room", { roomId, username });

    socket.on("sync-video", ({ action, currentTime, videoUrl: remoteUrl }) => {
      if (remoteUrl && remoteUrl !== videoUrl) setVideoUrl(remoteUrl);
      if (videoRef.current) {
        isRemote.current = true;
        videoRef.current.currentTime = currentTime;
        if (action === "play") videoRef.current.play();
        if (action === "pause") videoRef.current.pause();
        setTimeout(() => { isRemote.current = false; }, 300);
      }
    });

    return () => socket.disconnect();
  }, [roomId, videoUrl, serverBase]);

  const sendSync = (action) => {
    if (isRemote.current || !videoRef.current) return;
    socketRef.current?.emit("sync-video", {
      roomId,
      action,
      currentTime: videoRef.current.currentTime,
      videoUrl,
    });
  };

  const handleLoad = () => {
    if (!inputUrl.trim()) return;
    const url = inputUrl.trim();
    setVideoUrl(url);
    socketRef.current?.emit("sync-video", {
      roomId,
      action: "pause",
      currentTime: 0,
      videoUrl: url,
    });
    setInputUrl("");
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("video", file);

    try {
      setIsUploading(true);
      setUploadStatus("Uploading video to room...");

      const response = await fetch(`${serverBase}/api/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success && data.videoUrl) {
        // Replace localhost in URL with actual host so phone can stream it
        const finalUrl = data.videoUrl.replace("localhost", window.location.hostname);
        setVideoUrl(finalUrl);
        setUploadStatus("Uploaded successfully!");

        socketRef.current?.emit("sync-video", {
          roomId,
          action: "pause",
          currentTime: 0,
          videoUrl: finalUrl,
        });
      } else {
        setUploadStatus("Upload failed. Try again.");
      }
    } catch (err) {
      console.error(err);
      setUploadStatus("Error uploading file.");
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadStatus(""), 4000);
    }
  };

  return (