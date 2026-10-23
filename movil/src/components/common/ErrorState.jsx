import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING } from '../../theme';

// Estado de error de carga compartido por las pantallas de plan.
export default function ErrorState({ message }) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.lg }}>
      <Ionicons name="alert-circle-outline" size={48} color={COLORS.textSecondary} />
      <Text style={{ color: COLORS.textSecondary, fontSize: FONTS.body, marginTop: SPACING.md, textAlign: 'center' }}>
        {message}
      </Text>
    </View>
  );
}
