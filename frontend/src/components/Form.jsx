import { useState } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants";
import "../styles/Form.css";
import LoadingIndicator from "./LoadingIndicator";
import logo from "../assets/unsaac_331.png";
import { FaCircleUser } from "react-icons/fa6";

function Form({ route, method }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const name = method === "login" ? "Login  " : "Register";

  const handleSubmit = async (e) => {
    setLoading(true);
    e.preventDefault();
    try {
      const res = await api.post(route, {
        username,
        password,
        is_admin: isAdmin,
        is_user: !isAdmin,
      });
      if (method === "login") {
        localStorage.setItem(ACCESS_TOKEN, res.data.access);
        localStorage.setItem(REFRESH_TOKEN, res.data.refresh);
        console.log(res);
        if (res.data.is_admin) {
          navigate("/admin");
        } else {
          navigate("/user");
        }
      } else {
        navigate("/admin");
      }
    } catch (error) {
      alert(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="quarter-circle"></div>
      <div>
        <img src={logo} alt="Logo UNSAAC" className="imgLogo" />
      </div>

      <div className="container">
        <form onSubmit={handleSubmit} className="form-container">
          <div>
            <FaCircleUser size={100} />
          </div>
          <h1>{name}</h1>
          <input
            className="form-input"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
          />
          <input
            className="form-input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
          />
          {method === "register" && (
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={isAdmin}
                onChange={(e) => setIsAdmin(e.target.checked)}
              />
              Administrador
            </label>
          )}
          {loading && <LoadingIndicator />}
          <button className="form-button" type="submit">
            {" "}
            {name}{" "}
          </button>
          <h3 className="footer">
            Sistema de control de acceso vehicular UNSAAC
          </h3>
        </form>
      </div>
    </div>
  );
}

export default Form;
