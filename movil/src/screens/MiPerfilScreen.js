import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Animated,
  RefreshControl,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GRADIENTS, FONTS, SPACING, SHADOWS, BORDER_RADIUS } from '../theme';
import { getMiPerfil, getMisCiclos, getMisRestricciones } from '../services/api';
import api, { API_URL } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { activarPushNotifications } from '../services/notifications';
import { seleccionarCicloActivo, esCicloActivo } from '../utils/cicloUtils';
import { formatearFechaLegible, formatearPeso, formatearAltura, formatearNumero, calcularIMC } from '../utils/formateadores';
import BadgeRestriccion from '../components/common/BadgeRestriccion';
import ResumenCiclo from '../components/historial/ResumenCiclo';

function Avatar({ nombre, foto, size = 80 }) {
  const initials = (nombre || 'U')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const uri = foto ? (foto.startsWith('http') ? foto : `${API_URL}${foto}`) : null;

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          ...SHADOWS.purple,
        }}
      />
    );
  }

  return (
    <LinearGradient
      colors={GRADIENTS.purple}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.purple,
      }}
    >
      <Text style={{ color: '#fff', fontSize: size * 0.38, fontWeight: '700' }}>
        {initials}
      </Text>
    </LinearGradient>
  );
}

function Badge({ role }) {
  const cfg = {
    ADMINISTRADOR: { label: 'Admin', colors: GRADIENTS.admin },
    ENTRENADOR: { label: 'Entrenador', colors: GRADIENTS.entrenador },
    NUTRICIONISTA: { label: 'Nutricionista', colors: GRADIENTS.admin },
    RECEPCIONISTA: { label: 'Recepción', colors: GRADIENTS.recepcionista },
    AFILIADO: { label: 'Afiliado', colors: GRADIENTS.purpleDark },
  };
  const c = cfg[role] || cfg.AFILIADO;
  return (
    <LinearGradient colors={c.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      style={{ paddingHorizontal: 14, paddingVertical: 4, borderRadius: 20 }}>
      <Text style={{ color: '#fff', fontSize: FONTS.xsmall, fontWeight: '700' }}>{c.label}</Text>
    </LinearGradient>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: COLORS.bgCard,
      borderRadius: BORDER_RADIUS.md,
      padding: SPACING.md,
      marginBottom: SPACING.sm,
      ...SHADOWS.subtle,
    }}>
      <View style={{
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: COLORS.purpleGlow,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.md,
      }}>
        <Ionicons name={icon} size={18} color={COLORS.purpleLight} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: COLORS.textSecondary, fontSize: FONTS.small }}>{label}</Text>
        <Text style={{ color: COLORS.text, fontSize: FONTS.body, fontWeight: '600', marginTop: 2 }}>{value}</Text>
      </View>
    </View>
  );
}

function SectionCard({ title, icon, children }) {
  return (
    <View style={{
      backgroundColor: COLORS.bgCard,
      borderRadius: BORDER_RADIUS.lg,
      padding: SPACING.md,
      marginBottom: SPACING.md,
      ...SHADOWS.card,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md }}>
        <Ionicons name={icon} size={20} color={COLORS.purpleLight} style={{ marginRight: SPACING.sm }} />
        <Text style={{ color: COLORS.text, fontSize: FONTS.subtitle, fontWeight: '700' }}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

export default function MiPerfilScreen({ navigation }) {
  const { logout } = useAuth();
  const [perfil, setPerfil] = useState(null);
  const [ciclo, setCiclo] = useState(null);
  const [ciclos, setCiclos] = useState([]);
  const [restricciones, setRestricciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const scrollY = useState(() => new Animated.Value(0))[0];

  const fetchData = useCallback(async () => {
    try {
      const [perfilRes, ciclosRes, restricRes] = await Promise.all([
        getMiPerfil(),
        getMisCiclos(),
        getMisRestricciones(),
      ]);
      setPerfil(perfilRes.data);
      setCiclos(ciclosRes.data || []);
      setCiclo(seleccionarCicloActivo(ciclosRes.data));
      setRestricciones(restricRes.data || []);
    } catch (err) {
      Alert.alert('Error', 'No se pudo cargar el perfil.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Refetch al volver del editor de perfil (EditarPerfil).
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => { fetchData(); });
    return unsubscribe;
  }, [navigation, fetchData]);

  // Registro idempotente del push token (si el login no lo hizo aún)
  useEffect(() => { activarPushNotifications(); }, []);

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (_) {}
  };

  const handlePhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galería.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.7 });
    if (result.canceled || !result.assets?.length) return;

    const asset = result.assets[0];
    const fd = new FormData();
    fd.append('foto', {
      uri: asset.uri,
      name: asset.fileName || 'foto.jpg',
      type: asset.mimeType || 'image/jpeg',
    });
    try {
      await api.post('/afiliados/me/foto', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      Alert.alert('Foto actualizada', 'Tu foto de perfil fue subida correctamente.');
      onRefresh();
    } catch (err) {
      console.error('[MiPerfil] subir foto:', err);
      Alert.alert('Error', 'No se pudo subir la foto. Intenta nuevamente.');
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.purple} />
      </View>
    );
  }

  const u = perfil?.usuario || perfil || {};
  const rol = u.nombre_rol || perfil?.rol || 'AFILIADO';
  const nombreCompleto =
    `${perfil?.nombres || u.nombre || ''} ${perfil?.apellidos || u.apellido || ''}`.trim()
    || (perfil?.correo ? perfil.correo.split('@')[0] : '')
    || 'Usuario';
  const correo = perfil?.correo || u.correo || '';
  const telefono = perfil?.telefono || u.telefono || '';
  const edad = perfil?.edad ?? u.edad ?? '-';
  const peso = perfil?.ciclo_activo?.progreso_fisico?.[0]?.peso_kg ?? perfil?.peso ?? u.peso ?? null;
  const altura = perfil?.estatura_cm ?? perfil?.altura ?? u.altura ?? null;
  const imc = perfil?.ciclo_activo?.progreso_fisico?.[0]?.imc ?? calcularIMC(peso, altura);

  const historial = ciclos
    .filter((c) => !esCicloActivo(c))
    .sort((a, b) => (b.numero_ciclo || b.id_ciclo || 0) - (a.numero_ciclo || a.id_ciclo || 0));

  const headerHeight = scrollY.interpolate({
    inputRange: [0, 120],
    outputRange: [260, 160],
    extrapolate: 'clamp',
  });

  const { isDark, toggle } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <Animated.View style={{ height: headerHeight, overflow: 'hidden' }}>
        <LinearGradient colors={GRADIENTS.purple} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1.2 }}
          style={{ flex: 1, justifyContent: 'flex-end', paddingHorizontal: SPACING.lg, paddingBottom: SPACING.lg }}>
          <TouchableOpacity
            onPress={toggle}
            activeOpacity={0.8}
            style={{
              position: 'absolute',
              top: 46,
              right: SPACING.lg,
              width: 38,
              height: 38,
              borderRadius: 19,
              backgroundColor: 'rgba(255,255,255,0.18)',
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.25)',
            }}
          >
            <Text style={{ fontSize: 17 }}>{isDark ? '☀️' : '🌙'}</Text>
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={handlePhoto} activeOpacity={0.8}>
              <Avatar nombre={nombreCompleto} foto={perfil?.foto || u.foto} size={72} />
            </TouchableOpacity>
            <View style={{ marginLeft: SPACING.md, flex: 1 }}>
              <Text style={{ color: '#fff', fontSize: FONTS.title, fontWeight: '800' }} numberOfLines={1}>
                {nombreCompleto}
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: FONTS.body, marginTop: 2 }}>
                {correo}
              </Text>
              <View style={{ flexDirection: 'row', marginTop: SPACING.sm }}>
                <Badge role={rol} />
              </View>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>

      <Animated.ScrollView
        contentContainerStyle={{ padding: SPACING.md, paddingBottom: SPACING.xl + 20 }}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh}
          tintColor={COLORS.purple} colors={[COLORS.purple]} />}
      >
        <SectionCard title="Información Personal" icon="person-outline">
          <InfoRow icon="calendar-outline" label="Edad" value={`${edad} años`} />
          <InfoRow icon="scale-outline" label="Peso" value={formatearPeso(peso)} />
          <InfoRow icon="resize-outline" label="Altura" value={formatearAltura(altura)} />
          <InfoRow icon="pulse-outline" label="IMC" value={imc != null ? formatearNumero(imc, 2) : '-'} />
          <InfoRow icon="mail-outline" label="Correo" value={correo || '-'} />
          <InfoRow icon="call-outline" label="Teléfono" value={telefono || '-'} />

          <TouchableOpacity
            onPress={() => navigation.navigate('EditarPerfil')}
            activeOpacity={0.8}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: COLORS.purpleGlow,
              borderRadius: BORDER_RADIUS.md,
              padding: SPACING.sm,
              marginTop: SPACING.sm,
            }}
          >
            <Ionicons name="create-outline" size={18} color={COLORS.purpleLight} style={{ marginRight: SPACING.sm }} />
            <Text style={{ color: COLORS.purpleLight, fontSize: FONTS.body, fontWeight: '600' }}>
              Editar perfil
            </Text>
          </TouchableOpacity>
        </SectionCard>

        {ciclo ? (
          <SectionCard title="Estado Físico" icon="fitness-outline">
            <InfoRow icon="barbell-outline" label="Ciclo Actual" value={`Ciclo ${ciclo.numero_ciclo || ciclo.id_ciclo}`} />
            {ciclo.objetivo_fisico && (
              <InfoRow icon="flag-outline" label="Objetivo" value={ciclo.objetivo_fisico} />
            )}
            {ciclo.fecha_inicio && ciclo.fecha_fin && (
              <InfoRow icon="calendar-outline" label="Fechas" value={`${formatearFechaLegible(ciclo.fecha_inicio)} → ${formatearFechaLegible(ciclo.fecha_fin)}`} />
            )}
            {ciclo.disponibilidad_dias != null && (
              <InfoRow icon="calendar-outline" label="Días de Entreno" value={`${ciclo.disponibilidad_dias}/semana`} />
            )}
            <InfoRow icon="pulse-outline" label="Estado" value={esCicloActivo(ciclo) ? 'Activo' : 'Inactivo'} />
          </SectionCard>
        ) : (
          <SectionCard title="Estado Físico" icon="fitness-outline">
            <Text style={{ color: COLORS.textSecondary, fontSize: FONTS.body }}>
              No tienes un ciclo asignado. Consulta con tu entrenador.
            </Text>
          </SectionCard>
        )}

        {historial.length > 0 && (
          <SectionCard title="Historial de Ciclos" icon="time-outline">
            <View style={{ marginTop: SPACING.xs }}>
              {historial.map((c) => (
                <ResumenCiclo key={c.id_ciclo} ciclo={c} />
              ))}
            </View>
          </SectionCard>
        )}

        {restricciones.length > 0 && (
          <SectionCard title="Restricciones" icon="warning-outline">
            {restricciones.map((r, i) => (
              <View key={r.id_restriccion ?? i} style={{ marginBottom: SPACING.xs }}>
                <BadgeRestriccion restriccion={r} />
                {r.efecto_relevante ? (
                  <Text style={{ color: COLORS.textSecondary, fontSize: FONTS.xsmall, marginTop: 2, marginLeft: SPACING.sm }}>
                    {r.efecto_relevante}
                  </Text>
                ) : null}
              </View>
            ))}
          </SectionCard>
        )}

        <TouchableOpacity onPress={handleLogout} activeOpacity={0.7}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(227,28,37,0.15)',
            borderRadius: BORDER_RADIUS.md,
            padding: SPACING.md,
            marginTop: SPACING.sm,
          }}>
          <Ionicons name="log-out-outline" size={20} color={COLORS.error} style={{ marginRight: SPACING.sm }} />
          <Text style={{ color: COLORS.error, fontSize: FONTS.body, fontWeight: '600' }}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </Animated.ScrollView>
    </View>
  );
}
