import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Animated,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, GRADIENTS, FONTS, SPACING, SHADOWS, BORDER_RADIUS } from '../theme';
import {
  getMisCiclos,
  getPlanEntrenamiento,
  getPlanRutinaDia,
  guardarProgresoEjercicio,
  getProgresoEjercicioHoy,
  guardarNotaEjercicio,
  getMisNotasEjercicio,
} from '../services/api';
import { seleccionarCicloActivo } from '../utils/cicloUtils';
import { formatearFechaLegible, capitalizar } from '../utils/formateadores';

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const EJERCICIO_ROW_H = 58;
const INSTRUCCIONES_H = 96;
const NOTA_H = 46;

function DiaCard({ dia, ejercicios, completados, onToggle, expandido, setExpandido, detalleEjercicio, onToggleDetalle, onRegistrar, grupo, notas, notaTextos, setNotaTexto, onGuardarNota, guardandoNota }) {
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
    (h, ej) => h + EJERCICIO_ROW_H + (detalleEjercicio === ej.id_ejercicio ? INSTRUCCIONES_H : 0) + NOTA_H,
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
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
              <Text style={{ color: COLORS.textSecondary, fontSize: FONTS.small }}>
                {completadosCount}/{total} ejercicios
              </Text>
              {grupo ? (
                <View style={{
                  backgroundColor: COLORS.purpleGlow,
                  borderRadius: 10,
                  paddingHorizontal: 8,
                  paddingVertical: 1,
                  marginLeft: SPACING.sm,
                }}>
                  <Text style={{ color: COLORS.purpleLight, fontSize: FONTS.xsmall, fontWeight: '600' }}>
                    {grupo}
                  </Text>
                </View>
              ) : null}
            </View>
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
            const notaActual = notas[ej.id_ejercicio] || '';
            const borradorNota = Object.prototype.hasOwnProperty.call(notaTextos, ej.id_ejercicio)
              ? notaTextos[ej.id_ejercicio]
              : notaActual;
            const guardandoEsta = guardandoNota === ej.id_ejercicio;
            return (
              <View
                key={ej.id_ejercicio}
                style={{
                  paddingVertical: SPACING.xs,
                  borderBottomWidth: 1,
                  borderBottomColor: COLORS.border,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
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
                  <TouchableOpacity
                    onPress={() => onRegistrar(ej)}
                    activeOpacity={0.7}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    style={{ padding: SPACING.xs, marginLeft: SPACING.xs }}
                  >
                    <Ionicons name="add-circle-outline" size={20} color={COLORS.purpleLight} />
                  </TouchableOpacity>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                  <TextInput
                    style={{
                      flex: 1,
                      backgroundColor: COLORS.bg,
                      borderRadius: BORDER_RADIUS.md,
                      borderWidth: 1,
                      borderColor: COLORS.border,
                      color: COLORS.text,
                      fontSize: FONTS.xsmall,
                      paddingHorizontal: SPACING.sm,
                      paddingVertical: 6,
                      marginRight: SPACING.sm,
                    }}
                    placeholder="💬 Nota para el entrenador…"
                    placeholderTextColor={COLORS.textSecondary}
                    value={borradorNota}
                    onChangeText={(txt) => setNotaTexto(ej.id_ejercicio, txt)}
                    multiline={false}
                  />
                  <TouchableOpacity
                    onPress={() => onGuardarNota(ej)}
                    activeOpacity={0.7}
                    disabled={guardandoEsta}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    style={{
                      height: 32,
                      minWidth: 32,
                      borderRadius: 16,
                      backgroundColor: COLORS.purpleGlow,
                      justifyContent: 'center',
                      alignItems: 'center',
                      paddingHorizontal: SPACING.xs,
                    }}
                  >
                    {guardandoEsta ? (
                      <ActivityIndicator size="small" color={COLORS.purple} />
                    ) : (
                      <Ionicons name="send" size={16} color={COLORS.purpleLight} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      </Animated.View>
    </View>
  );
}

export default function MiRutinaScreen() {
  const navigation = useNavigation();
  const [ciclo, setCiclo] = useState(null);
  const [ciclos, setCiclos] = useState([]);
  const [showPicker, setShowPicker] = useState(false);
  const [ejercicios, setEjercicios] = useState([]);
  const [completados, setCompletados] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expandido, setExpandido] = useState(null);
  const [detalleEjercicio, setDetalleEjercicio] = useState(null);
  const [diaSeleccionado, setDiaSeleccionado] = useState(null);
  const [rutinaDia, setRutinaDia] = useState(null);
  const [error, setError] = useState(null);
  const [notas, setNotas] = useState({});
  const [notaTextos, setNotaTextos] = useState({});
  const [guardandoNota, setGuardandoNota] = useState(null);
  const [actualizando, setActualizando] = useState(false);

  const hoy = new Date().toISOString().slice(0, 10);
  const diaSemana = DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];
  const diaNumeroHoy = new Date().getDay() === 0 ? 7 : new Date().getDay();

  // Rutina del día filtrada por su grupo muscular (endpoint FASE A.3).
  // Si el endpoint falla (día sin rutina), se cae al plan completo.
  const loadRutinaDia = useCallback(async (cicloId, diaNumero) => {
    setRutinaDia(null);
    if (!cicloId || !diaNumero) return;
    try {
      const res = await getPlanRutinaDia(cicloId, diaNumero);
      setRutinaDia(res.data || null);
    } catch (_) {
      setRutinaDia(null);
    }
  }, []);

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

      const planRes = await getPlanEntrenamiento(cicloData.id_ciclo);
      // Contrato real del backend: { rutinas: [{ nombre_rutina, dia_numero, ejercicios: [...] }] }
      const rutinas = planRes.data?.rutinas || [];
      const ejerciciosPlan = rutinas.flatMap((r) =>
        (r.ejercicios || []).map((e) => ({
          ...e,
          id_rutina: r.id_rutina,
          nombre: e.nombre_ejercicio,
          dia: r.nombre_rutina,
          dia_numero: r.dia_numero,
        }))
      );
      setEjercicios(ejerciciosPlan);
      setDiaSeleccionado(null);

      loadRutinaDia(cicloData.id_ciclo, diaNumeroHoy);

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

      // Parte 3: notas del afiliado sobre sus ejercicios (ciclo actual)
      try {
        const notaRes = await getMisNotasEjercicio(cicloData.id_ciclo);
        const notaArr = Array.isArray(notaRes.data) ? notaRes.data : [];
        const notaMap = {};
        notaArr.forEach((n) => { if (n.id_ejercicio) notaMap[n.id_ejercicio] = n.nota; });
        setNotas(notaMap);
      } catch (_) {}
    } catch (err) {
      setError('Error al cargar la rutina.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [loadRutinaDia, diaNumeroHoy]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const onActualizar = () => {
    setActualizando(true);
    fetchData(ciclo).finally(() => setActualizando(false));
  };

  const handleCicloChange = (c) => {
    setShowPicker(false);
    setDiaSeleccionado(null);
    setExpandido(null);
    setNotaTextos({});
    setLoading(true);
    fetchData(c);
  };

  const setNotaTexto = (idEjercicio, texto) => {
    setNotaTextos((prev) => ({ ...prev, [idEjercicio]: texto }));
  };

  const guardarNota = async (ej) => {
    if (!ciclo) return;
    const texto = (notaTextos[ej.id_ejercicio] ?? '').trim();
    if (!texto) {
      Alert.alert('Nota vacía', 'Escribí una nota para guardarla.');
      return;
    }
    setGuardandoNota(ej.id_ejercicio);
    try {
      await guardarNotaEjercicio({ id_ejercicio: ej.id_ejercicio, id_ciclo: ciclo.id_ciclo, nota: texto });
      setNotas((prev) => ({ ...prev, [ej.id_ejercicio]: texto }));
      Alert.alert('Guardado', 'Nota guardada correctamente.');
    } catch (err) {
      console.log('nota error', err);
      Alert.alert('Error', 'No se pudo guardar la nota.');
    } finally {
      setGuardandoNota(null);
    }
  };

  const toggleEjercicio = (id) => {
    setCompletados((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleDetalle = (id) => {
    setDetalleEjercicio((prev) => (prev === id ? null : id));
  };

  const openRegistro = (ej) => {
    navigation.getParent()?.navigate('RegistroEjercicio', {
      id_ciclo: ciclo?.id_ciclo,
      id_rutina: ej.id_rutina,
      orden: ej.orden,
      nombre: ej.nombre,
      nombre_rutina: ej.dia,
    });
  };

  // Al elegir un día, carga su rutina filtrada por grupo muscular (A.3).
  const selectDia = (dia) => {
    const seccion = getDiasData().find(([d]) => d === dia)?.[1];
    const diaNumero = seccion?.[0]?.dia_numero;
    setDiaSeleccionado(dia);
    if (ciclo?.id_ciclo && diaNumero) loadRutinaDia(ciclo.id_ciclo, diaNumero);
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
  const ejerciciosDiaRaw = diasData.find(([dia]) => dia === diaVisible)?.[1] || [];
  // Usa la rutina del día filtrada por grupo muscular (A.3) cuando llega;
  // si no (fallback o error), muestra el plan completo del día.
  const rutinaDiaAplicable =
    rutinaDia &&
    ejerciciosDiaRaw.length &&
    rutinaDia.dia_numero === ejerciciosDiaRaw[0].dia_numero;
  const ejerciciosDia = rutinaDiaAplicable
    ? (rutinaDia.ejercicios || []).map((e) => ({
        ...e,
        id_rutina: rutinaDia.id_rutina,
        nombre: e.nombre_ejercicio,
        dia: diaVisible,
        dia_numero: rutinaDia.dia_numero,
      }))
    : ejerciciosDiaRaw;
  const grupoMuscular = rutinaDiaAplicable
    ? capitalizar(rutinaDia.enfoque_muscular)
    : (ejerciciosDiaRaw[0]?.grupo_muscular ? capitalizar(ejerciciosDiaRaw[0].grupo_muscular) : '');
  const totalEj = ejercicios.length;
  const totalDone = Object.values(completados).filter(Boolean).length;
  const globalProgress = totalEj > 0 ? totalDone / totalEj : 0;

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <LinearGradient colors={GRADIENTS.purple} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={{ paddingHorizontal: SPACING.lg, paddingTop: SPACING.xl, paddingBottom: SPACING.lg }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View>
            <Text style={{ color: '#fff', fontSize: FONTS.title, fontWeight: '800' }}>Mi Rutina</Text>
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: FONTS.body, marginTop: 4 }}>
              {formatearFechaLegible(hoy)} — {diaSemana}
            </Text>
          </View>
          <TouchableOpacity
            onPress={onActualizar}
            activeOpacity={0.7}
            disabled={actualizando}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: 'rgba(255,255,255,0.15)',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            {actualizando ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="refresh" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>

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
                    {formatearFechaLegible(c.fecha_inicio)} — {c.fecha_fin ? formatearFechaLegible(c.fecha_fin) : 'Activo'}
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
                      onPress={() => selectDia(dia)}
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
                onRegistrar={openRegistro}
                grupo={grupoMuscular}
                notas={notas}
                notaTextos={notaTextos}
                setNotaTexto={setNotaTexto}
                onGuardarNota={guardarNota}
                guardandoNota={guardandoNota}
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