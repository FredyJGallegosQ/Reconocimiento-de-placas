import React, { useRef, useEffect, useState } from 'react';
import axios from '../api';

const LiveCamera = () => {
  const videoRef = useRef(null);
  // const [recognizedPlates, setRecognizedPlates] = useState([]);

  useEffect(() => {
    // Pedir acceso a la cámara y mostrar el video
    let stream;
    const startVideo = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      } catch (err) {
        console.error("Error accessing the camera: ", err);
      }
    };

    startVideo();

    return () => {
      // Limpiar el stream cuando el componente se desmonte
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const captureFrameAndSend = () => {
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(blob => {
      const formData = new FormData();
      formData.append('frame', blob);

      const headers = {
        'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`, // Obtén el token JWT del almacenamiento local
        'Content-Type': 'multipart/form-data',
      };

      axios.post('/api/recognize_plate/', formData, { headers })
        .then(response => {
          const plates = response.data.plate_numbers; // Obtener la lista de placas
          // onPlatesRecognized(plates);
          // setRecognizedPlates(prevPlates => [...prevPlates, ...plates]); // Agregar nuevas placas a la lista existente
        })
        .catch(err => {
          if (err.response && err.response.status === 404) {
            //console.log("No plates detected (404)."); // Ignora el error 404 cuando no haya placas
          } else {
            console.error("Error recognizing plate: ", err); // Manejar otros errores
          }
        });
    }, 'image/jpeg');
  };

  useEffect(() => {
    const intervalId = setInterval(captureFrameAndSend, 100); // Capturar y enviar un frame cada 0.1 segundos
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div>
      <video ref={videoRef} style={{ width: '100%' }} />
    </div>
  );
};

export default LiveCamera;
