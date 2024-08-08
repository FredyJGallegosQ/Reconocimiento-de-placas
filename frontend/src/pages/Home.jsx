import { useState, useEffect, useRef } from "react";
import api from "../api";
import "../styles/Home.css";
import info from "../assets/InfoLogo.jpg";
import unsaac331 from "../assets/unsaac_331.png";

function Home() {
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
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
          <button>Reporte</button>
          <button>Búsqueda personalizada</button>
          <button>Cerrar sesión</button>
        </nav>
        <body>
          <div class="container">
            <div class="box video-box">
              <video ref={videoRef} autoPlay></video>
            </div>
            <div class="box information-box"></div>
          </div>
        </body>
        <footer className="footer">
          <p>© 2024 UNSAAC. Todos los derechos reservados.</p>
        </footer>
      </div>
    </div>
  );
}

export default Home;
