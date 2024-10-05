import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../api";
import "../styles/Form.css";
import logo from "../assets/unsaac_331.png";
import LoadingIndicator from "./LoadingIndicator";
import { FaCar } from "react-icons/fa";
import { ACCESS_TOKEN } from "../constants"; // Importa la constante del token
import { toast, ToastContainer } from "react-toastify"; // Importa ToastContainer y toast
import "react-toastify/dist/ReactToastify.css"; // Importa los estilos de react-toastify

const RegisterPlateForm = () => {
  // Estados para los nuevos campos y los anteriores
  const [plateNumber, setPlateNumber] = useState("");
  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [type, setType] = useState(""); // Cambiado de 'type' a 'type'
  const [dependence, setDependence] = useState("");
  const [voucher, setVoucher] = useState("");
  const [model, setModel] = useState("");
  const [color, setColor] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false); // Estado para gestionar la carga
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true); // Establece loading en true al iniciar el envío del formulario
    const token = localStorage.getItem(ACCESS_TOKEN);

    // Verifica si todos los campos están llenos
    if (
      !plateNumber ||
      !name ||
      !lastName ||
      !type ||
      !dependence ||
      !voucher ||
      !model ||
      !color ||
      !phone
    ) {
      toast.error("Todos los campos son obligatorios.");
      setLoading(false);
      return;
    }

    // Verifica si el token existe
    if (!token) {
      toast.error("No authorization token found");
      setLoading(false);
      return;
    }

    // Datos del formulario
    const data = {
      plate_number: plateNumber.toUpperCase(),
      name: name,
      last_name: lastName,
      type: type,
      dependence: dependence,
      voucher: voucher,
      model: model,
      color: color,
      phone: phone,
    };

    // Configura la solicitud con el token de autorización
    axios
      .post("/api/register_plate/", data, {
        headers: {
          Authorization: `Bearer ${token}`, // Incluye el token en los encabezados
        },
      })
      .then((response) => {
        // Limpia los campos del formulario
        setPlateNumber("");
        setName("");
        setLastName("");
        setType("");
        setDependence("");
        setVoucher("");
        setModel("");
        setColor("");
        setPhone("");
        toast.success("Placa registrada exitosamente!");
        setTimeout(() => {
          navigate("/admin");
        }, 1000);
      })
      .catch((error) => {
        console.error(error);
        toast.error("Ocurrió un error al registrar la placa.");
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
      <div className="container">
        <form onSubmit={handleSubmit} className="form-container-plate">
          <div>
            <FaCar size={75} />
          </div>
          <h1>Registrar Placa</h1>
          <div className="form-columns">
            <div className="form-column">
              <input
                className="form-input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nombres"
              />
              <input
                className="form-input"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Apellidos"
              />
              <input
                className="form-input"
                type="text"
                value={type}
                onChange={(e) => setType(e.target.value)}
                placeholder="Tipo"
              />
              <input
                className="form-input"
                type="text"
                value={dependence}
                onChange={(e) => setDependence(e.target.value)}
                placeholder="Dependencia"
              />
              <input
                className="form-input"
                type="text"
                value={voucher}
                onChange={(e) => setVoucher(e.target.value)}
                placeholder="Comprobante de caja"
              />
              
            </div>
            <div className="form-column">
            <input
                className="form-input"
                type="text"
                value={plateNumber}
                onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
                placeholder="Número de placa"
              />
              <input
                className="form-input"
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="Marca - Modelo"
              />
              <input
                className="form-input"
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="Color"
              />
              <input
                className="form-input"
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Celular"
              />
            </div>
          </div>
          {loading && <LoadingIndicator />}
          <button className="form-button" type="submit">
            Registrar
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
