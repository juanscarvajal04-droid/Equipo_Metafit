import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../../theme';
import { formatearFechaLegible } from '../../utils/formateadores';

// Selector de ciclo compartido por las pantallas de dieta y rutina.
export default function CicloPicker({ ciclos, ciclo, showPicker, onToggle, onSelect }) {
  if (ciclos.length <= 1) return null;

  return (
    <>
      <TouchableOpacity
        onPress={onToggle}
        activeOpacity={0.7}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: 'rgba(255,255,255,0.15)',
          borderRadius: BORDER_RADIUS.md,
          padding: SPACING.sm,
          marginTop: SPACING.sm,
        }}
      >
        <Ionicons name="swap-horizontal" size={16} color="rgba(255,255,255,0.7)" />
        <Text style={{ color: '#fff', fontSize: FONTS.small, marginLeft: SPACING.xs, flex: 1 }}>
          Ciclo: {ciclo?.nombre_ciclo || ciclo?.id_ciclo}
        </Text>
        <Ionicons name={showPicker ? 'chevron-up' : 'chevron-down'} size={16} color="rgba(255,255,255,0.7)" />
      </TouchableOpacity>

      {showPicker && (
        <View style={{
          backgroundColor: COLORS.bgCard,
          borderRadius: BORDER_RADIUS.md,
          marginTop: SPACING.sm,
          overflow: 'hidden',
        }}>
          {ciclos.map((c) => {
            const activo = c.id_ciclo === ciclo?.id_ciclo;
            return (
              <TouchableOpacity
                key={c.id_ciclo}
                onPress={() => onSelect(c)}
                activeOpacity={0.7}
                style={{
                  paddingVertical: SPACING.sm,
                  paddingHorizontal: SPACING.md,
                  borderBottomWidth: 1,
                  borderBottomColor: COLORS.border,
                  backgroundColor: activo ? 'rgba(168,85,247,0.2)' : 'transparent',
                }}
              >
                <Text style={{ color: COLORS.text, fontSize: FONTS.body, fontWeight: activo ? '700' : '400' }}>
                  {c.nombre_ciclo || `Ciclo ${c.id_ciclo}`}
                </Text>
                <Text style={{ color: COLORS.textSecondary, fontSize: FONTS.small, marginTop: 2 }}>
                  {formatearFechaLegible(c.fecha_inicio)} — {c.fecha_fin ? formatearFechaLegible(c.fecha_fin) : 'Activo'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </>
  );
}
