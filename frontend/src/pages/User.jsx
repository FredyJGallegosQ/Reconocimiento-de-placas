import { useState, useEffect, useRef } from "react";
import "../styles/Home.css";
import info from "../assets/InfoLogo.jpg";
import unsaac331 from "../assets/unsaac_331.png";

function User() {
  const videoRef = useRef(null);
  useEffect(() => {
    const startVideo = async () => {
      try {
        const steam = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = steam;
        }
      } catch (err) {
        console.err("Error al acceder a la cámara", err);
      }
    };
    startVideo();
  }, []);
  return (
    <div>
      <header className="header">
        <div className="left-header">
          <img src={info} alt="Info Logo" className="logo" />
          <h1 className="title">
            Sistema de control de <br /> acceso vehicular UNSAAC
          </h1>
        </div>
        <div className="right-header">
          <img src={unsaac331} alt="UNSAAC Logo" className="unsaac-logo" />
        </div>
      </header>
      <nav className="nav">
        <button>EN VIVO</button>
        <div className="logout-container">
          <button className="logout-button">Cerrar sesión</button>
        </div>
      </nav>
      <div className="container">
        <div className="box video-box">
          <video ref={videoRef} autoPlay></video>
        </div>
        <div className="box information-box"></div>
      </div>
      <footer className="footer">
        <p>© 2024 UNSAAC. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}

export default User;