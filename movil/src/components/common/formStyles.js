import { StyleSheet } from 'react-native';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../../theme';

// Estilos comunes de las pantallas de formulario (registro de consumo,
// registro de ejercicio y edición de perfil). Cada pantalla puede añadir
// sus propias claves sin duplicar el bloque base.
export const formScreenBaseStyles = {
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
};

export const createFormScreenStyles = (extra = {}) =>
  StyleSheet.create({ ...formScreenBaseStyles, ...extra });
