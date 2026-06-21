import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../theme';

const KPIS = [
  { valor: '1,200+', label: 'Afiliados activos',        icono: '👥' },
  { valor: '500+',   label: 'Planes nutricionales',      icono: '🥗' },
  { valor: '20+',    label: 'Entrenadores certificados', icono: '🏆' },
  { valor: '98%',    label: 'Satisfacción',              icono: '⭐' },
];

const FEATURES = [
  {
    icon: '🏋️',
    title: 'Rutinas Personalizadas',
    desc: 'Planes diseñados para tus objetivos, nivel y disponibilidad.',
    gradient: GRADIENTS.rojo,
  },
  {
    icon: '🥗',
    title: 'Plan Nutricional',
    desc: 'Dietas calculadas según tus necesidades y restricciones alimenticias.',
    gradient: GRADIENTS.entrenador,
  },
  {
    icon: '📊',
    title: 'Progreso Físico',
    desc: 'Registrá y visualizá tu evolución en tiempo real.',
    gradient: GRADIENTS.recepcionista,
  },
  {
    icon: '🔒',
    title: 'Datos Seguros',
    desc: 'Tu información médica protegida bajo la Ley de Habeas Data.',
    gradient: GRADIENTS.admin,
  },
];

const STEPS = [
  { num: '1', icon: '📍', text: 'Visitanos en Sport Gym Sede 80',         sub: 'Conocé nuestras instalaciones de élite' },
  { num: '2', icon: '👩‍💼', text: 'La recepcionista crea tu perfil',        sub: 'Te registramos en el sistema' },
  { num: '3', icon: '📱', text: 'Accedé a tu plan desde cualquier lugar', sub: 'Seguí tu entrenamiento y dieta en la app' },
];

const SEDE_STATS = [
  { valor: '3,500 m²',    label: 'Área total' },
  { valor: '6 AM – 10 PM', label: 'Horario' },
  { valor: 'Cra 80 c/68',  label: 'Ubicación' },
];

export default function LandingScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0f" />
      <ScrollView contentContainerStyle={styles.scroll} bounces={false} showsVerticalScrollIndicator={false}>
        {/* ═══════ HERO ═══════ */}
        <LinearGradient colors={['#1a1a2e', '#16213e', '#0a0a0f']} style={styles.hero}>
          <View style={styles.heroGlow} />
          <View style={styles.heroContent}>
            <Text style={styles.heroBadge}>🔴 Sistema de Gestión Deportiva v1.0</Text>
            <Text style={styles.heroLogo}>💪</Text>
            <Text style={styles.heroTitle}>MetaFit</Text>
            <Text style={styles.heroSubtitle}>Sport Gym Sede 80</Text>
            <Text style={styles.heroTagline}>"Transforma tu cuerpo, transforma tu vida"</Text>
            <Text style={styles.heroDesc}>
              El sistema de gestión avanzado para potenciar tu rendimiento.{'\n'}
              Rutinas, dietas y seguimiento en un solo lugar.
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Login')}
              activeOpacity={0.85}
              style={styles.heroCtaWrap}
            >
              <LinearGradient
                colors={GRADIENTS.rojo}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.heroCta}
              >
                <Text style={styles.heroCtaText}>🚀 Ingresar al Sistema</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* ═══════ KPIS ═══════ */}
        <View style={styles.kpisSection}>
          <View style={styles.kpisGrid}>
            {KPIS.map((k, i) => (
              <View key={k.label} style={[styles.kpiCard, i % 2 === 0 ? { marginRight: 8 } : { marginLeft: 8 }]}>
                <Text style={styles.kpiEmoji}>{k.icono}</Text>
                <Text style={styles.kpiValor}>{k.valor}</Text>
                <Text style={styles.kpiLabel}>{k.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ═══════ FUNCIONES ═══════ */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionBadge}>✦ Funciones del Sistema</Text>
            <Text style={styles.sectionTitle}>
              Todo lo que necesitás en{' '}
              <Text style={styles.sectionTitleAccent}>un solo lugar</Text>
            </Text>
          </View>

          {FEATURES.map((f, i) => (
            <View key={i} style={styles.featureCard}>
              <View style={styles.featureRow}>
                <LinearGradient
                  colors={f.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.featureIconWrap}
                >
                  <Text style={styles.featureIcon}>{f.icon}</Text>
                </LinearGradient>
                <View style={styles.featureInfo}>
                  <Text style={styles.featureTitle}>{f.title}</Text>
                  <Text style={styles.featureDesc}>{f.desc}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* ═══════ CÓMO FUNCIONA ═══════ */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionBadge}>📋 ¿Cómo funciona?</Text>
            <Text style={styles.sectionTitle}>
              Empezá en{' '}
              <Text style={styles.sectionTitleAccent}>3 pasos simples</Text>
            </Text>
          </View>

          {STEPS.map((s, i) => (
            <View key={i} style={styles.stepCard}>
              <LinearGradient
                colors={GRADIENTS.rojo}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.stepBadge}
              >
                <Text style={styles.stepBadgeText}>{s.num}</Text>
              </LinearGradient>
              <View style={styles.stepContent}>
                <View style={styles.stepHeader}>
                  <Text style={styles.stepIcon}>{s.icon}</Text>
                  <Text style={styles.stepText}>{s.text}</Text>
                </View>
                <Text style={styles.stepSub}>{s.sub}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* ═══════ SEDE ═══════ */}
        <LinearGradient colors={['#12121e', '#0a0a0f']} style={styles.sedeSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionBadge}>📍 Bogotá, Colombia</Text>
            <Text style={styles.sectionTitle}>
              Entrená en el{' '}
              <Text style={styles.sectionTitleAccent}>Templo</Text>
            </Text>
          </View>

          <Text style={styles.sedeDesc}>
            <Text style={styles.sedeDescAccent}>Sport Gym Sede 80</Text> es la sede principal
            de nuestra cadena en Bogotá. Equipamiento Technogym y Life Fitness de última generación,
            piscina semiolímpica y salones de funcional, boxeo y spinning.
          </Text>

          <View style={styles.sedeStatsRow}>
            {SEDE_STATS.map(st => (
              <View key={st.label} style={styles.sedeStatItem}>
                <Text style={styles.sedeStatValor}>{st.valor}</Text>
                <Text style={styles.sedeStatLabel}>{st.label}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>

        {/* ═══════ CTA ¿YA ERES MIEMBRO? ═══════ */}
        <LinearGradient
          colors={['rgba(227,28,37,0.08)', 'transparent']}
          style={styles.ctaSection}
        >
          <View style={styles.ctaGlow} />
          <Text style={styles.ctaEmoji}>💪</Text>
          <Text style={styles.ctaTitle}>¿Ya sos miembro?</Text>
          <Text style={styles.ctaDesc}>
            Iniciá sesión para acceder a tu plan de entrenamiento, dieta y seguimiento de progreso.
          </Text>
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
        </LinearGradient>

        {/* ═══════ FOOTER ═══════ */}
        <View style={styles.footer}>
          <Text style={styles.footerCopy}>
            © 2026 <Text style={styles.footerCopyBold}>MetaFit</Text> · Sport Gym Sede 80
          </Text>
          <Text style={styles.footerLocation}>Bogotá, Colombia</Text>
          <View style={styles.footerContact}>
            <Text style={styles.footerContactItem}>📧 admin@metafit.com</Text>
            <Text style={styles.footerContactItem}>📱 @sportgymsede80</Text>
          </View>
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

  // ── HERO ──
  hero: {
    paddingTop: 60,
    paddingBottom: 50,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  heroGlow: {
    position: 'absolute',
    top: -80,
    right: -80,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(227,28,37,0.12)',
  },
  heroContent: {
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  heroBadge: {
    fontSize: FONTS.xsmall,
    color: COLORS.red,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: SPACING.md,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: 'rgba(227,28,37,0.15)',
    overflow: 'hidden',
  },
  heroLogo: {
    fontSize: 72,
    marginBottom: SPACING.sm,
  },
  heroTitle: {
    fontSize: 44,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: 2,
  },
  heroSubtitle: {
    fontSize: FONTS.subtitle,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    fontWeight: '500',
  },
  heroTagline: {
    fontSize: FONTS.body,
    color: COLORS.red,
    marginTop: SPACING.lg,
    fontStyle: 'italic',
    fontWeight: '500',
  },
  heroDesc: {
    fontSize: FONTS.small,
    color: COLORS.textMuted,
    marginTop: SPACING.md,
    textAlign: 'center',
    lineHeight: 20,
  },
  heroCtaWrap: {
    marginTop: SPACING.xl,
    ...SHADOWS.card,
  },
  heroCta: {
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  heroCtaText: {
    color: COLORS.text,
    fontSize: FONTS.body,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // ── KPIs ──
  kpisSection: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
    marginTop: -20,
  },
  kpisGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  kpiCard: {
    width: '47%',
    backgroundColor: COLORS.bgCard,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm + 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.subtle,
  },
  kpiEmoji: {
    fontSize: 28,
    marginBottom: SPACING.xs,
  },
  kpiValor: {
    fontSize: FONTS.title - 2,
    fontWeight: '800',
    color: COLORS.text,
  },
  kpiLabel: {
    fontSize: FONTS.small - 1,
    color: COLORS.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },

  // ── SECCIÓN ──
  section: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl + 8,
  },
  sectionHeader: {
    marginBottom: SPACING.md + 4,
  },
  sectionBadge: {
    fontSize: FONTS.xsmall,
    color: COLORS.red,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: SPACING.xs,
  },
  sectionTitle: {
    fontSize: FONTS.subtitle + 2,
    fontWeight: '700',
    color: COLORS.text,
    lineHeight: 26,
  },
  sectionTitleAccent: {
    color: COLORS.red,
  },

  // ── FEATURES ──
  featureCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm + 2,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.subtle,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIconWrap: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
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
    marginTop: 3,
    lineHeight: 18,
  },

  // ── STEPS ──
  stepCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
    backgroundColor: COLORS.bgCard,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.subtle,
  },
  stepBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
    marginTop: 2,
  },
  stepBadgeText: {
    fontSize: FONTS.small,
    fontWeight: '800',
    color: COLORS.text,
  },
  stepContent: {
    flex: 1,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepIcon: {
    fontSize: 18,
    marginRight: SPACING.sm,
  },
  stepText: {
    fontSize: FONTS.body,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  stepSub: {
    fontSize: FONTS.small - 1,
    color: COLORS.textSecondary,
    marginTop: 4,
    marginLeft: 30,
  },

  // ── SEDE ──
  sedeSection: {
    marginTop: SPACING.xl + 8,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xl,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  sedeDesc: {
    fontSize: FONTS.small,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: SPACING.lg,
  },
  sedeDescAccent: {
    color: COLORS.text,
    fontWeight: '600',
  },
  sedeStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sedeStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  sedeStatValor: {
    fontSize: FONTS.subtitle - 2,
    fontWeight: '700',
    color: COLORS.text,
  },
  sedeStatLabel: {
    fontSize: FONTS.xsmall,
    color: COLORS.textMuted,
    marginTop: 2,
    textAlign: 'center',
  },

  // ── CTA ──
  ctaSection: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl + 8,
    paddingBottom: SPACING.xl,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  ctaGlow: {
    position: 'absolute',
    top: 20,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(227,28,37,0.05)',
  },
  ctaEmoji: {
    fontSize: 56,
    marginBottom: SPACING.md,
  },
  ctaTitle: {
    fontSize: FONTS.title,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  ctaDesc: {
    fontSize: FONTS.small,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.lg,
  },
  ctaButton: {
    paddingVertical: 16,
    paddingHorizontal: 60,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    minWidth: 220,
    ...SHADOWS.card,
  },
  ctaButtonText: {
    color: COLORS.text,
    fontSize: FONTS.body,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // ── FOOTER ──
  footer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl + 8,
    paddingHorizontal: SPACING.lg,
  },
  footerCopy: {
    fontSize: FONTS.small,
    color: COLORS.textMuted,
  },
  footerCopyBold: {
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  footerLocation: {
    fontSize: FONTS.small,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
  },
  footerContact: {
    flexDirection: 'row',
    marginTop: SPACING.md,
    gap: SPACING.lg,
  },
  footerContactItem: {
    fontSize: FONTS.xsmall,
    color: COLORS.textMuted,
  },
});
