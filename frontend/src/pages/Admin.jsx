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
      const newPlates = plates.filter(plate => !prevPlates.some(p => p.plate_number === plate.plate_number));
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
                    <th>Nombre</th>
                    <th>Cargo</th>
                    <th>Hora</th>
                  </tr>
                </thead>
                <tbody>
                  {recognizedPlates.map((plate, index) => (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td>{plate.plate_number}</td>
                      <td>{plate.name}</td>
                      <td>{plate.occupation}</td>
                      <td>{new Date().toLocaleTimeString()}</td>
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
                    <th>Nombre</th>
                    <th>Apellido</th>
                    <th>Cargo</th>
                    <th>Observación</th>
                    <th>Fecha</th>
                    <th>Hora</th>
                  </tr>
                </thead>
                <tbody>
                {recognizedPlates.map((plate, index) => (
                    <tr>
                      <td>{plate.plate_number}</td>
                      <td>{plate.name}</td>
                      <td>{plate.last_name}</td>
                      <td>{plate.occupation}</td>
                      <td></td>
                      <td>{new Date().toLocaleDateString()}</td>
                      <td>{new Date().toLocaleTimeString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="export-button-container">
              <button className="export-button">Exportar</button>
            </div>
          </div>
        );
      case "registered_plates":
        return (
          <div className="search-container">
            <h2>Placas registradas</h2>
            <table>
              <thead>
                <tr>
                  <th>Placa</th>
                  <th>Nombre</th>
                  <th>Apellido</th>
                  <th>Cargo</th>
                  <th>Fecha</th>
                  <th>Hora</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>XYZ789</td>
                  <td>Fredy</td>
                  <td>Gallegos</td>
                  <td>Alumno</td>
                  <td>2024-08-09</td>
                  <td>14:30</td>
                </tr>
              </tbody>
            </table>
          </div>
        );
      case "personal_registered":
        return(
          <div>

          </div>
        )
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
  const handleRegisterPlate = () => {
    window.location.href = "/register_plate";
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
          className={activeTab === "registered_plates" ? "active-button" : ""}
          onClick={() => setActiveTab("registered_plates")}
        >
          Placas Registradas
        </button>
        <button
          className={activeTab === "personal_registered" ? "active-button" : ""}
          onClick={() => setActiveTab("personal_registered")}
        >
          Personal Registrado
        </button>
        <button className="logout-button" onClick={handleRegisterPlate}>
          Registrar Placa
        </button>
        <button className="logout-button" onClick={handleRegister}>
          Registrar Personal
        </button>
        <div className="logout-container">
          <button className="logout-button" onClick={handleLogout}>
            Cerrar sesión
          </button>
        </div>
      </nav>
      <div className="container">
        {renderContent()} 
      </div>
      <footer className="footer">
        <p>© 2024 UNSAAC. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}

export default Admin;
