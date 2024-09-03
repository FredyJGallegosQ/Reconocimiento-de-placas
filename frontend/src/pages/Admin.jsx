import { useState, useEffect, useRef } from "react";
import "../styles/Admin.css";
import info from "../assets/InfoLogo.jpg";
import unsaac331 from "../assets/unsaac_331.png";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants";
import LiveCamera from "../components/LiveCamera";
import axios from 'axios';
import api from '../api';

function Admin() {
  const [activeTab, setActiveTab] = useState("live");
  const videoRef = useRef(null);
  const [recognizedPlates, setRecognizedPlates] = useState([]);
  const [registeredPlates, setRegisteredPlates] = useState([]);
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
    } else if (activeTab === "registered_plates") {
      const fetchRegisteredPlates = async () => {
        try {
          const token = localStorage.getItem(ACCESS_TOKEN); // Cambia según dónde guardes tu token
          const response = await axios.get('http://localhost:8000/api/registered_plates/', {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          console.log(response.data); // Verifica que esto es un array
          if (Array.isArray(response.data)) {
            setRegisteredPlates(response.data);
          } else {
            console.error("La respuesta no es un array", response.data);
          }
        } catch (error) {
          console.error("Error al obtener placas registradas", error);
        }
      };
      fetchRegisteredPlates();
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
                    <th>Nro</th>
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
                    <th>Nro</th>
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
                    <tr key={index}>
                      <td>{index + 1}</td>
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
          <div className="registered-plates-container">
            <div className="registered-plate-table">
              <table>
                <thead>
                  <tr>
                    <th>Nro</th>
                    <th>Placa</th>
                    <th>Nombre</th>
                    <th>Apellido</th>
                    <th>Cargo</th>
                    <th>Fecha</th>
                    <th>Hora</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {registeredPlates.map((plate, index) => (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td>{plate.plate_number}</td>
                      <td>{plate.name}</td>
                      <td>{plate.last_name}</td>
                      <td>{plate.occupation}</td>
                      <td>{new Date(plate.registered_at).toLocaleDateString()}</td>
                      <td>{new Date(plate.registered_at).toLocaleTimeString()}</td>
                      <td>
                      <button onClick={() => handleDeletePlate(plate.plate_number)}>Eliminar</button>
                    </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
  const handleDeletePlate = async (plateNumber) => {
    try {
        const response = await axios.delete(`http://localhost:8000/api/delete_plate/${plateNumber}/`);
        console.log("Plate deleted successfully", response);
        // Actualizar el estado local para reflejar el cambio
        setRegisteredPlates(prevPlates => prevPlates.filter(plate => plate.plate_number !== plateNumber));
    } catch (error) {
        console.error("Error deleting plate:", error);
    }
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
