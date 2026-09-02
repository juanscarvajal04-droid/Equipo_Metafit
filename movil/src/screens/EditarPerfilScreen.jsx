import React, { useState, useEffect } from 'react';
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
import useApi from '../hooks/useApi';
import useMutation from '../hooks/useMutation';
import { getPerfil, actualizarPerfil } from '../services/perfilService';
import { calcularIMC, formatearPeso, formatearAltura, formatearNumero } from '../utils/formateadores';

const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function EditarPerfilScreen({ navigation }) {
  const { data: perfil, loading: loadingPerfil } = useApi(getPerfil);

  const pesoFuente = perfil?.ciclo_activo?.progreso_fisico?.[0]?.peso_kg;
  const [peso, setPeso] = useState('');
  const [altura, setAltura] = useState('');
  const [telefono, setTelefono] = useState('');
  const [correo, setCorreo] = useState('');
  const [prefill, setPrefill] = useState(false);

  useEffect(() => {
    if (!perfil || prefill) return;
    setPeso(pesoFuente != null ? String(pesoFuente) : '');
    setAltura(perfil.estatura_cm != null ? String(perfil.estatura_cm) : '');
    setTelefono(perfil.telefono || '');
    setCorreo(perfil.correo || '');
    setPrefill(true);
  }, [perfil, prefill, pesoFuente]);

  const imc = calcularIMC(peso, altura);

  const { execute, loading } = useMutation(actualizarPerfil, {
    onSuccess: (res) => {
      const resultado = res?.data || {};
      const msg = resultado.imc != null
        ? `Guardado correctamente. Tu IMC es ${formatearNumero(resultado.imc, 2)}.`
        : 'Guardado correctamente.';
      Alert.alert('Perfil actualizado', msg, [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    },
    onError: (_err, msg) => Alert.alert('Error', msg),
  });

  const handleSubmit = () => {
    const p = Number(peso);
    const a = Number(altura);

    if (!peso.trim() || Number.isNaN(p) || p < 20 || p > 300) {
      Alert.alert('Peso inválido', 'Ingresá tu peso entre 20 y 300 kg.');
      return;
    }
    if (!altura.trim() || Number.isNaN(a) || a < 1 || a > 300) {
      Alert.alert('Altura inválida', 'Ingresá tu altura entre 1 y 300 cm.');
      return;
    }
    if (correo.trim() && !RE_EMAIL.test(correo.trim())) {
      Alert.alert('Correo inválido', 'Ingresá un correo electrónico válido.');
      return;
    }

    execute({
      peso_kg: p,
      estatura_cm: a,
      telefono: telefono.trim() || undefined,
      correo: correo.trim() || undefined,
    });
  };

  if (loadingPerfil && !prefill) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={COLORS.purple} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <LinearGradient colors={GRADIENTS.purple} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}
              style={styles.backBtn}>
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Editar Perfil</Text>
            <View style={{ width: 22 }} />
          </LinearGradient>

          <View style={styles.card}>
            {imc != null && (
              <View style={styles.imcBanner}>
                <Ionicons name="pulse" size={18} color={COLORS.purpleLight} style={{ marginRight: SPACING.sm }} />
                <Text style={styles.imcText}>
                  IMC: {formatearNumero(imc, 2)}
                </Text>
              </View>
            )}

            <Text style={styles.subtitle}>Peso actual (kg)</Text>
            <Text style={styles.hint}>Se registra en tu progreso físico (20–300 kg).</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: 82"
              placeholderTextColor={COLORS.textMuted}
              value={peso}
              onChangeText={setPeso}
              keyboardType="decimal-pad"
            />

            <Text style={styles.subtitle}>Altura (cm)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: 175"
              placeholderTextColor={COLORS.textMuted}
              value={altura}
              onChangeText={setAltura}
              keyboardType="number-pad"
            />

            <Text style={styles.subtitle}>Teléfono — opcional</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: +57 300 123 4567"
              placeholderTextColor={COLORS.textMuted}
              value={telefono}
              onChangeText={setTelefono}
              keyboardType="phone-pad"
            />

            <Text style={styles.subtitle}>Correo electrónico — opcional</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: nombre@correo.com"
              placeholderTextColor={COLORS.textMuted}
              value={correo}
              onChangeText={setCorreo}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <TouchableOpacity onPress={handleSubmit} disabled={loading} activeOpacity={0.85}>
              <LinearGradient
                colors={loading ? ['#555', '#555'] : GRADIENTS.purple}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.button, loading && styles.buttonDisabled]}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Guardar cambios</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <View style={{ marginTop: SPACING.md }}>
              <Text style={styles.ultimo}>
                Último peso registrado: {formatearPeso(pesoFuente)} · Altura: {formatearAltura(perfil?.estatura_cm)}
              </Text>
            </View>
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
  imcBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.purpleGlow,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    marginBottom: SPACING.md,
  },
  imcText: {
    color: COLORS.text,
    fontSize: FONTS.body,
    fontWeight: '700',
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: FONTS.xsmall,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.xs,
    marginTop: SPACING.xs,
  },
  hint: {
    color: COLORS.textMuted,
    fontSize: FONTS.xsmall,
    marginBottom: SPACING.xs,
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
  ultimo: {
    color: COLORS.textMuted,
    fontSize: FONTS.xsmall,
    textAlign: 'center',
  },
});