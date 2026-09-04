import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../../theme';

export default function StatsCard({ icon, label, value, color = COLORS.purple }) {
  return (
    <View style={styles.card}>
      <View style={[styles.iconWrap, { backgroundColor: `${color}26` }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <View style={styles.info}>
        <Text style={styles.label} numberOfLines={1}>{label}</Text>
        <Text style={styles.value} numberOfLines={1}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: COLORS.bgCard,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  info: {
    gap: 2,
  },
  label: {
    color: COLORS.textMuted,
    fontSize: FONTS.xsmall,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    color: COLORS.text,
    fontSize: FONTS.subtitle,
    fontWeight: '700',
  },
});