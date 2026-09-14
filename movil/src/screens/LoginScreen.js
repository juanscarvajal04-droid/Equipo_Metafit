// movil/src/screens/LoginScreen.js
// ─── Login del afiliado (stack PRE-login) ────────────────────
// Formulario de acceso con correo + contraseña, toggle de visibilidad de la
// clave, manejo de errores (validación local, error de red y error del server)
// y botón con spinner mientras autentica. Tras el login exitoso activa las push
// notifications (activarPushNotifications) y AppNavigator redirige a las tabs
// automáticamente porque el token ya existe en el contexto.
//
// ¿Qué tab le corresponde? Ninguna — pantalla pública pre-login.
// ¿Qué endpoint /me consume? Ninguno directo: delega en `login` de AuthContext
// (que llama a /auth/login y persiste token/usuario/rol en AsyncStorage).
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
import { useAuth } from '../context/AuthContext';
import { activarPushNotifications } from '../services/notifications';
import { COLORS, GRADIENTS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../theme';

/**
 * LoginScreen — Pantalla de inicio de sesión del afiliado.
 *
 * Estados que maneja:
 *   • texto: correo, contrasena (con modo seguro de contraseña), showPass.
 *   • error: mensaje mostrado en un caja roja ⚠️.
 *   • loading: spinner en el botón; bloquea doble envío (disabled).
 *
 * Estados de datos (loading/empty/error):
 *   • vacío: no aplica — el propio login aporta los datos.
 *   • error de red (sin err.response): mensaje "Error de conexión...".
 *   • error del server: muestra err.response.data.error o "Correo o contraseña
 *     incorrectos". Al loguear, AppNavigator pasa a las tabs sin navegación
 *     manual (token en contexto).
 *
 * Navegación: 'RecuperarPassword' desde el link "¿Olvidaste tu contraseña?".
 *
 * @param {object}   props          - Props de pantalla del stack.
 * @param {object}   props.navigation - Para ir a RecuperarPassword.
 * @returns {JSX.Element} Formulario de login centrado con card.
 */
export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  /**
   * handleLogin — Envía el formulario de autenticación.
   * 1. Valida localmente que ambos campos estén completos.
   * 2. Limpia el error previo y activa el spinner.
   * 3. Llama login(correo, contrasena) de AuthContext; si OK, activa push.
   * 4. Separa fallos SIN respuesta (sin internet) de errores del servidor
   *    (401/403 → usa err.response.data.error o mensaje genérico).
   * 5. Desactiva el spinner en finally.
   *
   * @returns {Promise<void>} Resuelve al terminar el intento de login.
   */
  const handleLogin = async () => {
    if (!correo.trim() || !contrasena.trim()) {
      setError('Ingresá correo y contraseña');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await login(correo.trim(), contrasena);
      activarPushNotifications();
    } catch (err) {
      if (!err.response) {
        setError('Error de conexión. Verificá tu conexión a internet e intentá de nuevo.');
      } else {
        const msg = err.response?.data?.error || 'Correo o contraseña incorrectos';
        setError(msg);
      }
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

          <View style={styles.logoSection}>
            <Text style={styles.logo}>💪</Text>
            <Text style={styles.title}>MetaFit</Text>
            <Text style={styles.subtitle}>Sport Gym Sede 80</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Iniciar Sesión</Text>

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>⚠️ {error}</Text>
              </View>
            ) : null}

            <TextInput
              style={styles.input}
              placeholder="Correo electrónico"
              placeholderTextColor={COLORS.textMuted}
              value={correo}
              onChangeText={setCorreo}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <View style={styles.passWrap}>
              <TextInput
                style={styles.input}
                placeholder="Contraseña"
                placeholderTextColor={COLORS.textMuted}
                value={contrasena}
                onChangeText={setContrasena}
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

            <TouchableOpacity
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={GRADIENTS.rojo}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.button, loading && styles.buttonDisabled]}
              >
                {loading ? (
                  <ActivityIndicator color={COLORS.text} />
                ) : (
                  <Text style={styles.buttonText}>Ingresar al Sistema →</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate('RecuperarPassword')}
              style={styles.forgotRow}
            >
              <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.footer}>MetaFit v1.0 · 2026 · Sport Gym Sede 80</Text>
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
  logoSection: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  logo: {
    fontSize: 56,
    marginBottom: SPACING.sm,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: 1,
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
    marginBottom: SPACING.lg,
    textAlign: 'center',
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
  forgotRow: {
    marginTop: SPACING.lg,
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  forgotText: {
    color: COLORS.textMuted,
    fontSize: FONTS.small,
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
  footer: {
    fontSize: FONTS.xsmall,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: SPACING.lg,
  },
});
