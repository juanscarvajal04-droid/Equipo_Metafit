import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, GRADIENTS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../theme';
import useMutation from '../hooks/useMutation';
import { registrarConsumoReal } from '../services/registroService';

const fechaLocal = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export default function RegistroConsumoScreen({ navigation, route }) {
  const { id_ciclo, num_comida, id_alimento, nombre } = route.params || {};

  const [cantidad, setCantidad] = useState('');

  const { execute, loading } = useMutation(registrarConsumoReal, {
    onSuccess: () => {
      Alert.alert('Registrado', 'Consumo guardado correctamente.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    },
    onError: (_err, msg) => Alert.alert('Error', msg),
  });

  const handleSubmit = () => {
    const g = Number(cantidad);
    if (!cantidad.trim() || g <= 0) {
      Alert.alert('Dato inválido', 'Ingresá la cantidad consumida en gramos (mayor a 0).');
      return;
    }
    execute({
      id_ciclo,
      num_comida,
      id_alimento,
      fecha: fechaLocal(),
      cantidad_g_consumida: g,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <LinearGradient colors={GRADIENTS.purpleDark} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}
              style={styles.backBtn}>
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Registrar Consumo</Text>
            <View style={{ width: 22 }} />
          </LinearGradient>

          <View style={styles.card}>
            <Text style={styles.subtitle}>Fecha</Text>
            <Text style={styles.fecha}>{fechaLocal()}</Text>

            <Text style={styles.subtitle}>Alimento</Text>
            <Text style={styles.nombre}>{nombre || 'Alimento'}</Text>
            {num_comida != null ? (
              <Text style={styles.contexto}>Comida {num_comida}</Text>
            ) : null}

            <Text style={styles.subtitle}>Cantidad consumida (g)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: 180"
              placeholderTextColor={COLORS.textMuted}
              value={cantidad}
              onChangeText={setCantidad}
              keyboardType="decimal-pad"
            />

            <TouchableOpacity onPress={handleSubmit} disabled={loading} activeOpacity={0.85}>
              <LinearGradient
                colors={loading ? ['#555', '#555'] : GRADIENTS.purpleDark}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.button, loading && styles.buttonDisabled]}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Guardar consumo</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingBottom: SPACING.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: FONTS.subtitle,
    fontWeight: '700',
  },
  card: {
    backgroundColor: COLORS.bgSecondary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    margin: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  fecha: {
    color: COLORS.text,
    fontSize: FONTS.body,
    fontWeight: '600',
    marginBottom: SPACING.md,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: FONTS.xsmall,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.xs,
    marginTop: SPACING.xs,
  },
  nombre: {
    color: COLORS.text,
    fontSize: FONTS.subtitle,
    fontWeight: '700',
  },
  contexto: {
    color: COLORS.purpleLight,
    fontSize: FONTS.small,
    marginBottom: SPACING.md,
  },
  input: {
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 14,
    fontSize: FONTS.body,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  button: {
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: SPACING.sm,
    ...SHADOWS.purple,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: FONTS.body,
    fontWeight: '700',
  },
});