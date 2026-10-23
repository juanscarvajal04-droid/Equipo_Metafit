import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, GRADIENTS, FONTS, SPACING } from '../theme';
import { createFormScreenStyles } from '../components/common/formStyles';
import { useTheme } from '../context/ThemeContext';
import useApi from '../hooks/useApi';
import useMutation from '../hooks/useMutation';
import { getPerfil, actualizarPerfil } from '../services/perfilService';
import { calcularIMC, formatearPeso, formatearAltura, formatearNumero } from '../utils/formateadores';

export default function EditarPerfilScreen({ navigation }) {
  const { data: perfil, loading: loadingPerfil } = useApi(getPerfil);
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(), [theme]);

  const pesoFuente = perfil?.ciclo_activo?.progreso_fisico?.[0]?.peso_kg;
  const [peso, setPeso] = useState('');
  const [altura, setAltura] = useState('');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');
  const [prefill, setPrefill] = useState(false);

  useEffect(() => {
    if (!perfil || prefill) return;
    setPeso(pesoFuente != null ? String(pesoFuente) : '');
    setAltura(perfil.estatura_cm != null ? String(perfil.estatura_cm) : '');
    setTelefono(perfil.telefono || '');
    setDireccion(perfil.direccion || '');
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

    void execute({
      telefono: telefono.trim() || undefined,
      direccion: direccion.trim() || undefined,
      peso_kg: p,
      estatura_cm: a,
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

            <Text style={styles.subtitle}>Dirección — opcional</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Calle 80 # 11-22"
              placeholderTextColor={COLORS.textMuted}
              value={direccion}
              onChangeText={setDireccion}
              maxLength={100}
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

const createStyles = () => createFormScreenStyles({
  imcBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.purpleGlow,
    borderRadius: 10,
    padding: SPACING.sm,
    marginBottom: SPACING.md,
  },
  imcText: {
    color: COLORS.text,
    fontSize: FONTS.body,
    fontWeight: '700',
  },
  hint: {
    color: COLORS.textMuted,
    fontSize: FONTS.xsmall,
    marginBottom: SPACING.xs,
  },
  ultimo: {
    color: COLORS.textMuted,
    fontSize: FONTS.xsmall,
    textAlign: 'center',
  },
});
