import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING } from '../../theme';

// Barra de progreso del agua con meta visible: 2L (8 vasos de 250 ml).
export default function BarraAgua({ actual = 0, meta = 8, volumenPorVaso = 0.25 }) {
  const vasos = Math.min(Math.max(Number(actual) || 0, 0), meta);
  const litros = (vasos * volumenPorVaso).toFixed(1).replace('.', ',');
  const metaL = (meta * volumenPorVaso).toFixed(0);
  const progress = meta > 0 ? vasos / meta : 0;

  return (
    <View>
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: SPACING.sm,
        marginBottom: SPACING.xs,
      }}>
        <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: FONTS.small }}>
          {vasos} de {meta} vasos · {litros} L
        </Text>
        <Text style={{ color: '#fff', fontSize: FONTS.small, fontWeight: '600' }}>
          Meta: {metaL} L ({meta} vasos)
        </Text>
      </View>

      <View style={{
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255,255,255,0.18)',
        overflow: 'hidden',
      }}>
        <View style={{
          width: `${progress * 100}%`,
          height: '100%',
          borderRadius: 4,
          backgroundColor: progress >= 1 ? COLORS.check : COLORS.water,
        }} />
      </View>

      {progress >= 1 && (
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: SPACING.xs,
        }}>
          <Ionicons name="checkmark-circle" size={14} color={COLORS.check} style={{ marginRight: SPACING.xs }} />
          <Text style={{ color: COLORS.check, fontSize: FONTS.xsmall, fontWeight: '600' }}>
            Meta de agua cumplida
          </Text>
        </View>
      )}
    </View>
  );
}