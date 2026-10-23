import React, { useState, useMemo } from 'react';
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
import useMutation from '../hooks/useMutation';
import { registrarEjercicioReal } from '../services/registroService';
import { mensajeErrorRegistroEjercicio } from '../utils/errorUtils';

const fechaLocal = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export default function RegistroEjercicioScreen({ navigation, route }) {
  const { id_ciclo, id_rutina, orden, nombre, nombre_rutina } = route.params || {};
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(), [theme]);

  const [series, setSeries] = useState('');
  const [repeticiones, setRepeticiones] = useState('');
  const [peso, setPeso] = useState('');
  const [notas, setNotas] = useState('');

  const { execute, loading } = useMutation(registrarEjercicioReal, {
    onSuccess: () => {
      Alert.alert('✅ Ejercicio registrado', 'Ejercicio guardado correctamente.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    },
    onError: (err, msg) => {
      Alert.alert('Error', mensajeErrorRegistroEjercicio(err, msg));
    },
  });

  const handleSubmit = () => {
    const s = Number(series);
    const r = Number(repeticiones);
    if (!series.trim() || !repeticiones.trim() || s < 1 || r < 1) {
      Alert.alert('Datos incompletos', 'Ingresá series y repeticiones (mínimo 1).');
      return;
    }
    void execute({
      id_ciclo,
      id_rutina,
      orden,
      fecha: fechaLocal(),
      series: s,
      repeticiones: r,
      peso_utilizado_kg: peso.trim() ? Number(peso) : null,
      notas: notas.trim() ? notas.trim() : null,
    });
  };

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
            <Text style={styles.headerTitle}>Registrar Ejercicio</Text>
            <View style={{ width: 22 }} />
          </LinearGradient>

          <View style={styles.card}>
            <Text style={styles.subtitle}>Fecha</Text>
            <Text style={styles.fecha}>{fechaLocal()}</Text>

            <Text style={styles.subtitle}>Ejercicio</Text>
            <Text style={styles.nombre}>{nombre || 'Ejercicio'}</Text>
            {nombre_rutina ? (
              <Text style={styles.contexto}>{nombre_rutina}</Text>
            ) : null}

            <Text style={styles.subtitle}>Series</Text>
            <TextInput
              style={styles.input}
              placeholder="Número de series realizadas"
              placeholderTextColor={COLORS.textMuted}
              value={series}
              onChangeText={setSeries}
              keyboardType="number-pad"
            />

            <Text style={styles.subtitle}>Repeticiones</Text>
            <TextInput
              style={styles.input}
              placeholder="Repeticiones por serie"
              placeholderTextColor={COLORS.textMuted}
              value={repeticiones}
              onChangeText={setRepeticiones}
              keyboardType="number-pad"
            />

            <Text style={styles.subtitle}>Peso utilizado (kg) — opcional</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: 40.5"
              placeholderTextColor={COLORS.textMuted}
              value={peso}
              onChangeText={setPeso}
              keyboardType="decimal-pad"
            />

            <Text style={styles.subtitle}>Notas — opcional</Text>
            <TextInput
              style={[styles.input, styles.notas]}
              placeholder="Cómo te sentiste, dificultad, variaciones..."
              placeholderTextColor={COLORS.textMuted}
              value={notas}
              onChangeText={setNotas}
              multiline
              textAlignVertical="top"
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
                  <Text style={styles.buttonText}>Guardar ejercicio</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = () => createFormScreenStyles({
  notas: {
    minHeight: 90,
  },
});
