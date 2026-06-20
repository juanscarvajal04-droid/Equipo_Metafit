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
import { getMisCiclos, getPlanNutricional } from '../services/api';
import { COLORS, GRADIENTS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../theme';

function ExpandableComidaCard({ numComida, items }) {
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.comidaCard}>
      <TouchableOpacity
        style={styles.comidaHeader}
        onPress={() => setOpen(!open)}
        activeOpacity={0.7}
      >
        <View style={styles.comidaHeaderLeft}>
          <View style={styles.comidaBadge}>
            <Text style={styles.comidaBadgeText}>{numComida}</Text>
          </View>
          <Text style={styles.comidaTitle}>Comida {numComida}</Text>
        </View>
        <Text style={styles.expandIcon}>{open ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {open && (
        <View style={styles.alimentosContainer}>
          {items.map((item, i) => (
            <View key={i} style={styles.alimentoRow}>
              <View style={styles.alimentoInfo}>
                <Text style={styles.alimentoName}>{item.nombre_alimento}</Text>
                <Text style={styles.alimentoCant}>{item.cantidad_g}g</Text>
              </View>
              <View style={styles.macrosRow}>
                {item.proteinas > 0 && <Text style={styles.macro}>P {item.proteinas}g</Text>}
                {item.carbohidratos > 0 && <Text style={styles.macro}>C {item.carbohidratos}g</Text>}
                {item.grasas > 0 && <Text style={styles.macro}>G {item.grasas}g</Text>}
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

export default function MiDietaScreen() {
  const [plan, setPlan] = useState(null);
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
          const planRes = await getPlanNutricional(activo.id_ciclo);
          setPlan(planRes.data);
        } else {
          setPlan(null);
        }
      } catch (err) {
        if (err.response?.status === 404) {
          setPlan(null);
        } else {
          setError('Error al cargar el plan nutricional');
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

  if (!plan) {
    return (
      <SafeAreaView style={styles.center}>
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>🥗</Text>
          <Text style={styles.emptyTitle}>Sin plan nutricional</Text>
          <Text style={styles.emptyText}>
            Aún no tienes un plan nutricional asignado.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const detalle = plan.detalle || [];

  const comidasMap = {};
  detalle.forEach((d) => {
    if (!comidasMap[d.num_comida]) comidasMap[d.num_comida] = [];
    comidasMap[d.num_comida].push(d);
  });
  const comidas = Object.keys(comidasMap)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <LinearGradient colors={GRADIENTS.oscuro} style={styles.headerGradient}>
          <Text style={styles.headerTitle}>Plan Nutricional</Text>
        </LinearGradient>

        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Calorías objetivo</Text>
              <Text style={styles.summaryValue}>{plan.calorias_objetivo} kcal</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Comidas por día</Text>
              <Text style={styles.summaryValue}>{plan.num_comidas}</Text>
            </View>
          </View>
        </View>

        {comidas.length > 0 ? (
          <View style={styles.comidasList}>
            {comidas.map((num) => (
              <ExpandableComidaCard
                key={num}
                numComida={num}
                items={comidasMap[num]}
              />
            ))}
          </View>
        ) : (
          <Text style={styles.sinDetalle}>Sin detalle de alimentos asignado.</Text>
        )}
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
  summaryCard: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    backgroundColor: COLORS.bgCard,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.border,
  },
  summaryLabel: {
    fontSize: FONTS.xsmall,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: FONTS.subtitle,
    fontWeight: '700',
    color: COLORS.text,
  },
  comidasList: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
  },
  comidaCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  comidaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
  },
  comidaHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  comidaBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(5,150,105,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm + 4,
    borderWidth: 1,
    borderColor: 'rgba(5,150,105,0.4)',
  },
  comidaBadgeText: {
    fontSize: FONTS.small,
    fontWeight: '700',
    color: COLORS.success,
  },
  comidaTitle: {
    fontSize: FONTS.body,
    fontWeight: '600',
    color: COLORS.text,
  },
  expandIcon: {
    fontSize: FONTS.small,
    color: COLORS.textSecondary,
    marginLeft: SPACING.sm,
  },
  alimentosContainer: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.sm,
  },
  alimentoRow: {
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  alimentoInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  alimentoName: {
    fontSize: FONTS.small,
    color: COLORS.text,
    flex: 1,
  },
  alimentoCant: {
    fontSize: FONTS.small,
    color: COLORS.success,
    fontWeight: '600',
    marginLeft: SPACING.sm,
  },
  macrosRow: {
    flexDirection: 'row',
    marginTop: 4,
    gap: SPACING.sm,
  },
  macro: {
    fontSize: FONTS.xsmall,
    color: COLORS.textMuted,
  },
  sinDetalle: {
    fontSize: FONTS.small,
    color: COLORS.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: SPACING.lg,
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
