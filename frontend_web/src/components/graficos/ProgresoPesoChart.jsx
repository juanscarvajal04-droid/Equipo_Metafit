// ============================================================
// src/components/graficos/ProgresoPesoChart.jsx
// Evolución de peso e IMC de un afiliado (Línea, chart.js).
// ============================================================

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { calcularEvolucion } from "../../services/progresoService";
import styles from "./Graficos.module.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
  Filler
);

export default function ProgresoPesoChart({ historial = [] }) {
  const { etiquetas, pesos, imcs } = calcularEvolucion(historial);
  const tieneDatos = pesos.some((p) => p != null);

  const data = {
    labels: etiquetas,
    datasets: [
      {
        label: "Peso (kg)",
        data: pesos,
        borderColor: "rgb(37, 99, 235)",
        backgroundColor: "rgba(37, 99, 235, 0.12)",
        fill: true,
        tension: 0.3,
        pointRadius: 4,
        spanGaps: true,
      },
      {
        label: "IMC",
        data: imcs,
        borderColor: "rgb(13, 202, 240)",
        backgroundColor: "rgba(13, 202, 240, 0.05)",
        tension: 0.3,
        pointRadius: 3,
        spanGaps: true,
        yAxisID: "yImc",
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "bottom" },
      tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y}` } },
    },
    scales: {
      y: { title: { display: true, text: "Peso (kg)" } },
      yImc: { position: "right", grid: { drawOnChartArea: false }, title: { display: true, text: "IMC" } },
    },
  };

  if (!tieneDatos) {
    return <div className={styles.vacio}>Sin datos de peso registrados</div>;
  }

  return (
    <div className={styles.chartWrap}>
      <Line data={data} options={options} />
    </div>
  );
}