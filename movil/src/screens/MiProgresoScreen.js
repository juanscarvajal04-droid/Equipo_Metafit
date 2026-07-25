import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GRADIENTS, FONTS, SPACING, SHADOWS, BORDER_RADIUS } from '../theme';
import { getMiProgreso } from '../services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function ProgressStatCard({ icon, label, value, color }) {
  return (
    <View style={{
      backgroundColor: COLORS.bgCard,
      borderRadius: BORDER_RADIUS.md,
      padding: SPACING.md,
      alignItems: 'center',
      flex: 1,
      marginHorizontal: SPACING.xs,
      ...SHADOWS.subtle,
    }}>
      <View style={{
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: `${color}20`,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.sm,
      }}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={{ color: COLORS.text, fontSize: FONTS.subtitle, fontWeight: '800' }}>{value}</Text>
      <Text style={{ color: COLORS.textSecondary, fontSize: FONTS.xsmall, marginTop: 2, textAlign: 'center' }}>
        {label}
      </Text>
    </View>
  );
}

function ProgresoItem({ item, isLatest }) {
  const fecha = item.fecha || item.created_at || '-';
  const peso = item.peso ?? '-';
  const imc = item.imc ?? item.IMC ?? '-';
  const grasa = item.grasa_corporal ?? item.grasa ?? item.porcentaje_grasa ?? '-';
  const musculo = item.masa_muscular ?? item.musculo ?? '-';
  const cintura = item.cintura ?? '-';

  return (
    <LinearGradient
      colors={isLatest ? [COLORS.purple, COLORS.purpleDark] : [COLORS.bgCard, COLORS.bgCard]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.md,
        marginBottom: SPACING.md,
        ...(isLatest ? SHADOWS.purple : SHADOWS.subtle),
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm }}>
        <Text style={{
          color: isLatest ? '#fff' : COLORS.text,
          fontSize: FONTS.body,
          fontWeight: '700',
        }}>
          {fecha}
        </Text>
        {isLatest && (
          <View style={{
            backgroundColor: 'rgba(255,255,255,0.2)',
            borderRadius: 12,
            paddingHorizontal: 10,
            paddingVertical: 3,
          }}>
            <Text style={{ color: '#fff', fontSize: FONTS.xsmall, fontWeight: '700' }}>ÚLTIMO</Text>
          </View>
        )}
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {peso !== '-' && (
          <View style={{ width: '50%', paddingVertical: SPACING.xs }}>
            <Text style={{ color: isLatest ? 'rgba(255,255,255,0.6)' : COLORS.textSecondary, fontSize: FONTS.xsmall }}>
              Peso
            </Text>
            <Text style={{ color: isLatest ? '#fff' : COLORS.text, fontSize: FONTS.body, fontWeight: '600' }}>
              {peso} kg
            </Text>
          </View>
        )}
        {imc !== '-' && (
          <View style={{ width: '50%', paddingVertical: SPACING.xs }}>
            <Text style={{ color: isLatest ? 'rgba(255,255,255,0.6)' : COLORS.textSecondary, fontSize: FONTS.xsmall }}>
              IMC
            </Text>
            <Text style={{ color: isLatest ? '#fff' : COLORS.text, fontSize: FONTS.body, fontWeight: '600' }}>
              {imc}
            </Text>
          </View>
        )}
        {grasa !== '-' && (
          <View style={{ width: '50%', paddingVertical: SPACING.xs }}>
            <Text style={{ color: isLatest ? 'rgba(255,255,255,0.6)' : COLORS.textSecondary, fontSize: FONTS.xsmall }}>
              Grasa Corporal
            </Text>
            <Text style={{ color: isLatest ? '#fff' : COLORS.text, fontSize: FONTS.body, fontWeight: '600' }}>
              {grasa}%
            </Text>
          </View>
        )}
        {musculo !== '-' && (
          <View style={{ width: '50%', paddingVertical: SPACING.xs }}>
            <Text style={{ color: isLatest ? 'rgba(255,255,255,0.6)' : COLORS.textSecondary, fontSize: FONTS.xsmall }}>
              Masa Muscular
            </Text>
            <Text style={{ color: isLatest ? '#fff' : COLORS.text, fontSize: FONTS.body, fontWeight: '600' }}>
              {musculo} kg
            </Text>
          </View>
        )}
        {cintura !== '-' && (
          <View style={{ width: '50%', paddingVertical: SPACING.xs }}>
            <Text style={{ color: isLatest ? 'rgba(255,255,255,0.6)' : COLORS.textSecondary, fontSize: FONTS.xsmall }}>
              Cintura
            </Text>
            <Text style={{ color: isLatest ? '#fff' : COLORS.text, fontSize: FONTS.body, fontWeight: '600' }}>
              {cintura} cm
            </Text>
          </View>
        )}
      </View>
    </LinearGradient>
  );
}

export default function MiProgresoScreen() {
  const [progreso, setProgreso] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const res = await getMiProgreso();
      const data = res.data?.progreso || res.data || [];
      setProgreso(Array.isArray(data) ? data : []);
    } catch (_) {
      setError('Error al cargar el progreso.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.purple} />
      </View>
    );
  }

  const latest = progreso[0] || null;
  const history = showAll ? progreso.slice(1) : progreso.slice(1, 5);
  const hasMore = progreso.length > 5;

  const pesoActual = latest?.peso ?? '-';
  const pesoAnterior = progreso[1]?.peso ?? null;
  const diffPeso = (pesoActual !== '-' && pesoAnterior != null)
    ? (Number(pesoActual) - Number(pesoAnterior)).toFixed(1)
    : null;

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <LinearGradient colors={GRADIENTS.purple} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={{ paddingHorizontal: SPACING.lg, paddingTop: SPACING.xl, paddingBottom: SPACING.lg }}>
        <Text style={{ color: '#fff', fontSize: FONTS.title, fontWeight: '800' }}>Mi Progreso</Text>
        <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: FONTS.body, marginTop: 4 }}>
          Evolución física
        </Text>
      </LinearGradient>

      {error ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.lg }}>
          <Ionicons name="alert-circle-outline" size={48} color={COLORS.textSecondary} />
          <Text style={{ color: COLORS.textSecondary, fontSize: FONTS.body, marginTop: SPACING.md, textAlign: 'center' }}>
            {error}
          </Text>
        </View>
      ) : progreso.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.lg }}>
          <Ionicons name="bar-chart-outline" size={48} color={COLORS.textSecondary} />
          <Text style={{ color: COLORS.textSecondary, fontSize: FONTS.body, marginTop: SPACING.md, textAlign: 'center' }}>
            Aún no hay registros de progreso.
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: SPACING.md, paddingBottom: SPACING.xl }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.purple} colors={[COLORS.purple]} />
          }
        >
          <View style={{ flexDirection: 'row', marginBottom: SPACING.lg }}>
            <ProgressStatCard icon="scale-outline" label="Peso Actual" value={`${pesoActual} kg`} color={COLORS.purpleLight} />
            <ProgressStatCard
              icon="trending-down-outline"
              label="Cambio"
              value={diffPeso != null ? `${diffPeso} kg` : '-'}
              color={diffPeso != null && Number(diffPeso) < 0 ? COLORS.check : COLORS.warning}
            />
            <ProgressStatCard icon="calendar-outline" label="Registros" value={`${progreso.length}`} color={COLORS.water} />
          </View>

          {latest && (
            <View style={{ marginBottom: SPACING.md }}>
              <Text style={{ color: COLORS.text, fontSize: FONTS.body, fontWeight: '700', marginBottom: SPACING.sm }}>
                Último Registro
              </Text>
              <ProgresoItem item={latest} isLatest />
            </View>
          )}

          {history.length > 0 && (
            <View>
              <Text style={{ color: COLORS.text, fontSize: FONTS.body, fontWeight: '700', marginBottom: SPACING.sm }}>
                Historial
              </Text>
              {history.map((item, i) => (
                <ProgresoItem key={item.id_progreso || i} item={item} isLatest={false} />
              ))}
            </View>
          )}

          {hasMore && (
            <TouchableOpacity
              onPress={() => setShowAll(!showAll)}
              activeOpacity={0.7}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: COLORS.bgCard,
                borderRadius: BORDER_RADIUS.md,
                padding: SPACING.md,
                marginTop: SPACING.sm,
                ...SHADOWS.subtle,
              }}
            >
              <Ionicons
                name={showAll ? 'chevron-up-outline' : 'chevron-down-outline'}
                size={20}
                color={COLORS.purpleLight}
                style={{ marginRight: SPACING.sm }}
              />
              <Text style={{ color: COLORS.purpleLight, fontSize: FONTS.body, fontWeight: '600' }}>
                {showAll ? 'Mostrar menos' : 'Ver historial completo'}
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      )}
    </View>
  );
}
