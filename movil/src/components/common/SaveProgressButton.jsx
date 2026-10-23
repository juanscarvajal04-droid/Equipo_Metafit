import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../../theme';

// Botón inferior de guardado compartido por las pantallas de plan.
export default function SaveProgressButton({ saving, onPress, label = 'Guardar Progreso' }) {
  return (
    <View style={{
      position: 'absolute',
      bottom: 30,
      left: SPACING.lg,
      right: SPACING.lg,
    }}>
      <TouchableOpacity onPress={onPress} disabled={saving} activeOpacity={0.8}>
        <LinearGradient
          colors={saving ? ['#555', '#555'] : GRADIENTS.purple}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            borderRadius: BORDER_RADIUS.lg,
            padding: SPACING.md,
            alignItems: 'center',
            ...SHADOWS.purple,
          }}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={{ color: '#fff', fontSize: FONTS.body, fontWeight: '700' }}>
              {label}
            </Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}
