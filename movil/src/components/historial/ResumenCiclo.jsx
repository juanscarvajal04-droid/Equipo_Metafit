import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../../theme';
import { formatearFechaLegible } from '../../utils/formateadores';

// Resumen compacto de un ciclo (historial de ciclos del afiliado).
// Usa SOLO los campos que devuelve GET /afiliados/me/ciclos:
// numero_ciclo, objetivo_fisico, fecha_inicio/fin, disponibilidad_dias, activo.
export default function ResumenCiclo({ ciclo }) {
  if (!ciclo) return null;

  const numero = Number(ciclo.numero_ciclo) || Number(ciclo.id_ciclo) || 0;
  const activo = Number(ciclo.activo) === 1;
  const objetivo = ciclo.objetivo_fisico || null;
  const fechas = ciclo.fecha_inicio
    ? `${formatearFechaLegible(ciclo.fecha_inicio)} → ${ciclo.fecha_fin ? formatearFechaLegible(ciclo.fecha_fin) : 'Activo'}`
    : null;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.numero, activo && { backgroundColor: COLORS.purpleGlow }]}>
          <Text style={[styles.numeroText, activo && { color: COLORS.purpleLight }]}>
            #{numero}
          </Text>
        </View>
        <View style={{ flex: 1, marginLeft: SPACING.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
            <Text style={styles.titulo}>Ciclo {numero}</Text>
            <View style={[styles.estado, activo ? styles.estadoActivo : styles.estadoCerrado]}>
              <Text style={[styles.estadoText, { color: activo ? COLORS.check : COLORS.textSecondary }]}>
                {activo ? 'En curso' : 'Completado'}
              </Text>
            </View>
          </View>
          {objetivo ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
              <Ionicons name="flag-outline" size={13} color={COLORS.textSecondary} style={{ marginRight: SPACING.xs }} />
              <Text style={styles.objetivo}>{objetivo}</Text>
            </View>
          ) : null}
          {fechas ? (
            <Text style={styles.fechas}>{fechas}</Text>
          ) : null}
        </View>
      </View>

      {ciclo.disponibilidad_dias != null && (
        <View style={styles.footer}>
          <Ionicons name="calendar-outline" size={13} color={COLORS.purpleLight} style={{ marginRight: SPACING.xs }} />
          <Text style={styles.footerText}>
            {ciclo.disponibilidad_dias} día{ciclo.disponibilidad_dias === 1 ? '' : 's'}/semana
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.subtle,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  numero: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.borderActive,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numeroText: {
    color: COLORS.text,
    fontSize: FONTS.small,
    fontWeight: '800',
  },
  titulo: {
    color: COLORS.text,
    fontSize: FONTS.body,
    fontWeight: '700',
  },
  estado: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: SPACING.sm,
    borderWidth: 1,
  },
  estadoActivo: {
    borderColor: 'rgba(16,185,129,0.45)',
    backgroundColor: COLORS.checkBg,
  },
  estadoCerrado: {
    borderColor: COLORS.border,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  estadoText: {
    fontSize: FONTS.xsmall,
    fontWeight: '700',
  },
  objetivo: {
    color: COLORS.textSecondary,
    fontSize: FONTS.small,
    flexShrink: 1,
  },
  fechas: {
    color: COLORS.textSecondary,
    fontSize: FONTS.xsmall,
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
  },
  footerText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.small,
  },
});