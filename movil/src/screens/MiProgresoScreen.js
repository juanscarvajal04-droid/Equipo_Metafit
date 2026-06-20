import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getMiProgreso } from '../services/api';
import { COLORS, GRADIENTS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../theme';

function formatFecha(fecha) {
  if (!fecha) return '-';
  const d = new Date(fecha);
  const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  return `${d.getDate()} ${meses[d.getMonth()]} ${d.getFullYear()}`;
}

export default function MiProgresoScreen() {
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getMiProgreso();
        const data = Array.isArray(res.data) ? res.data : [];
        setRegistros(data);
      } catch {
        setError('Error al cargar progreso');
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

  if (registros.length === 0) {
    return (
      <SafeAreaView style={styles.center}>
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>📊</Text>
          <Text style={styles.emptyTitle}>Sin registros</Text>
          <Text style={styles.emptyText}>
            Aún no tienes registros de progreso.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const ultimo = registros[registros.length - 1];

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.fecha}>{formatFecha(item.fecha_registro)}</Text>
      <View style={styles.medidasGrid}>
        <MedidaItem label="Peso" value={item.peso_kg != null ? `${item.peso_kg} kg` : '-'} />
        <MedidaItem label="IMC" value={item.imc != null ? item.imc.toFixed(1) : '-'} />
        <MedidaItem label="Grasa" value={item.porcentaje_grasa != null ? `${item.porcentaje_grasa}%` : '-'} />
        <MedidaItem label="Cintura" value={item.medida_cintura != null ? `${item.medida_cintura} cm` : '-'} />
        <MedidaItem label="Brazo" value={item.medida_brazo != null ? `${item.medida_brazo} cm` : '-'} />
        <MedidaItem label="Pierna" value={item.medida_pierna != null ? `${item.medida_pierna} cm` : '-'} />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={registros}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <LinearGradient colors={GRADIENTS.oscuro} style={styles.headerGradient}>
            <Text style={styles.headerTitle}>Progreso Físico</Text>
          </LinearGradient>
        }
        ListHeaderComponentStyle={styles.headerComponent}
        renderItem={renderItem}
      />
    </SafeAreaView>
  );
}

function MedidaItem({ label, value, destacado }) {
  return (
    <View style={[styles.medidaItem, destacado && styles.medidaDestacado]}>
      <Text style={styles.medidaLabel}>{label}</Text>
      <Text style={[styles.medidaValue, destacado && styles.medidaValueDestacado]}>
        {value}
      </Text>
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
    padding: SPACING.lg,
  },
  list: {
    paddingBottom: SPACING.xl,
  },
  headerComponent: {
    marginBottom: 0,
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
  card: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    backgroundColor: COLORS.bgCard,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  fecha: {
    fontSize: FONTS.small,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm + 4,
  },
  medidasGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  medidaItem: {
    width: '33%',
    marginBottom: SPACING.sm,
  },
  medidaLabel: {
    fontSize: FONTS.xsmall,
    color: COLORS.textSecondary,
  },
  medidaValue: {
    fontSize: FONTS.small,
    color: COLORS.text,
    fontWeight: '600',
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
