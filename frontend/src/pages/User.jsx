import { useState, useEffect, useRef } from "react";
import "../styles/Admin.css";
import info from "../assets/InfoLogo.jpg";
import unsaac331 from "../assets/unsaac_331.png";

function User() {
  const [activeTab, setActiveTab] = useState("live");
  const videoRef = useRef(null);
  useEffect(() => {
    if (activeTab === "live") {
      const startVideo = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
          });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (err) {
          console.error("Error al acceder a la cámara", err);
        }
      };
      startVideo();
    }
  }, [activeTab]);
  const renderContent = () => {
    switch (activeTab) {
      case "live":
        return (
          <div className="live-container">
            <div className="video-box">
              <video ref={videoRef} autoPlay></video>
            </div>
            <div className="table-box">
              <table>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Placa</th>
                    <th>Nombre propietario</th>
                    <th>Estado</th>
                    <th>Hora</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Agrega las filas con los datos de la tabla aquí */}
                  <tr>
                    <td>1</td>
                    <td>ABC123</td>
                    <td>Juan Pérez</td>
                    <td>14:00</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const handleLogout = () => {
    // Aquí puedes agregar la lógica de cierre de sesión, como limpiar el estado o redirigir al login
    window.location.href = "/login";
  };
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
        <button
          className={activeTab === "live" ? "active-button" : ""}
          onClick={() => setActiveTab("live")}
        >
          EN VIVO
        </button>
        <div className="logout-container">
          <button className="logout-button" onClick={handleLogout}>
            Cerrar sesión
          </button>
        </div>
      </nav>
      <div className="container">{renderContent()}</div>
      <footer className="footer">
        <p>© 2024 UNSAAC. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}

export default User;
