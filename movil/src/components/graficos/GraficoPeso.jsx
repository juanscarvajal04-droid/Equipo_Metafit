import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const fechaCorta = (fecha) => {
  const partes = String(fecha || '').split('-');
  return partes.length >= 3 ? `${partes[2]}/${partes[1]}` : fecha;
};

export default function GraficoPeso({ data = [] }) {
  const puntos = data
    .filter((p) => p && Number(p.peso) > 0 && (p.fecha || p.created_at))
    .slice()
    .sort((a, b) => String(a.fecha || a.created_at).localeCompare(String(b.fecha || b.created_at)))
    .map((p) => ({
      valor: Number(p.peso),
      fecha: fechaCorta(p.fecha || p.created_at),
    }));

  if (puntos.length < 2) return null;

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
        <Ionicons name="analytics-outline" size={18} color={COLORS.purpleLight} style={{ marginRight: SPACING.sm }} />
        <Text style={{ color: COLORS.text, fontSize: FONTS.body, fontWeight: '700' }}>Evolución de peso</Text>
        <Text style={{ color: COLORS.textSecondary, fontSize: FONTS.xsmall, marginLeft: 'auto' }}>{puntos.length} registros</Text>
      </View>
      <LineChart
        data={{
          labels: puntos.map((p) => p.fecha),
          datasets: [{ data: puntos.map((p) => p.valor) }],
        }}
        width={chartWidth}
        height={200}
        bezier
        yAxisSuffix=" kg"
        yAxisInterval={1}
        fromZero={false}
        withInnerLines
        withOuterLines={false}
        chartConfig={{
          backgroundGradientFrom: COLORS.bgCard,
          backgroundGradientTo: COLORS.bgCard,
          decimalPlaces: 1,
          fillShadowGradient: COLORS.purple,
          fillShadowGradientOpacity: 0.25,
          color: (opacity = 1) => `rgba(167, 139, 250, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity * 0.5})`,
          propsForDots: { r: '4', strokeWidth: '2', stroke: COLORS.purpleDark },
          propsForBackgroundLines: { stroke: 'rgba(255,255,255,0.08)' },
          style: { borderRadius: BORDER_RADIUS.md },
        }}
      />
    </View>
  );
}