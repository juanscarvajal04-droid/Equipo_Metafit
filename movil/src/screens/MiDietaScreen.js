import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { formatearFechaLegible, nombreComida } from '../utils/formateadores';
import BarraAgua from '../components/common/BarraAgua';
import ScreenHeader from '../components/common/ScreenHeader';
import CicloPicker from '../components/common/CicloPicker';
import ErrorState from '../components/common/ErrorState';
import SaveProgressButton from '../components/common/SaveProgressButton';
import { mensajeErrorCarga } from '../utils/errorUtils';
import useAutoRefresh from '../hooks/useAutoRefresh';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAX_VASOS = 8;

function VasoAgua({ lleno, index, onPress }) {
  return (
    <TouchableOpacity onPress={() => onPress(index)} activeOpacity={0.7} testID={`vaso-agua-${index}`}
      style={{ alignItems: 'center', width: (SCREEN_WIDTH - SPACING.md * 2 - SPACING.xl * 2) / 8 }}>
      <Ionicons
        name={lleno ? 'water' : 'water-outline'}
        size={30}
        color={lleno ? COLORS.water : 'rgba(59,130,246,0.3)'}
      />
    </TouchableOpacity>
  );
}

function ComidaCard({ comidaNombre, alimentos, consumidos, onToggle, onRegistrar }) {
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
            {comidaNombre}
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
              testID={`toggle-alimento-${al.id_alimento}`}
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
              testID={`registrar-alimento-${al.id_alimento}`}
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
  const [recomendacionAgua, setRecomendacionAgua] = useState(null);
  const [consumidos, setConsumidos] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingAgua, setSavingAgua] = useState(false);
  const [error, setError] = useState(null);
  const [actualizando, setActualizando] = useState(false);
  const cicloIdRef = useRef(null);

  const hoy = new Date().toISOString().slice(0, 10);

  const fetchData = useCallback(async (cicloSeleccionado, opts = {}) => {
    try {
      setError(null);
      const ciclosRes = await getMisCiclos();
      const allCiclos = Array.isArray(ciclosRes.data) ? ciclosRes.data : [];
      setCiclos(allCiclos);

      const cicloData = cicloSeleccionado || seleccionarCicloActivo(allCiclos);
      setCiclo(cicloData || null);
      const cicloCambio = cicloIdRef.current !== (cicloData?.id_ciclo ?? null);
      cicloIdRef.current = cicloData?.id_ciclo ?? null;

      // El agua no requiere ciclo activo: se carga siempre (vacía si no hay registros).
      const aguaRes = await getAguaHoy(hoy).catch(() => ({ data: { vasos: 0 } }));
      setAgua(aguaRes.data?.vasos ?? 0);

      if (cicloData) {
        const planRes = await getPlanNutricional(cicloData.id_ciclo);

        // Recomendación diaria de agua definida por el entrenador (opcional).
        setRecomendacionAgua(planRes.data?.recomendacion_agua_vasos ?? null);

        // Contrato real del backend: { detalle: [{ num_comida, id_alimento, cantidad_g, nombre_alimento, ... }] }
        const planData = planRes.data?.detalle || planRes.data?.alimentos || planRes.data?.plan || [];
        const alimentosPlan = (Array.isArray(planData) ? planData : []).map((a) => ({
          ...a,
          nombre: a.nombre_alimento || a.nombre,
          cantidad: a.cantidad_g ?? a.cantidad,
          calorias: a.calorias_por_100g ?? a.calorias,
        }));
        setAlimentos(alimentosPlan);
        if (cicloCambio || !opts.silent) setConsumidos({});
      } else {
        // Sin ciclo activo: plan vacío, pero la pantalla sigue disponible
        // (solo el módulo de agua muestra el aviso y queda deshabilitado).
        setAlimentos([]);
        setRecomendacionAgua(null);
        setConsumidos({});
      }
    } catch (err) {
      const mensaje = mensajeErrorCarga(err);
      if (mensaje) setError(mensaje);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void fetchData(); }, [fetchData]);

  // Sincronización tiempo real: polling 10s (silencioso, conserva consumo marcado)
  useAutoRefresh(() => fetchData(undefined, { silent: true }), 10000);

  const onRefresh = () => { setRefreshing(true); void fetchData(); };

  const onActualizar = () => {
    setActualizando(true);
    void fetchData(ciclo).finally(() => setActualizando(false));
  };

  const handleCicloChange = (c) => {
    setShowPicker(false);
    setLoading(true);
    void fetchData(c);
  };

  const handleAgua = async (index) => {
    const aguaAnterior = agua;
    const nuevosVasos = index + 1 === agua ? index : index + 1;
    setAgua(nuevosVasos);
    setSavingAgua(true);
    try {
      await guardarAgua(hoy, nuevosVasos);
    } catch (_) {
      setAgua(aguaAnterior);
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
      macrosPor100g: {
        calorias: al.calorias ?? null,
        proteinas: al.proteinas ?? null,
        carbohidratos: al.carbohidratos ?? null,
        grasas: al.grasas ?? null,
      },
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
      Alert.alert('✅ Progreso guardado', 'Tu consumo de alimentos fue guardado.');
    } catch (_) {
      Alert.alert('❌ No se pudo guardar', 'Verificá tu conexión e intentá de nuevo.');
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
      <ScreenHeader
        title="Mi Dieta"
        subtitle={formatearFechaLegible(hoy)}
        refreshing={actualizando}
        onRefresh={onActualizar}
      >
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

          {!ciclo ? (
            <View style={{ paddingVertical: SPACING.xs }}>
              <Text style={{ color: '#fff', fontSize: FONTS.small, textAlign: 'center' }}>
                Para registrar agua necesitás un ciclo activo.
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: FONTS.xsmall, textAlign: 'center', marginTop: 4 }}>
                Pedile a tu entrenador que te asigne uno.
              </Text>
            </View>
          ) : (
            <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
              {Array.from({ length: MAX_VASOS }, (_, i) => (
                <VasoAgua key={i} index={i} lleno={i < agua} onPress={handleAgua} />
              ))}
            </View>
          )}

          <BarraAgua actual={agua} meta={MAX_VASOS} />

          {recomendacionAgua != null && (
            <View style={{
              marginTop: SPACING.sm,
              backgroundColor: 'rgba(255,255,255,0.12)',
              borderRadius: BORDER_RADIUS.md,
              paddingVertical: SPACING.xs,
              paddingHorizontal: SPACING.sm,
            }}>
              <Text style={{ color: '#fff', fontSize: FONTS.small, textAlign: 'center' }}>
                💧 Recomendado: {recomendacionAgua} vasos /{' '}
                {Number((Number(recomendacionAgua) * 0.25).toFixed(2))} L al día
              </Text>
            </View>
          )}
        </View>

        <CicloPicker
          ciclos={ciclos}
          ciclo={ciclo}
          showPicker={showPicker}
          onToggle={() => setShowPicker(!showPicker)}
          onSelect={handleCicloChange}
        />
      </ScreenHeader>

      {error ? (
        <ErrorState message={error} />
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
                comidaNombre={nombreComida(num)}
                alimentos={al}
                consumidos={consumidos}
                onToggle={toggleAlimento}
                onRegistrar={openRegistro}
              />
            ))
          )}
        </ScrollView>
      )}

      {!error && <SaveProgressButton saving={saving} onPress={handleSave} />}
    </View>
  );
}
