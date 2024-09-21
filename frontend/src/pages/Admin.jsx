import { useState, useEffect, useRef } from "react";
import "../styles/Admin.css";
import info from "../assets/InfoLogo.jpg";
import unsaac331 from "../assets/unsaac_331.png";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants";
import LiveCamera from "../components/LiveCamera";
import axios from "axios";
import * as XLSX from 'xlsx';

function Admin() {
  const [activeTab, setActiveTab] = useState("live");
  const videoRef = useRef(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [registeredPlates, setRegisteredPlates] = useState([]);
  const [users, setUsers] = useState([]);
  const [plateRecords, setPlateRecords] = useState([]);

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
      // Fetch plate records for today
      const fetchPlateRecordsToday = async () => {
        try {
          const token = localStorage.getItem(ACCESS_TOKEN);
          const response = await axios.get(
            `http://localhost:8000/api/plate_report/`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          // Filtrar los registros por la fecha actual
          console.log("data--> ", response.data);
          const today = new Date().toISOString().split("T")[0]; // Formato: YYYY-MM-DD
          const recordsToday = response.data.filter((record) => {
            const recordDate = new Date(record.recognized_at);
            const recordDateString = recordDate.toISOString().split("T")[0]; // Formato: YYYY-MM-DD

            console.log("Registro:", record);
            console.log("Fecha registrada:", recordDateString);
            console.log("Hoy (today):", today);

            return recordDateString === today; // Comparación
          });
          console.log("placas de oy", recordsToday);
          setPlateRecords(recordsToday);
        } catch (error) {
          console.error(
            "Error al obtener los registros de placas para hoy",
            error
          );
        }
      };
      fetchPlateRecordsToday();
      // Configura el intervalo para actualizar cada segundo
      const intervalId = setInterval(fetchPlateRecordsToday, 1000);

      // Limpieza del intervalo al desmontar el componente o cambiar de pestaña
      return () => clearInterval(intervalId);
    } else if (activeTab === "registered_plates") {
      const fetchRegisteredPlates = async () => {
        try {
          const token = localStorage.getItem(ACCESS_TOKEN); // Cambia según dónde guardes tu token
          const response = await axios.get(
            "http://localhost:8000/api/registered_plates/",
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
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
    } else if (activeTab === "personal_registered") {
      const fetchUsers = async () => {
        try {
          const token = localStorage.getItem(ACCESS_TOKEN);
          const response = await axios.get("http://localhost:8000/api/users/", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          setUsers(response.data);
        } catch (error) {
          console.error("Error al obtener usuarios", error);
        }
      };
      fetchUsers();
    } else if (activeTab === "report") {
      const fetchPlateRecords = async () => {
        try {
          const token = localStorage.getItem(ACCESS_TOKEN);
          const response = await axios.get(
            "http://localhost:8000/api/plate_report/",
            {
              // Ajusta la URL según tu API
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          setPlateRecords(response.data);
          console.log("Report data response:", response.data);
        } catch (error) {
          console.error(
            "Error al obtener registros de reconocimiento de placas",
            error
          );
        }
      };
      fetchPlateRecords();
    }
  }, [activeTab]);

  const renderContent = () => {
    switch (activeTab) {
      case "live":
        return (
          <div className="live-container">
            <div className="video-box">
              {/* <video ref={videoRef} autoPlay></video> */}
              <LiveCamera />
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
                  {plateRecords.map((record, index) => (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td>{record.plate_number}</td>
                      <td>{record.name}</td>
                      <td>{record.occupation}</td>
                      <td>
                        {new Date(record.recognized_at).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      case "report":
        return (
          <div>
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
                    {plateRecords.map((record, index) => {
                      const date = new Date(record.recognized_at);
                      const formattedDate = `${date.getFullYear()}-${(
                        "0" +
                        (date.getMonth() + 1)
                      ).slice(-2)}-${("0" + date.getDate()).slice(-2)}`;
                      const formattedTime = `${("0" + date.getHours()).slice(
                        -2
                      )}:${("0" + date.getMinutes()).slice(-2)}:${(
                        "0" + date.getSeconds()
                      ).slice(-2)}`;
                      return (
                        <tr key={index}>
                          <td>{index + 1}</td>
                          <td>{record.plate_number}</td>
                          <td>{record.name}</td>
                          <td>{record.last_name}</td>
                          <td>{record.occupation}</td>
                          <td>{record.observation || ""}</td>
                          <td>{formattedDate}</td>
                          <td>{formattedTime}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="export-container">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
              <button onClick={handleFilter}>Filtrar</button>
              <button className="export-button" onClick={handleExport}>Exportar</button>
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
                      <td>
                        {new Date(plate.registered_at).toLocaleDateString()}
                      </td>
                      <td>
                        {new Date(plate.registered_at).toLocaleTimeString()}
                      </td>
                      <td>
                        <button
                          onClick={() => handleDeletePlate(plate.plate_number)}
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      case "personal_registered":
        return (
          <div className="personal-registered-container">
            <div className="personal-registered-table">
              <table>
                <thead>
                  <tr>
                    <th>Usuario</th>
                    <th>Admin</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, index) => (
                    <tr key={index}>
                      <td>{user.username}</td>
                      <td>{user.is_admin ? "Sí" : "No"}</td>
                      <td>
                        <button onClick={() => handleDeleteUser(user.username)}>
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
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
      const response = await axios.delete(
        `http://localhost:8000/api/delete_plate/${plateNumber}/`
      );
      console.log("Plate deleted successfully", response);
      // Actualizar el estado local para reflejar el cambio
      setRegisteredPlates((prevPlates) =>
        prevPlates.filter((plate) => plate.plate_number !== plateNumber)
      );
    } catch (error) {
      console.error("Error deleting plate:", error);
    }
  };
  const handleDeleteUser = async (username) => {
    try {
      const token = localStorage.getItem(ACCESS_TOKEN);
      await axios.delete(`http://localhost:8000/api/delete_user/${username}/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUsers((prevUsers) =>
        prevUsers.filter((user) => user.username !== username)
      );
    } catch (error) {
      console.error("Error al eliminar usuario:", error);
    }
  };

  const handleFilter = async () => {
    try {
      const token = localStorage.getItem(ACCESS_TOKEN);
      const response = await axios.get(
        `http://localhost:8000/api/plate_report/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const filteredRecords = response.data.filter((record) => {
        const recordDate = new Date(record.recognized_at);
        return (
          recordDate >= new Date(startDate) && recordDate <= new Date(endDate)
        );
      });

      setPlateRecords(filteredRecords);
    } catch (error) {
      console.error("Error al obtener los registros filtrados", error);
    }
  };

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(plateRecords);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Placas");

    XLSX.writeFile(wb, "placas.xlsx");
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
      <div className="container">{renderContent()}</div>
      <footer className="footer">
        <p>© 2024 UNSAAC. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}

export default Admin;
