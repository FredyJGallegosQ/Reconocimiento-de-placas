import { useState, useEffect, useRef } from "react";
import "../styles/Admin.css";
import info from "../assets/InfoLogo.jpg";
import unsaac331 from "../assets/unsaac_331.png";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants";
import LiveCamera from "../components/LiveCamera";
import axios from "axios";
function User() {
  const [activeTab, setActiveTab] = useState("live");
  const videoRef = useRef(null);
  const [plateRecords, setPlateRecords] = useState([]);

  useEffect(() => {
    if (activeTab === "live") {
      // const startVideo = async () => {
      //   try {
      //     const stream = await navigator.mediaDevices.getUserMedia({
      //       video: true,
      //     });
      //     if (videoRef.current) {
      //       videoRef.current.srcObject = stream;
      //     }
      //   } catch (err) {
      //     console.error("Error al acceder a la cámara", err);
      //   }
      // };
      // startVideo();
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
          console.log("placas de hoy", recordsToday);
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
            <div>
              <button className="recognition-button" onClick={handleManualRecognition}>
                Reconocer Placa Manualmente
              </button>
            </div>
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
                      <td>{record.type}</td>
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
  const handleManualRecognition = () => {
    const video = document.querySelector("video");
    if (!video) return;
  
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  
    canvas.toBlob((blob) => {
      const formData = new FormData();
      formData.append("frame", blob);
  
      const headers = {
        Authorization: `Bearer ${localStorage.getItem(ACCESS_TOKEN)}`,
        "Content-Type": "multipart/form-data",
      };
  
      axios
        .post("http://localhost:8000/api/recognize_plate/", formData, { headers })
        .then((response) => {
          console.log("Placas reconocidas:", response.data.plate_numbers);

          // 🔹 Llamar directamente a la API de registros después del reconocimiento
          return axios.get("http://localhost:8000/api/plate_report/", { headers });
        })
        .then((response) => {
          console.log("Registros de placas:", response.data);

          // Filtrar los registros por la fecha actual
          const today = new Date().toISOString().split("T")[0]; // Formato: YYYY-MM-DD
          const recordsToday = response.data.filter((record) => {
            const recordDate = new Date(record.recognized_at);
            const recordDateString = recordDate.toISOString().split("T")[0]; // Formato: YYYY-MM-DD

            return recordDateString === today; // Comparación de fecha
          });

          console.log("Registros de hoy:", recordsToday);

          // 🔹 Aquí puedes actualizar el estado si lo necesitas
          setPlateRecords(recordsToday);
        })
        .catch((err) => {
          console.error("Error en el reconocimiento manual:", err);
        });
      
    }, "image/jpeg");
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
