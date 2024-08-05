import cv2

def process_frame(frame):
    # Convierte la imagen a escala de grises (ejemplo)
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    # Aquí puedes agregar el código para el reconocimiento de placas
    return gray