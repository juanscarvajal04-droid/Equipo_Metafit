import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../theme';

const FEATURES = [
  {
    icon: '🏋️',
    title: 'Rutinas Personalizadas',
    desc: 'Plan de entrenamiento diseñado para vos',
    gradient: GRADIENTS.rojo,
  },
  {
    icon: '🥗',
    title: 'Plan Nutricional',
    desc: 'Dieta calculada según tus objetivos',
    gradient: GRADIENTS.entrenador,
  },
  {
    icon: '📊',
    title: 'Progreso Físico',
    desc: 'Medí tu evolución en tiempo real',
    gradient: GRADIENTS.recepcionista,
  },
  {
    icon: '🔒',
    title: 'Datos Seguros',
    desc: 'Tu información médica protegida',
    gradient: GRADIENTS.admin,
  },
];

const STEPS = [
  {
    num: '1',
    icon: '📍',
    text: 'Visitanos en Sport Gym Sede 80',
  },
  {
    num: '2',
    icon: '👩‍💼',
    text: 'La recepcionista crea tu perfil',
  },
  {
    num: '3',
    icon: '📱',
    text: 'Accedé a tu plan desde cualquier lugar',
  },
];

export default function LandingScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scroll} bounces={false}>
        {/* Hero */}
        <LinearGradient colors={GRADIENTS.oscuro} style={styles.hero}>
          <View style={styles.heroContent}>
            <Text style={styles.heroLogo}>💪</Text>
            <Text style={styles.heroTitle}>MetaFit</Text>
            <Text style={styles.heroSubtitle}>Sport Gym Sede 80</Text>
            <Text style={styles.heroTagline}>Transforma tu cuerpo, transforma tu vida</Text>
          </View>
        </LinearGradient>

        {/* Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>¿Qué ofrecemos?</Text>
          {FEATURES.map((f, i) => (
            <View key={i} style={styles.featureCard}>
              <View style={styles.featureRow}>
                <View style={[styles.featureIconWrap, { borderColor: f.gradient[0] }]}>
                  <Text style={styles.featureIcon}>{f.icon}</Text>
                </View>
                <View style={styles.featureInfo}>
                  <Text style={styles.featureTitle}>{f.title}</Text>
                  <Text style={styles.featureDesc}>{f.desc}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Cómo funciona */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>¿Cómo funciona?</Text>
          {STEPS.map((s, i) => (
            <View key={i} style={styles.stepCard}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepBadgeText}>{s.num}</Text>
              </View>
              <View style={styles.stepInfo}>
                <Text style={styles.stepIcon}>{s.icon}</Text>
                <Text style={styles.stepText}>{s.text}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* CTA Button */}
        <View style={styles.ctaSection}>
          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={GRADIENTS.rojo}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ctaButton}
            >
              <Text style={styles.ctaButtonText}>Iniciar Sesión</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            © 2026 MetaFit · Sport Gym Sede 80
          </Text>
          <Text style={styles.footerText}>Bogotá, Colombia</Text>
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
  scroll: {
    flexGrow: 1,
  },
  hero: {
    paddingTop: 60,
    paddingBottom: 50,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  heroContent: {
    alignItems: 'center',
  },
  heroLogo: {
    fontSize: 64,
    marginBottom: SPACING.sm,
  },
  heroTitle: {
    fontSize: 42,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: 2,
  },
  heroSubtitle: {
    fontSize: FONTS.subtitle,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  heroTagline: {
    fontSize: FONTS.body,
    color: COLORS.textMuted,
    marginTop: SPACING.lg,
    fontStyle: 'italic',
  },
  section: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONTS.subtitle + 2,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  featureCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm + 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.subtle,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    marginRight: SPACING.md,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  featureIcon: {
    fontSize: 24,
  },
  featureInfo: {
    flex: 1,
  },
  featureTitle: {
    fontSize: FONTS.body,
    fontWeight: '600',
    color: COLORS.text,
  },
  featureDesc: {
    fontSize: FONTS.small,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  stepBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(227,28,37,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(227,28,37,0.4)',
    marginRight: SPACING.md,
  },
  stepBadgeText: {
    fontSize: FONTS.small,
    fontWeight: '700',
    color: COLORS.red,
  },
  stepInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  stepIcon: {
    fontSize: 20,
    marginRight: SPACING.sm,
  },
  stepText: {
    fontSize: FONTS.body,
    color: COLORS.text,
    flex: 1,
  },
  ctaSection: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
    alignItems: 'center',
  },
  ctaButton: {
    paddingVertical: 16,
    paddingHorizontal: 60,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    minWidth: 220,
  },
  ctaButtonText: {
    color: COLORS.text,
    fontSize: FONTS.body,
    fontWeight: '700',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    marginTop: SPACING.lg,
  },
  footerText: {
    fontSize: FONTS.xsmall,
    color: COLORS.textMuted,
    marginTop: 2,
  },
});
