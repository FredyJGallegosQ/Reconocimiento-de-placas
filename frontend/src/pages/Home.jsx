import { useState, useEffect, useRef } from "react";
import api from "../api";
import Note from "../components/Note";
import "../styles/Home.css";
import info from "../assets/InfoLogo.jpg";
import unsaac331 from "../assets/unsaac_331.png";

function Home() {
  const [notes, setNotes] = useState([]);
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const videoRef = useRef(null);
  useEffect(() => {
    // getNotes();
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

  const getNotes = () => {
    api
      .get("/api/notes/")
      .then((res) => res.data)
      .then((data) => {
        setNotes(data);
        console.log(data);
      })
      .catch((err) => alert(err));
  };

  const deleteNote = (id) => {
    api
      .delete(`/api/notes/delete/${id}/`)
      .then((res) => {
        if (res.status === 204) alert("Note deleted");
        else alert("Failed to delete note");
      })
      .catch((error) => alert(error));
    getNotes();
  };

  const createNote = (e) => {
    e.preventDefault();
    api
      .post("/api/notes/", { content, title })
      .then((res) => {
        if (res.status === 201) alert("Note created!");
        else alert("Failed to make note");
      })
      .catch((err) => alert(err));
    getNotes();
  };
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
        {/* ssssssssss */}
      </div>
      <div>
        <h2>Notes</h2>
        {notes.map((note) => (
          <Note note={note} onDelete={deleteNote} key={note.id} />
        ))}
      </div>
      <div>Logout</div>
      <h2>Create Note</h2>
      <form onSubmit={createNote}>
        <label htmlFor="title">Title:</label>
        <br />
        <input
          type="text"
          id="title"
          name="title"
          required
          onChange={(e) => setTitle(e.target.value)}
          value={title}
        />
        <label htmlFor="content">Content:</label>
        <br />
        <textarea
          id="content"
          name="content"
          required
          value={content}
          onChange={(e) => setContent(e.target.value)}
        ></textarea>
        <br />
        <input type="submit" value="Submit" />
      </form>
    </div>
  );
}

export default Home;
