// public/api/matriculas/[numero].js

import matriculas from './data.json'  // ⬅ ruta corregida: JSON al mismo nivel

export default function handler(req, res) {
  const { numero } = req.query;

  // Sólo GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  // Parámetro obligatorio
  if (!numero) {
    return res.status(400).json({ error: 'Se requiere el número de matrícula' });
  }

  // Buscar en el stub
  const registro = matriculas.find(
    m => m.numero.toUpperCase() === String(numero).toUpperCase()
  );

  if (!registro) {
    return res.status(404).json({ error: 'Matrícula no encontrada' });
  }

  // Solo le devolvemos los campos que queremos exponer
  const { numero: num, habilitada, nombre, especialidad, entidad_que_emite } = registro;

  return res.status(200).json({
    numero: num,
    habilitada,
    nombre,
    especialidad,
    entidad_que_emite
  });
}
