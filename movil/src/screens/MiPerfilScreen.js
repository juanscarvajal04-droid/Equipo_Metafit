import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { getMiPerfil } from '../services/api';
import { COLORS, GRADIENTS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../theme';

export default function MiPerfilScreen() {
  const { logout } = useAuth();
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getMiPerfil();
        setPerfil(res.data);
      } catch {
        setError('Error al cargar perfil');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.red} />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
      </SafeAreaView>
    );
  }

  if (!perfil) return null;

  const inicial = (perfil.nombres?.charAt(0) || 'U').toUpperCase();
  const restricciones = perfil.restricciones || [];
  const activo = perfil.estado === 'Activo';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <LinearGradient colors={GRADIENTS.oscuro} style={styles.headerGradient}>
          <View style={styles.avatarRow}>
            <View style={[styles.avatar, activo ? styles.avatarActive : styles.avatarInactive]}>
              <Text style={styles.avatarText}>{inicial}</Text>
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.headerName}>
                {perfil.nombres} {perfil.apellidos}
              </Text>
              <View style={[styles.badge, activo ? styles.badgeActive : styles.badgeInactive]}>
                <Text style={[styles.badgeText, { color: activo ? COLORS.success : COLORS.textSecondary }]}>
                  {activo ? 'Activo' : 'Inactivo'}
                </Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.cardsSection}>
          <SectionCard title="📋 Datos Personales">
            <Row label="Correo" value={perfil.correo} />
            <Row label="Documento" value={perfil.documento} />
            <Row label="Fecha de nacimiento" value={perfil.fecha_nacimiento ? new Date(perfil.fecha_nacimiento).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'} />
            <Row label="Sexo" value={perfil.sexo} />
            <Row label="Teléfono" value={perfil.telefono} />
          </SectionCard>

          <SectionCard title="📐 Información Física">
            <Row label="Estatura" value={perfil.estatura_cm ? `${perfil.estatura_cm} cm` : '-'} />
            <Row label="Objetivo físico" value={perfil.ciclo_activo?.objetivo_fisico || '—'} />
            <Row label="Nivel de experiencia" value={perfil.ciclo_activo?.nivel_experiencia || '—'} />
          </SectionCard>

          {restricciones.length > 0 && (
            <SectionCard title="⚠️ Restricciones Médicas">
              {restricciones.map((r, i) => (
                <View key={i} style={styles.restriccionRow}>
                  <Text style={styles.restriccionDot}>•</Text>
                  <Text style={styles.restriccionText}>
                    {r.nombre_restriccion}
                    {r.tipo ? ` (${r.tipo})` : ''}
                    {r.efecto_relevante ? ` — ${r.efecto_relevante}` : ''}
                  </Text>
                </View>
              ))}
            </SectionCard>
          )}
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={logout} activeOpacity={0.8}>
          <LinearGradient colors={['rgba(227,28,37,0.2)', 'rgba(227,28,37,0.05)']} style={styles.logoutGradient}>
            <Text style={styles.logoutText}>🚪 Cerrar sesión</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionCard({ title, children }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Row({ label, value }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value || '-'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
  },
  container: {
    paddingBottom: SPACING.xl,
  },
  headerGradient: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.lg,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  avatarActive: {
    backgroundColor: COLORS.success,
  },
  avatarInactive: {
    backgroundColor: COLORS.textMuted,
  },
  avatarText: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.text,
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    fontSize: FONTS.subtitle,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.sm + 4,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
  },
  badgeActive: {
    backgroundColor: 'rgba(5,150,105,0.15)',
    borderColor: 'rgba(5,150,105,0.4)',
  },
  badgeInactive: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderColor: 'rgba(255,255,255,0.15)',
  },
  badgeText: {
    fontSize: FONTS.xsmall,
    fontWeight: '600',
  },
  cardsSection: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
  },
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  cardTitle: {
    fontSize: FONTS.body,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm + 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.xs + 2,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  label: {
    fontSize: FONTS.small,
    color: COLORS.textSecondary,
    flex: 1,
  },
  value: {
    fontSize: FONTS.small,
    color: COLORS.text,
    fontWeight: '500',
    flex: 1.5,
    textAlign: 'right',
  },
  restriccionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  restriccionDot: {
    color: COLORS.red,
    fontSize: FONTS.body,
    marginRight: SPACING.sm,
  },
  restriccionText: {
    fontSize: FONTS.small,
    color: COLORS.red,
  },
  logoutButton: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(227,28,37,0.3)',
  },
  logoutGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  logoutText: {
    fontSize: FONTS.body,
    fontWeight: '600',
    color: COLORS.red,
  },
  errorText: {
    color: COLORS.red,
    fontSize: FONTS.body,
  },
});
