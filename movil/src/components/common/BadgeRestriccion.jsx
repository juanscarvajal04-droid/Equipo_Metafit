import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../../theme';

// Píldora reutilizable para mostrar una restricción médica del afiliado:
// nombre + tipo como etiqueta (el efecto se muestra aparte cuando existe).
export default function BadgeRestriccion({ restriccion }) {
  const nombre =
    restriccion?.nombre_restriccion ||
    restriccion?.nombre ||
    restriccion?.descripcion ||
    'Restricción';
  const tipo = restriccion?.tipo;

  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(227,28,37,0.12)',
      borderRadius: BORDER_RADIUS.lg,
      paddingVertical: SPACING.xs,
      paddingHorizontal: SPACING.sm,
      borderWidth: 1,
      borderColor: 'rgba(227,28,37,0.25)',
    }}>
      <Ionicons name="alert-circle" size={15} color={COLORS.error} style={{ marginRight: SPACING.xs }} />
      <Text style={{ color: COLORS.text, fontSize: FONTS.small, fontWeight: '600', flexShrink: 1 }}>
        {nombre}
      </Text>
      {tipo ? (
        <View style={{
          backgroundColor: COLORS.purpleGlow,
          borderRadius: 10,
          paddingHorizontal: 8,
          paddingVertical: 1,
          marginLeft: SPACING.sm,
        }}>
          <Text style={{ color: COLORS.purpleLight, fontSize: FONTS.xsmall, fontWeight: '600' }}>
            {tipo}
          </Text>
        </View>
      ) : null}
    </View>
  );
}