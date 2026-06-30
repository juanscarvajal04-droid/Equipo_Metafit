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
import { getMisCiclos, getPlanEntrenamiento } from '../services/api';
import { COLORS, GRADIENTS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../theme';

function ExpandableCard({ rutina }) {
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.rutinaCard}>
      <TouchableOpacity
        style={styles.rutinaHeader}
        onPress={() => setOpen(!open)}
        activeOpacity={0.7}
      >
        <View style={styles.rutinaHeaderLeft}>
          <View style={styles.diaBadge}>
            <Text style={styles.diaBadgeText}>{rutina.dia_numero}</Text>
          </View>
          <View style={styles.rutinaHeaderInfo}>
            <Text style={styles.rutinaName}>{rutina.nombre_rutina}</Text>
            {rutina.enfoque_muscular ? (
              <Text style={styles.enfoque}>{rutina.enfoque_muscular}</Text>
            ) : null}
          </View>
        </View>
        <Text style={styles.expandIcon}>{open ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {open && (
        <View style={styles.ejerciciosContainer}>
          {rutina.ejercicios && rutina.ejercicios.length > 0 ? (
            rutina.ejercicios.map((ej, i) => (
              <View key={i} style={styles.ejercicioRow}>
                <Text style={styles.ejercicioName}>{ej.nombre_ejercicio}</Text>
                <Text style={styles.ejercicioDetalle}>
                  {ej.series} × {ej.repeticiones}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.sinEjercicios}>Sin ejercicios asignados</Text>
          )}
        </View>
      )}
    </View>
  );
}

export default function MiRutinaScreen() {
  const [plan, setPlan] = useState(null);
  const [ciclo, setCiclo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const ciclosRes = await getMisCiclos();
        const ciclos = ciclosRes.data;
        const activo = Array.isArray(ciclos)
          ? ciclos.find((c) => c.activo) || ciclos[0]
          : null;

        if (activo) {
          setCiclo(activo);
          const planRes = await getPlanEntrenamiento(activo.id_ciclo);
          setPlan(planRes.data);
        } else {
          setPlan(null);
          setCiclo(null);
        }
      } catch (err) {
        if (err.response?.status === 404) {
          setPlan(null);
        } else {
          setError('Error al cargar la rutina');
        }
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

  if (!plan || !plan.rutinas || plan.rutinas.length === 0) {
    return (
      <SafeAreaView style={styles.center}>
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>🏋️</Text>
          <Text style={styles.emptyTitle}>Sin rutina asignada</Text>
          <Text style={styles.emptyText}>
            Aún no tienes una rutina asignada.{'\n'}Habla con tu entrenador.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const rutinas = plan.rutinas;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <LinearGradient colors={GRADIENTS.oscuro} style={styles.headerGradient}>
          <Text style={styles.headerTitle}>Plan de Entrenamiento</Text>
          {ciclo && (
            <View style={styles.cicloResumen}>
              {ciclo.objetivo_fisico && (
                <Text style={styles.cicloText}>🎯 {ciclo.objetivo_fisico}</Text>
              )}
              <Text style={styles.cicloText}>
                📅 {ciclo.fecha_inicio} → {ciclo.fecha_fin || 'Sin fecha'}
              </Text>
            </View>
          )}
        </LinearGradient>

        <View style={styles.rutinasList}>
          {rutinas.map((rutina) => (
            <ExpandableCard key={rutina.id_rutina} rutina={rutina} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
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
    padding: SPACING.lg,
  },
  container: {
    paddingBottom: SPACING.xl,
  },
  headerGradient: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  headerTitle: {
    fontSize: FONTS.title,
    fontWeight: '700',
    color: COLORS.text,
  },
  cicloResumen: {
    marginTop: SPACING.sm,
  },
  cicloText: {
    fontSize: FONTS.small,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  rutinasList: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
  },
  rutinaCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  rutinaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
  },
  rutinaHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  diaBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(227,28,37,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm + 4,
    borderWidth: 1,
    borderColor: 'rgba(227,28,37,0.4)',
  },
  diaBadgeText: {
    fontSize: FONTS.small,
    fontWeight: '700',
    color: COLORS.red,
  },
  rutinaHeaderInfo: {
    flex: 1,
  },
  rutinaName: {
    fontSize: FONTS.body,
    fontWeight: '600',
    color: COLORS.text,
  },
  enfoque: {
    fontSize: FONTS.xsmall,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  expandIcon: {
    fontSize: FONTS.small,
    color: COLORS.textSecondary,
    marginLeft: SPACING.sm,
  },
  ejerciciosContainer: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.sm,
  },
  ejercicioRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  ejercicioName: {
    fontSize: FONTS.small,
    color: COLORS.text,
    flex: 1,
  },
  ejercicioDetalle: {
    fontSize: FONTS.small,
    color: COLORS.red,
    fontWeight: '600',
  },
  sinEjercicios: {
    fontSize: FONTS.small,
    color: COLORS.textMuted,
    fontStyle: 'italic',
  },
  emptyCard: {
    alignItems: 'center',
    padding: SPACING.xl,
    backgroundColor: COLORS.bgCard,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    fontSize: FONTS.subtitle,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  emptyText: {
    fontSize: FONTS.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  errorText: {
    color: COLORS.red,
    fontSize: FONTS.body,
  },
});
