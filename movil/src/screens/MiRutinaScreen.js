import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Animated,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GRADIENTS, FONTS, SPACING, SHADOWS, BORDER_RADIUS } from '../theme';
import {
  getMisCiclos,
  getPlanEntrenamiento,
  guardarProgresoEjercicio,
  getProgresoEjercicioHoy,
} from '../services/api';
import { seleccionarCicloActivo } from '../utils/cicloUtils';

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const EJERCICIO_ROW_H = 58;
const INSTRUCCIONES_H = 96;

function DiaCard({ dia, ejercicios, completados, onToggle, expandido, setExpandido, detalleEjercicio, onToggleDetalle }) {
  const completadosCount = ejercicios.filter((e) => completados[e.id_ejercicio]).length;
  const total = ejercicios.length;
  const progress = total > 0 ? completadosCount / total : 0;

  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: expandido ? 1 : 0,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [expandido]);

  const contentHeight = ejercicios.reduce(
    (h, ej) => h + EJERCICIO_ROW_H + (detalleEjercicio === ej.id_ejercicio ? INSTRUCCIONES_H : 0),
    0
  );

  return (
    <View style={{
      backgroundColor: COLORS.bgCard,
      borderRadius: BORDER_RADIUS.lg,
      marginBottom: SPACING.md,
      overflow: 'hidden',
      ...SHADOWS.card,
    }}>
      <TouchableOpacity
        onPress={() => setExpandido(expandido === dia ? null : dia)}
        activeOpacity={0.7}
        style={{ padding: SPACING.md }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: progress === 1 ? COLORS.checkBg : COLORS.purpleGlow,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: SPACING.md,
          }}>
            <Ionicons
              name={progress === 1 ? 'checkmark-circle' : 'barbell-outline'}
              size={22}
              color={progress === 1 ? COLORS.check : COLORS.purpleLight}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: COLORS.text, fontSize: FONTS.body, fontWeight: '700' }}>{dia}</Text>
            <Text style={{ color: COLORS.textSecondary, fontSize: FONTS.small, marginTop: 2 }}>
              {completadosCount}/{total} ejercicios
            </Text>
          </View>
          <Ionicons
            name={expandido === dia ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={COLORS.textSecondary}
          />
        </View>

        <View style={{
          height: 4,
          borderRadius: 2,
          backgroundColor: COLORS.border,
          marginTop: SPACING.sm,
        }}>
          <View style={{
            width: `${progress * 100}%`,
            height: '100%',
            borderRadius: 2,
            backgroundColor: progress === 1 ? COLORS.check : COLORS.purple,
          }} />
        </View>
      </TouchableOpacity>

      <Animated.View style={{
        height: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, contentHeight],
        }),
        overflow: 'hidden',
      }}>
        <View style={{ paddingHorizontal: SPACING.md, paddingBottom: SPACING.md }}>
          {ejercicios.map((ej) => {
            const done = completados[ej.id_ejercicio];
            const detalleAbierto = detalleEjercicio === ej.id_ejercicio;
            return (
              <View
                key={ej.id_ejercicio}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: SPACING.sm,
                  borderBottomWidth: 1,
                  borderBottomColor: COLORS.border,
                }}
              >
                <TouchableOpacity
                  onPress={() => onToggle(ej.id_ejercicio)}
                  activeOpacity={0.7}
                  style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
                >
                  <LinearGradient
                    colors={done ? ['#10b981', '#059669'] : GRADIENTS.purpleDark}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 13,
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginRight: SPACING.md,
                    }}
                  >
                    {done && <Ionicons name="checkmark" size={18} color="#fff" />}
                  </LinearGradient>
                  <View style={{ flex: 1 }}>
                    <Text style={{
                      color: COLORS.text,
                      fontSize: FONTS.body,
                      fontWeight: '500',
                      textDecorationLine: done ? 'line-through' : 'none',
                      opacity: done ? 0.6 : 1,
                    }}>
                      {ej.nombre || `Ejercicio ${ej.id_ejercicio}`}
                    </Text>
                    {(ej.series || ej.repeticiones || ej.peso_kg != null || ej.descanso_seg != null) && (
                      <Text style={{ color: COLORS.textSecondary, fontSize: FONTS.small, marginTop: 1 }}>
                        {ej.series ? `${ej.series} series` : ''}
                        {ej.series && ej.repeticiones ? ' × ' : ''}
                        {ej.repeticiones ? `${ej.repeticiones} reps` : ''}
                        {ej.peso_kg != null ? ` · ${ej.peso_kg} kg` : ''}
                        {ej.descanso_seg != null ? ` · ${ej.descanso_seg}s descanso` : ''}
                      </Text>
                    )}
                    {detalleAbierto && (
                      <View style={{ marginTop: SPACING.sm, paddingTop: SPACING.sm, borderTopWidth: 1, borderTopColor: COLORS.border }}>
                        <Text style={{ color: COLORS.textSecondary, fontSize: FONTS.small, lineHeight: 18 }}>
                          {ej.instrucciones || 'Sin instrucciones disponibles para este ejercicio.'}
                        </Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => onToggleDetalle(ej.id_ejercicio)}
                  activeOpacity={0.7}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  style={{ padding: SPACING.xs, marginLeft: SPACING.sm }}
                >
                  <Ionicons
                    name={detalleAbierto ? 'chevron-up-circle-outline' : 'information-circle-outline'}
                    size={20}
                    color={COLORS.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      </Animated.View>
    </View>
  );
}

export default function MiRutinaScreen() {
  const [ciclo, setCiclo] = useState(null);
  const [ejercicios, setEjercicios] = useState([]);
  const [completados, setCompletados] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expandido, setExpandido] = useState(null);
  const [detalleEjercicio, setDetalleEjercicio] = useState(null);
  const [diaSeleccionado, setDiaSeleccionado] = useState(null);
  const [error, setError] = useState(null);

  const hoy = new Date().toISOString().slice(0, 10);
  const diaSemana = DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];
  const diaNumeroHoy = new Date().getDay() === 0 ? 7 : new Date().getDay();

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const ciclosRes = await getMisCiclos();
      const cicloData = seleccionarCicloActivo(ciclosRes.data);
      if (!cicloData) {
        setError('No tenés un ciclo asignado.');
        setLoading(false);
        return;
      }
      setCiclo(cicloData);

      const planRes = await getPlanEntrenamiento(cicloData.id_ciclo);
      // Contrato real del backend: { rutinas: [{ nombre_rutina, dia_numero, ejercicios: [...] }] }
      const rutinas = planRes.data?.rutinas || [];
      const ejerciciosPlan = rutinas.flatMap((r) =>
        (r.ejercicios || []).map((e) => ({
          ...e,
          nombre: e.nombre_ejercicio,
          dia: r.nombre_rutina,
          dia_numero: r.dia_numero,
        }))
      );
      setEjercicios(ejerciciosPlan);
      setDiaSeleccionado(null);

      const ids = ejerciciosPlan.map((e) => e.id_ejercicio);
      if (ids.length > 0) {
        try {
          const progRes = await getProgresoEjercicioHoy(cicloData.id_ciclo, hoy);
          const progArr = progRes.data?.ejercicios || progRes.data || [];
          const map = {};
          if (Array.isArray(progArr)) {
            progArr.forEach((p) => { if (p.id_ejercicio) map[p.id_ejercicio] = !!p.completado; });
          }
          setCompletados(map);
        } catch (_) {}
      }
    } catch (err) {
      setError('Error al cargar la rutina.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const toggleEjercicio = (id) => {
    setCompletados((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleDetalle = (id) => {
    setDetalleEjercicio((prev) => (prev === id ? null : id));
  };

  const handleSave = async () => {
    if (!ciclo) return;
    setSaving(true);
    try {
      const ejerciciosArr = ejercicios.map((e) => ({
        id_ejercicio: e.id_ejercicio,
        completado: !!completados[e.id_ejercicio],
      }));
      await guardarProgresoEjercicio(ciclo.id_ciclo, hoy, ejerciciosArr);
      Alert.alert('Guardado', 'Progreso de rutina guardado correctamente.');
    } catch (err) {
      console.log('save error', err);
      Alert.alert('Error', 'No se pudo guardar el progreso.');
    } finally {
      setSaving(false);
    }
  };

  const getDiasData = () => {
    const days = {};
    ejercicios.forEach((ej) => {
      const d = ej.dia || ej.nombre_dia || diaSemana;
      if (!days[d]) days[d] = [];
      days[d].push(ej);
    });
    return Object.entries(days).sort(
      (a, b) => (a[1][0].dia_numero ?? 99) - (b[1][0].dia_numero ?? 99)
    );
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.purple} />
      </View>
    );
  }

  const diasData = getDiasData();
  const diaDefault =
    diasData.find(([, ej]) => ej[0].dia_numero === diaNumeroHoy)?.[0] || diasData[0]?.[0] || null;
  const diaVisible = diaSeleccionado || diaDefault;
  const ejerciciosDia = diasData.find(([dia]) => dia === diaVisible)?.[1] || [];
  const totalEj = ejercicios.length;
  const totalDone = Object.values(completados).filter(Boolean).length;
  const globalProgress = totalEj > 0 ? totalDone / totalEj : 0;

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <LinearGradient colors={GRADIENTS.purple} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={{ paddingHorizontal: SPACING.lg, paddingTop: SPACING.xl, paddingBottom: SPACING.lg }}>
        <Text style={{ color: '#fff', fontSize: FONTS.title, fontWeight: '800' }}>Mi Rutina</Text>
        <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: FONTS.body, marginTop: 4 }}>
          {hoy} — {diaSemana}
        </Text>

        <View style={{
          flexDirection: 'row',
          backgroundColor: 'rgba(255,255,255,0.1)',
          borderRadius: BORDER_RADIUS.md,
          padding: SPACING.md,
          marginTop: SPACING.md,
          alignItems: 'center',
        }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: FONTS.small }}>
              Progreso global
            </Text>
            <Text style={{ color: '#fff', fontSize: FONTS.subtitle, fontWeight: '700' }}>
              {totalDone}/{totalEj} ejercicios
            </Text>
          </View>
          <View style={{ width: '45%', height: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 3 }}>
            <View style={{
              width: `${globalProgress * 100}%`,
              height: '100%',
              backgroundColor: '#fff',
              borderRadius: 3,
            }} />
          </View>
        </View>
      </LinearGradient>

      {error ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.lg }}>
          <Ionicons name="alert-circle-outline" size={48} color={COLORS.textSecondary} />
          <Text style={{ color: COLORS.textSecondary, fontSize: FONTS.body, marginTop: SPACING.md, textAlign: 'center' }}>
            {error}
          </Text>
        </View>
      ) : (
        <>
          {diasData.length > 0 && (
            <View style={{ paddingHorizontal: SPACING.md, paddingTop: SPACING.sm }}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: SPACING.sm }}
              >
                {diasData.map(([dia, ej]) => {
                  const activo = dia === diaVisible;
                  const label = DAYS[(ej[0].dia_numero ?? 1) - 1] || dia;
                  return (
                    <TouchableOpacity
                      key={dia}
                      onPress={() => setDiaSeleccionado(dia)}
                      activeOpacity={0.8}
                      style={{
                        paddingHorizontal: SPACING.md,
                        paddingVertical: SPACING.sm,
                        borderRadius: BORDER_RADIUS.md,
                        backgroundColor: activo ? COLORS.purple : COLORS.bgCard,
                        ...(activo ? SHADOWS.purple : SHADOWS.subtle),
                      }}
                    >
                      <Text style={{
                        color: activo ? '#fff' : COLORS.text,
                        fontSize: FONTS.small,
                        fontWeight: '600',
                      }}>
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          <ScrollView
            contentContainerStyle={{ padding: SPACING.md, paddingBottom: 100 }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.purple} colors={[COLORS.purple]} />
            }
          >
            {diasData.length === 0 ? (
              <Text style={{ color: COLORS.textSecondary, textAlign: 'center', marginTop: SPACING.lg }}>
                No hay ejercicios en tu plan actual.
              </Text>
            ) : (
              <DiaCard
                dia={diaVisible}
                ejercicios={ejerciciosDia}
                completados={completados}
                onToggle={toggleEjercicio}
                expandido={expandido}
                setExpandido={setExpandido}
                detalleEjercicio={detalleEjercicio}
                onToggleDetalle={toggleDetalle}
              />
            )}
          </ScrollView>
        </>
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