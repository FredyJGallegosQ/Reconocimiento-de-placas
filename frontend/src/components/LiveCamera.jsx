import React, { useRef, useEffect, useState } from 'react';
import Peer from 'simple-peer';

const LiveCamera = ({ signalServer }) => {
  const videoRef = useRef(null);
  const [peer, setPeer] = useState(null);

  useEffect(() => {
    const startVideo = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        const p = new Peer({
          initiator: true,
          trickle: false,
          stream: stream,
        });

        p.on('signal', data => {
          signalServer.send(JSON.stringify({ peerData: data }));
        });

        signalServer.onmessage = event => {
          const { peerData } = JSON.parse(event.data);
          p.signal(peerData);
        };

        setPeer(p);
      } catch (err) {
        console.error('Error al acceder a la cámara: ', err);
      }
    };

    startVideo();

    return () => {
      if (peer) {
        peer.destroy();
      }
    };
  }, [signalServer]);

  return (
    <div className="container">
      <div className="left-box">
        <video ref={videoRef} autoPlay />
      </div>
      <div className="right-box">
        {/* Otros contenidos aquí */}
      </div>
    </div>
  );
};

export default LiveCamera;