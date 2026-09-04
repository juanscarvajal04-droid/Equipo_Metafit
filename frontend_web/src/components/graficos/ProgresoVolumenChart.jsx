// ============================================================
// src/components/graficos/ProgresoVolumenChart.jsx
// Evolución de medidas corporales (%) de un afiliado.
// Usa los campos de PROGRESO_FISICO (medidas + % grasa).
// ============================================================

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { calcularEvolucion } from "../../services/progresoService";
import styles from "./Graficos.module.css";

ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, Tooltip, Legend);

export default function ProgresoVolumenChart({ historial = [] }) {
  const { etiquetas, grasa } = calcularEvolucion(historial);
  const tieneDatos = grasa.some((g) => g != null);

  const medidas = [...historial]
    .filter((p) => p && p.fecha_registro)
    .sort((a, b) => new Date(a.fecha_registro) - new Date(b.fecha_registro))
    .map((p) => ({
      cintura: p.medida_cintura != null ? Number(p.medida_cintura) : null,
      brazo: p.medida_brazo != null ? Number(p.medida_brazo) : null,
      pierna: p.medida_pierna != null ? Number(p.medida_pierna) : null,
    }));

  if (!tieneDatos && medidas.every((m) => m.cintura == null && m.brazo == null && m.pierna == null)) {
    return <div className={styles.vacio}>Sin medidas corporales registradas</div>;
  }

  const data = {
    labels: etiquetas,
    datasets: [
      {
        label: "% grasa corporal",
        data: grasa,
        borderColor: "rgb(227, 28, 37)",
        backgroundColor: "rgba(227, 28, 37, 0.1)",
        fill: false,
        tension: 0.3,
        pointRadius: 4,
        spanGaps: true,
      },
      {
        label: "Cintura (cm)",
        data: medidas.map((m) => m.cintura),
        borderColor: "rgb(234, 88, 12)",
        tension: 0.3,
        pointRadius: 3,
        spanGaps: true,
      },
      {
        label: "Brazo (cm)",
        data: medidas.map((m) => m.brazo),
        borderColor: "rgb(22, 163, 74)",
        tension: 0.3,
        pointRadius: 3,
        spanGaps: true,
      },
      {
        label: "Pierna (cm)",
        data: medidas.map((m) => m.pierna),
        borderColor: "rgb(37, 99, 235)",
        tension: 0.3,
        pointRadius: 3,
        spanGaps: true,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: "bottom" } },
    scales: { y: { title: { display: true, text: "Medidas" } } },
  };

  return (
    <div className={styles.chartWrap}>
      <Line data={data} options={options} />
    </div>
  );
}