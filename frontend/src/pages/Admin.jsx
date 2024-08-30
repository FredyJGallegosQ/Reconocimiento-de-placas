import { useState, useEffect, useRef } from "react";
import "../styles/Admin.css";
import info from "../assets/InfoLogo.jpg";
import unsaac331 from "../assets/unsaac_331.png";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants";
import LiveCamera from "../components/LiveCamera";

function Admin() {
  const [activeTab, setActiveTab] = useState("live");
  const videoRef = useRef(null);
  const [recognizedPlates, setRecognizedPlates] = useState([]);
  const handlePlatesRecognized = (plates) => {
    setRecognizedPlates(prevPlates => {
      // Aquí puedes filtrar placas duplicadas si es necesario
      const newPlates = plates.filter(plate => !prevPlates.includes(plate));
      return [...prevPlates, ...newPlates];
    });
  };
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
              {/* <video ref={videoRef} autoPlay></video> */}
              <LiveCamera onPlatesRecognized={handlePlatesRecognized} />
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
                  {recognizedPlates.map((plate, index) => (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td>{plate}</td>
                      <td></td>{" "}
                      {/* Aquí puedes agregar el nombre del propietario si lo tienes */}
                      <td></td>{" "}
                      {/* Aquí puedes agregar el estado si lo tienes */}
                      <td>{new Date().toLocaleTimeString()}</td>{" "}
                      {/* Hora actual */}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      case "report":
        return (
          <div className="report-container">
            <div className="report-table">
              <table>
                <thead>
                  <tr>
                    <th>Placa</th>
                    <th>Nombre propietario</th>
                    <th>Cargo</th>
                    <th>Estado</th>
                    <th>Observación</th>
                    <th>Fecha</th>
                    <th>Hora</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Agrega las filas con los datos de la tabla aquí */}
                  <tr>
                    <td>XYZ789</td>
                    <td>María García</td>
                    <td>Empleado</td>
                    <td>Permitido</td>
                    <td>Ninguna</td>
                    <td>2024-08-09</td>
                    <td>14:30</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="export-button-container">
              <button className="export-button">Exportar</button>
            </div>
          </div>
        );
      case "search":
        return (
          <div className="search-container">
            <h2>Búsqueda Personalizada</h2>
            <table>
              <thead>
                <tr>
                  <th>Placa</th>
                  <th>Fecha</th>
                  <th>Hora</th>
                  <th>Resultado</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>XYZ789</td>
                  <td>2024-08-09</td>
                  <td>14:30</td>
                  <td>Permitido</td>
                </tr>
              </tbody>
            </table>
          </div>
        );
      default:
        return null;
    }
  };

  const handleLogout = () => {
    // Limpiar los tokens de almacenamiento local
    localStorage.removeItem(ACCESS_TOKEN);
    localStorage.removeItem(REFRESH_TOKEN);
    // Aquí puedes agregar la lógica de cierre de sesión, como limpiar el estado o redirigir al login
    window.location.href = "/login";
  };
  const handleRegister = () => {
    window.location.href = "/register";
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
        <button
          className={activeTab === "report" ? "active-button" : ""}
          onClick={() => setActiveTab("report")}
        >
          Reporte
        </button>
        <button
          className={activeTab === "search" ? "active-button" : ""}
          onClick={() => setActiveTab("search")}
        >
          Búsqueda personalizada
        </button>
        <button className="logout-button" onClick={handleRegister}>
          Registrar
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

export default Admin;
