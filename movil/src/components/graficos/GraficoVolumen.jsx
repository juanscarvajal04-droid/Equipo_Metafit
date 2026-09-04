import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function isoWeek(fecha) {
  const d = new Date(`${String(fecha).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  const semana = 1 + Math.round(((d - week1) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
  return `${d.getFullYear()}W${String(semana).padStart(2, '0')}`;
}

export default function GraficoVolumen({ data = [] }) {
  const porSemana = {};
  data.forEach((r) => {
    const semana = isoWeek(r.fecha);
    if (!semana) return;
    porSemana[semana] = (porSemana[semana] || 0) + (Number(r.volumen) || 0);
  });

  const semanas = Object.keys(porSemana).sort().slice(-8);
  const valores = semanas.map((s) => porSemana[s]);
  if (semanas.length < 2 || valores.every((v) => v === 0)) return null;

  const chartWidth = SCREEN_WIDTH - SPACING.md * 4;

  return (
    <View style={{
      backgroundColor: COLORS.bgCard,
      borderRadius: BORDER_RADIUS.md,
      padding: SPACING.md,
      borderWidth: 1,
      borderColor: COLORS.border,
      marginBottom: SPACING.lg,
      ...SHADOWS.subtle,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm }}>
        <Ionicons name="barbell-outline" size={18} color={COLORS.purpleLight} style={{ marginRight: SPACING.sm }} />
        <Text style={{ color: COLORS.text, fontSize: FONTS.body, fontWeight: '700' }}>Volumen por semana</Text>
        <Text style={{ color: COLORS.textSecondary, fontSize: FONTS.xsmall, marginLeft: 'auto' }}>kg levantados</Text>
      </View>
      <BarChart
        data={{
          labels: semanas,
          datasets: [{ data: valores }],
        }}
        width={chartWidth}
        height={200}
        yAxisSuffix=""
        fromZero
        showValuesOnTopOfBars
        withInnerLines
        withOuterLines={false}
        chartConfig={{
          backgroundGradientFrom: COLORS.bgCard,
          backgroundGradientTo: COLORS.bgCard,
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(139, 92, 246, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity * 0.5})`,
          propsForBackgroundLines: { stroke: 'rgba(255,255,255,0.08)' },
          style: { borderRadius: BORDER_RADIUS.md },
        }}
      />
    </View>
  );
}