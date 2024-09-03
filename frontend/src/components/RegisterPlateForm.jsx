import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../api";
import "../styles/Form.css";
import logo from "../assets/unsaac_331.png";
import LoadingIndicator from "./LoadingIndicator";
import { FaCircleUser } from "react-icons/fa6";
import { ACCESS_TOKEN } from "../constants"; // Importa la constante del token
import { toast, ToastContainer } from 'react-toastify'; // Importa ToastContainer y toast
import "react-toastify/dist/ReactToastify.css"; // Importa los estilos de react-toastify

const RegisterPlateForm = () => {
  const [plateNumber, setPlateNumber] = useState("");
  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [occupation, setoccupation] = useState("");
  const [loading, setLoading] = useState(false); // Estado para gestionar la carga
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true); // Establece loading en true al iniciar el envío del formulario
    // Obtén el token de acceso del local storage
    const token = localStorage.getItem(ACCESS_TOKEN);
    // Verifica si todos los campos están llenos
    if (!plateNumber || !name || !lastName || !occupation) {
      toast.error('Todos los campos son obligatorios.');
      setLoading(false);
      return;
    }
    // Verifica si el token existe
    if (!token) {
      setMessage("No authorization token found");
      setLoading(false);
      return;
    }
    const data = {
      plate_number: plateNumber.toUpperCase(),
      name: name,
      last_name: lastName,
      occupation: occupation,
    };
    // Configura la solicitud con el token de autorización
    axios
      .post("/api/register_plate/", data, {
        headers: {
          Authorization: `Bearer ${token}`, // Incluye el token en los encabezados
        },
      })
      .then((response) => {
        setPlateNumber("");
        setName("");
        setLastName("");
        setoccupation("");
        toast.success('Placa registrada exitosamente!');
        setTimeout(() => {
          navigate('/admin');
        }, 1000);
      })
      .catch((error) => {
        console.error(error);
        toast.error('Ocurrió un error al registrar la placa.');
      })
      .finally(() => {
        setLoading(false); // Establece loading en false después de que la solicitud haya terminado
      });
  };

  return (
    <div>
      <div className="quarter-circle"></div>
      <div>
        <img src={logo} alt="Logo UNSAAC" className="imgLogo" />
      </div>
      {/*  */}
      <div className="container">
        <form onSubmit={handleSubmit} className="form-container">
          <div>
            <FaCircleUser size={100} />
          </div>
          <h1>Register Plate</h1>
          <input
            className="form-input"
            type="text"
            value={plateNumber}
            onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
            placeholder="Plate number"
          />
          <input
            className="form-input"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
          />
          <input
            className="form-input"
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Last name"
          />
          <input
            className="form-input"
            type="text"
            value={occupation}
            onChange={(e) => setoccupation(e.target.value)}
            placeholder="occupation"
          />
          {loading && <LoadingIndicator />}
          <button className="form-button" type="submit">
            {" "}
            Register{" "}
          </button>
          <h3 className="footer">
            Sistema de control de acceso vehicular UNSAAC
          </h3>
        </form>
      </div>
      <ToastContainer />
    </div>
  );
};

export default RegisterPlateForm;
