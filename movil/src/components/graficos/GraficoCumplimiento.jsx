import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function GraficoCumplimiento({ registrosConsumo = [] }) {
  const pares = new Set(registrosConsumo.map((c) => `${c.fecha}|${c.num_comida}`));
  const fechas = new Set(registrosConsumo.map((c) => c.fecha));
  const registradas = pares.size;
  const esperadas = fechas.size * 4;
  const cumplimiento = esperadas > 0 ? Math.min(100, Math.round((registradas / esperadas) * 100)) : 0;

  if (registradas === 0) return null;

  const chartSize = Math.min(SCREEN_WIDTH - 96, 220);
  const holeSize = chartSize * 0.55;

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
        <Ionicons name="restaurant-outline" size={18} color={COLORS.check} style={{ marginRight: SPACING.sm }} />
        <Text style={{ color: COLORS.text, fontSize: FONTS.body, fontWeight: '700' }}>Cumplimiento nutricional</Text>
      </View>

      <View style={{ alignItems: 'center' }}>
        <PieChart
          data={[
            { name: 'Cumplido', population: cumplimiento, color: COLORS.check, legendFontColor: COLORS.text },
            { name: 'Pendiente', population: Math.max(1, 100 - cumplimiento), color: 'rgba(255,255,255,0.12)', legendFontColor: COLORS.text },
          ]}
          width={chartSize}
          height={chartSize}
          accessor="population"
          backgroundColor="transparent"
          hasLegend={false}
          absolute={false}
        />
        <View pointerEvents="none" style={{
          position: 'absolute',
          top: (chartSize - holeSize) / 2,
          left: (chartSize - holeSize) / 2,
          width: holeSize,
          height: holeSize,
          borderRadius: holeSize / 2,
          backgroundColor: COLORS.bgCard,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Text style={{ color: COLORS.text, fontSize: FONTS.subtitle, fontWeight: '800' }}>{cumplimiento}%</Text>
          <Text style={{ color: COLORS.textMuted, fontSize: FONTS.xsmall, marginTop: 2 }}>completado</Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: SPACING.sm, gap: SPACING.lg }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.check, marginRight: SPACING.xs }} />
          <Text style={{ color: COLORS.textSecondary, fontSize: FONTS.xsmall }}>
            {registradas} comidas registradas
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.12)', marginRight: SPACING.xs }} />
          <Text style={{ color: COLORS.textSecondary, fontSize: FONTS.xsmall }}>
            {esperadas} esperadas
          </Text>
        </View>
      </View>
    </View>
  );
}