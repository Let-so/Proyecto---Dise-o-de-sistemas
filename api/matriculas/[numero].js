// api/matriculas/[numero].js
import matriculas from '../../data/matriculas.json';

export default function handler(req, res) {
  const { numero } = req.query;

  // Buscamos en nuestro "stub"
  const registro = matriculas.find(m => m.numero.toUpperCase() === numero.toUpperCase());
  if (!registro) {
    return res.status(404).json({ error: 'Matrícula no encontrada' });
  }

  // Devolvemos sólo los campos que necesitemos
  const { numero: num, habilitada, nombre, especialidad, entidad_que_emite } = registro;
  return res.status(200).json({ numero: num, habilitada, nombre, especialidad, entidad_que_emite });
}
