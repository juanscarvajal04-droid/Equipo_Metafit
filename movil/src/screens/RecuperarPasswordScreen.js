import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GRADIENTS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../theme';
import { solicitarRecuperacion, resetPasswordRequest } from '../services/api';

export default function RecuperarPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [tokenInfo, setTokenInfo] = useState('');
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSolicitar = async () => {
    if (!email.trim()) {
      setError('Ingresá tu correo electrónico');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await solicitarRecuperacion(email.trim());
      if (res?.modoPrueba && res?.token) {
        setTokenInfo(res.token);
      } else {
        setDone(true);
      }
    } catch (err) {
      setError(err?.response?.data?.error || 'Error de conexión. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!token.trim()) {
      setError('Ingresá el token recibido');
      return;
    }
    if (nuevaPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await resetPasswordRequest(token.trim(), nuevaPassword);
      setDone(true);
    } catch (err) {
      setError(err?.response?.data?.error || 'Error de conexión. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.glowContainer}>
            <View style={styles.glow} />
          </View>

          <TouchableOpacity style={styles.backRow} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={18} color={COLORS.textMuted} />
            <Text style={styles.backText}>Volver al login</Text>
          </TouchableOpacity>

          <View style={styles.logoSection}>
            <Text style={styles.logo}>🔑</Text>
            <Text style={styles.title}>Recuperar Contraseña</Text>
            <Text style={styles.subtitle}>MetaFit · Sport Gym Sede 80</Text>
          </View>

          <View style={styles.card}>
            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>⚠️ {error}</Text>
              </View>
            ) : null}

            {done ? (
              <View style={styles.successBox}>
                <Ionicons name="checkmark-circle" size={28} color={COLORS.success} />
                <Text style={styles.successTitle}>Listo</Text>
                <Text style={styles.successText}>
                  Si el correo existe, recibirás un enlace para restablecer tu contraseña.
                </Text>
              </View>
            ) : tokenInfo ? (
              <>
                <Text style={styles.cardTitle}>Nueva Contraseña</Text>
                <Text style={styles.hint}>
                  Modo prueba (sin SMTP): usá el token devuelto por el servidor.
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="Token recibido"
                  placeholderTextColor={COLORS.textMuted}
                  value={token}
                  onChangeText={setToken}
                  autoCapitalize="none"
                />
                <View style={styles.passWrap}>
                  <TextInput
                    style={styles.input}
                    placeholder="Nueva contraseña"
                    placeholderTextColor={COLORS.textMuted}
                    value={nuevaPassword}
                    onChangeText={setNuevaPassword}
                    secureTextEntry={!showPass}
                  />
                  <TouchableOpacity
                    style={styles.eyeBtn}
                    onPress={() => setShowPass(prev => !prev)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons
                      name={showPass ? 'eye-off' : 'eye'}
                      size={20}
                      color={COLORS.textMuted}
                    />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity onPress={handleReset} disabled={loading} activeOpacity={0.85}>
                  <LinearGradient
                    colors={GRADIENTS.rojo}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.button, loading && styles.buttonDisabled]}
                  >
                    {loading ? (
                      <ActivityIndicator color={COLORS.text} />
                    ) : (
                      <Text style={styles.buttonText}>Guardar nueva contraseña</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.cardTitle}>Restablecer Contraseña</Text>
                <Text style={styles.hint}>
                  Ingresá tu correo. Te enviaremos un enlace para restablecer tu contraseña.
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="Correo electrónico"
                  placeholderTextColor={COLORS.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
                <TouchableOpacity onPress={handleSolicitar} disabled={loading} activeOpacity={0.85}>
                  <LinearGradient
                    colors={GRADIENTS.rojo}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.button, loading && styles.buttonDisabled]}
                  >
                    {loading ? (
                      <ActivityIndicator color={COLORS.text} />
                    ) : (
                      <Text style={styles.buttonText}>Enviar solicitud</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}

            {tokenInfo && (
              <Text style={styles.tokenInfo}>
                Token: <Text style={styles.tokenText}>{tokenInfo}</Text>
              </Text>
            )}
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
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xl,
  },
  glowContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    overflow: 'hidden',
  },
  glow: {
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: COLORS.redGlow,
    opacity: 0.3,
    top: -120,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: SPACING.md,
  },
  backText: {
    color: COLORS.textMuted,
    fontSize: FONTS.small,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  logo: {
    fontSize: 52,
    marginBottom: SPACING.sm,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: FONTS.subtitle,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  card: {
    backgroundColor: COLORS.bgSecondary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  cardTitle: {
    fontSize: FONTS.subtitle,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  hint: {
    color: COLORS.textMuted,
    fontSize: FONTS.small,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  errorBox: {
    backgroundColor: 'rgba(227,28,37,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(227,28,37,0.5)',
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.sm + 2,
    marginBottom: SPACING.md,
  },
  errorText: {
    color: COLORS.red,
    fontSize: FONTS.small,
    textAlign: 'center',
  },
  successBox: {
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
  },
  successTitle: {
    color: COLORS.success,
    fontSize: FONTS.subtitle,
    fontWeight: '700',
  },
  successText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.small,
    textAlign: 'center',
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
  passWrap: {
    position: 'relative',
  },
  eyeBtn: {
    position: 'absolute',
    right: 12,
    top: 15,
  },
  button: {
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: COLORS.text,
    fontSize: FONTS.body,
    fontWeight: '700',
  },
  tokenInfo: {
    marginTop: SPACING.md,
    color: COLORS.textMuted,
    fontSize: FONTS.xsmall,
  },
  tokenText: {
    color: COLORS.purpleLight,
    fontSize: FONTS.xsmall,
  },
});