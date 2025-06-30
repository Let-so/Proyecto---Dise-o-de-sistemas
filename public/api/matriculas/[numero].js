// api/matriculas/[numero].js

import matriculas from '../data.json'


export default function handler(req, res) {
  const { numero } = req.query;

  // Sólo permitimos GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  // Validamos que venga el parámetro
  if (!numero) {
    return res.status(400).json({ error: 'Se requiere el número de matrícula' });
  }

  // Hacemos la búsqueda en nuestro stub local
  const registro = matriculas.find(
    (m) => m.numero.toUpperCase() === String(numero).toUpperCase()
  );

  if (!registro) {
    return res.status(404).json({ error: 'Matrícula no encontrada' });
  }

  // Desestructuramos sólo los campos que queremos exponer
  const { numero: num, habilitada, nombre, especialidad, entidad_que_emite } = registro;

  return res.status(200).json({
    numero: num,
    habilitada,
    nombre,
    especialidad,
    entidad_que_emite,
  });
}

