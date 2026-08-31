import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, GRADIENTS, FONTS, SPACING, SHADOWS, BORDER_RADIUS } from '../theme';
import {
  getMisCiclos,
  getPlanNutricional,
  guardarAgua,
  getAguaHoy,
  guardarConsumoAlimento,
} from '../services/api';
import { seleccionarCicloActivo } from '../utils/cicloUtils';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAX_VASOS = 8;

function VasoAgua({ lleno, index, onPress }) {
  return (
    <TouchableOpacity onPress={() => onPress(index)} activeOpacity={0.7}
      style={{ alignItems: 'center', width: (SCREEN_WIDTH - SPACING.md * 2 - SPACING.xl * 2) / 8 }}>
      <Ionicons
        name={lleno ? 'water' : 'water-outline'}
        size={30}
        color={lleno ? COLORS.water : 'rgba(59,130,246,0.3)'}
      />
    </TouchableOpacity>
  );
}

function ComidaCard({ numComida, alimentos, consumidos, onToggle, onRegistrar }) {
  const total = alimentos.length;
  const hechos = alimentos.filter((a) => consumidos[a.id_alimento]).length;
  const progress = total > 0 ? hechos / total : 0;

  return (
    <View style={{
      backgroundColor: COLORS.bgCard,
      borderRadius: BORDER_RADIUS.lg,
      padding: SPACING.md,
      marginBottom: SPACING.md,
      ...SHADOWS.card,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm }}>
        <LinearGradient colors={GRADIENTS.purpleDark} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: SPACING.sm,
          }}>
          <Ionicons name="restaurant-outline" size={18} color="#fff" />
        </LinearGradient>
        <View style={{ flex: 1 }}>
          <Text style={{ color: COLORS.text, fontSize: FONTS.body, fontWeight: '700' }}>
            Comida {numComida}
          </Text>
          <Text style={{ color: COLORS.textSecondary, fontSize: FONTS.small }}>
            {hechos}/{total} alimentos
          </Text>
        </View>
        <Text style={{ color: progress >= 1 ? COLORS.check : COLORS.purpleLight, fontWeight: '700', fontSize: FONTS.subtitle }}>
          {Math.round(progress * 100)}%
        </Text>
      </View>

      <View style={{ height: 4, backgroundColor: COLORS.border, borderRadius: 2, marginBottom: SPACING.sm }}>
        <View style={{
          width: `${progress * 100}%`,
          height: '100%',
          backgroundColor: progress >= 1 ? COLORS.check : COLORS.purple,
          borderRadius: 2,
        }} />
      </View>

      {alimentos.map((al) => {
        const done = consumidos[al.id_alimento];
        return (
          <View
            key={al.id_alimento}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: SPACING.sm,
              borderBottomWidth: 1,
              borderBottomColor: COLORS.border,
            }}
          >
            <TouchableOpacity
              onPress={() => onToggle(al.id_alimento)}
              activeOpacity={0.7}
              style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
            >
              <LinearGradient
                colors={done ? ['#10b981', '#059669'] : COLORS.borderActive ? ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)'] : ['#333', '#333']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: SPACING.md,
                }}
              >
                {done && <Ionicons name="checkmark" size={16} color="#fff" />}
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={{
                  color: COLORS.text,
                  fontSize: FONTS.body,
                  fontWeight: '500',
                  textDecorationLine: done ? 'line-through' : 'none',
                  opacity: done ? 0.6 : 1,
                }}>
                  {al.nombre || `Alimento ${al.id_alimento}`}
                </Text>
                {(al.calorias || al.cantidad) && (
                  <Text style={{ color: COLORS.textSecondary, fontSize: FONTS.small, marginTop: 1 }}>
                    {al.cantidad ? `${al.cantidad}g` : ''}
                    {al.cantidad && al.calorias ? ' · ' : ''}
                    {al.calorias ? `${al.calorias} kcal` : ''}
                  </Text>
                )}
              </View>
              {done && <Ionicons name="checkmark-circle" size={18} color={COLORS.check} />}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onRegistrar(al)}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={{ padding: SPACING.xs, marginLeft: SPACING.sm }}
            >
              <Ionicons name="add-circle-outline" size={20} color={COLORS.purpleLight} />
            </TouchableOpacity>
          </View>
        );
      })}
    </View>
  );
}

export default function MiDietaScreen() {
  const navigation = useNavigation();
  const [ciclo, setCiclo] = useState(null);
  const [ciclos, setCiclos] = useState([]);
  const [showPicker, setShowPicker] = useState(false);
  const [alimentos, setAlimentos] = useState([]);
  const [agua, setAgua] = useState(0);
  const [consumidos, setConsumidos] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingAgua, setSavingAgua] = useState(false);
  const [error, setError] = useState(null);

  const hoy = new Date().toISOString().slice(0, 10);

  const fetchData = useCallback(async (cicloSeleccionado) => {
    try {
      setError(null);
      const ciclosRes = await getMisCiclos();
      const allCiclos = Array.isArray(ciclosRes.data) ? ciclosRes.data : [];
      setCiclos(allCiclos);

      const cicloData = cicloSeleccionado || seleccionarCicloActivo(allCiclos);
      if (!cicloData) {
        setError('No tenés un ciclo asignado.');
        setLoading(false);
        return;
      }
      setCiclo(cicloData);

      const [planRes, aguaRes] = await Promise.all([
        getPlanNutricional(cicloData.id_ciclo),
        getAguaHoy(hoy).catch(() => ({ data: { vasos: 0 } })),
      ]);

      // Contrato real del backend: { detalle: [{ num_comida, id_alimento, cantidad_g, nombre_alimento, ... }] }
      const planData = planRes.data?.detalle || planRes.data?.alimentos || planRes.data?.plan || [];
      const alimentosPlan = (Array.isArray(planData) ? planData : []).map((a) => ({
        ...a,
        nombre: a.nombre_alimento || a.nombre,
        cantidad: a.cantidad_g ?? a.cantidad,
        calorias: a.calorias_por_100g ?? a.calorias,
      }));
      setAlimentos(alimentosPlan);

      setAgua(aguaRes.data?.vasos ?? 0);

      const ids = Array.isArray(planData) ? planData.map((a) => a.id_alimento) : [];
      setConsumidos({});
    } catch (err) {
      setError('Error al cargar el plan nutricional.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const handleCicloChange = (c) => {
    setShowPicker(false);
    setLoading(true);
    fetchData(c);
  };

  const handleAgua = async (index) => {
    const nuevosVasos = index + 1 === agua ? index : index + 1;
    setAgua(nuevosVasos);
    setSavingAgua(true);
    try {
      await guardarAgua(hoy, nuevosVasos);
    } catch (_) {
      setAgua(agua);
    } finally {
      setSavingAgua(false);
    }
  };

  const toggleAlimento = (id) => {
    setConsumidos((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const openRegistro = (al) => {
    navigation.getParent()?.navigate('RegistroConsumo', {
      id_ciclo: ciclo?.id_ciclo,
      num_comida: al.num_comida || 1,
      id_alimento: al.id_alimento,
      nombre: al.nombre || al.nombre_alimento,
    });
  };

  const handleSave = async () => {
    if (!ciclo) return;
    setSaving(true);
    try {
      const alimentosArr = alimentos.map((a) => ({
        id_alimento: a.id_alimento,
        num_comida: a.num_comida || 1,
        consumido: !!consumidos[a.id_alimento],
      }));
      await guardarConsumoAlimento(ciclo.id_ciclo, hoy, alimentosArr);
      Alert.alert('Guardado', 'Consumo de alimentos guardado.');
    } catch (_) {
      Alert.alert('Error', 'No se pudo guardar el consumo.');
    } finally {
      setSaving(false);
    }
  };

  const getComidas = () => {
    const grupos = {};
    alimentos.forEach((al) => {
      const nc = al.num_comida || 1;
      if (!grupos[nc]) grupos[nc] = [];
      grupos[nc].push(al);
    });
    return Object.entries(grupos).sort(([a], [b]) => Number(a) - Number(b));
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.purple} />
      </View>
    );
  }

  const comidas = getComidas();
  const totalAlimentos = alimentos.length;
  const consumidosCount = Object.values(consumidos).filter(Boolean).length;
  const progressAlimentos = totalAlimentos > 0 ? consumidosCount / totalAlimentos : 0;

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <LinearGradient colors={GRADIENTS.purple} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={{ paddingHorizontal: SPACING.lg, paddingTop: SPACING.xl, paddingBottom: SPACING.lg }}>
        <Text style={{ color: '#fff', fontSize: FONTS.title, fontWeight: '800' }}>Mi Dieta</Text>
        <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: FONTS.body, marginTop: 4 }}>{hoy}</Text>

        <View style={{
          backgroundColor: 'rgba(255,255,255,0.1)',
          borderRadius: BORDER_RADIUS.lg,
          padding: SPACING.md,
          marginTop: SPACING.md,
        }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm }}>
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: FONTS.small }}>Agua</Text>
            <Text style={{ color: '#fff', fontSize: FONTS.subtitle, fontWeight: '700' }}>
              {agua}/{MAX_VASOS}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
            {Array.from({ length: MAX_VASOS }, (_, i) => (
              <VasoAgua key={i} index={i} lleno={i < agua} onPress={handleAgua} />
            ))}
          </View>
        </View>

        {ciclos.length > 1 && (
          <TouchableOpacity
            onPress={() => setShowPicker(!showPicker)}
            activeOpacity={0.7}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: 'rgba(255,255,255,0.15)',
              borderRadius: BORDER_RADIUS.md,
              padding: SPACING.sm,
              marginTop: SPACING.sm,
            }}
          >
            <Ionicons name="swap-horizontal" size={16} color="rgba(255,255,255,0.7)" />
            <Text style={{ color: '#fff', fontSize: FONTS.small, marginLeft: SPACING.xs, flex: 1 }}>
              Ciclo: {ciclo?.nombre_ciclo || ciclo?.id_ciclo}
            </Text>
            <Ionicons name={showPicker ? 'chevron-up' : 'chevron-down'} size={16} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
        )}

        {showPicker && (
          <View style={{
            backgroundColor: COLORS.bgCard,
            borderRadius: BORDER_RADIUS.md,
            marginTop: SPACING.sm,
            overflow: 'hidden',
          }}>
            {ciclos.map((c) => {
              const activo = c.id_ciclo === ciclo?.id_ciclo;
              return (
                <TouchableOpacity
                  key={c.id_ciclo}
                  onPress={() => handleCicloChange(c)}
                  activeOpacity={0.7}
                  style={{
                    paddingVertical: SPACING.sm,
                    paddingHorizontal: SPACING.md,
                    borderBottomWidth: 1,
                    borderBottomColor: COLORS.border,
                    backgroundColor: activo ? 'rgba(168,85,247,0.2)' : 'transparent',
                  }}
                >
                  <Text style={{ color: COLORS.text, fontSize: FONTS.body, fontWeight: activo ? '700' : '400' }}>
                    {c.nombre_ciclo || `Ciclo ${c.id_ciclo}`}
                  </Text>
                  <Text style={{ color: COLORS.textSecondary, fontSize: FONTS.small, marginTop: 2 }}>
                    {c.fecha_inicio} — {c.fecha_fin || 'Activo'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </LinearGradient>

      {error ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.lg }}>
          <Ionicons name="alert-circle-outline" size={48} color={COLORS.textSecondary} />
          <Text style={{ color: COLORS.textSecondary, fontSize: FONTS.body, marginTop: SPACING.md, textAlign: 'center' }}>
            {error}
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: SPACING.md, paddingBottom: 100 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.purple} colors={[COLORS.purple]} />
          }
        >
          {comidas.length === 0 ? (
            <Text style={{ color: COLORS.textSecondary, textAlign: 'center', marginTop: SPACING.lg }}>
              No hay alimentos en tu plan actual.
            </Text>
          ) : (
            comidas.map(([num, al]) => (
              <ComidaCard
                key={num}
                numComida={num}
                alimentos={al}
                consumidos={consumidos}
                onToggle={toggleAlimento}
                onRegistrar={openRegistro}
              />
            ))
          )}
        </ScrollView>
      )}

      {!error && (
        <View style={{
          position: 'absolute',
          bottom: 30,
          left: SPACING.lg,
          right: SPACING.lg,
        }}>
          <TouchableOpacity onPress={handleSave} disabled={saving} activeOpacity={0.8}>
            <LinearGradient
              colors={saving ? ['#555', '#555'] : GRADIENTS.purple}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                borderRadius: BORDER_RADIUS.lg,
                padding: SPACING.md,
                alignItems: 'center',
                ...SHADOWS.purple,
              }}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={{ color: '#fff', fontSize: FONTS.body, fontWeight: '700' }}>
                  Guardar Progreso
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
