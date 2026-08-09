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
      setCiclo(ciclosRes.data?.cicloActual || ciclosRes.data?.[0] || null);
      setRestricciones(restricRes.data || []);
    } catch (err) {
      Alert.alert('Error', 'No se pudo cargar el perfil.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

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
  const nombreCompleto = `${u.nombre || ''} ${u.apellido || ''}`.trim() || 'Usuario';
  const edad = u.edad || '-';
  const peso = u.peso ?? perfil?.peso ?? '-';
  const altura = u.altura ?? perfil?.altura ?? '-';

  const headerHeight = scrollY.interpolate({
    inputRange: [0, 120],
    outputRange: [260, 160],
    extrapolate: 'clamp',
  });

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <Animated.View style={{ height: headerHeight, overflow: 'hidden' }}>
        <LinearGradient colors={GRADIENTS.purple} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1.2 }}
          style={{ flex: 1, justifyContent: 'flex-end', paddingHorizontal: SPACING.lg, paddingBottom: SPACING.lg }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={handlePhoto} activeOpacity={0.8}>
              <Avatar nombre={nombreCompleto} foto={perfil?.foto || u.foto} size={72} />
            </TouchableOpacity>
            <View style={{ marginLeft: SPACING.md, flex: 1 }}>
              <Text style={{ color: '#fff', fontSize: FONTS.title, fontWeight: '800' }} numberOfLines={1}>
                {nombreCompleto}
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: FONTS.body, marginTop: 2 }}>
                {u.correo || ''}
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
          <InfoRow icon="scale-outline" label="Peso" value={`${peso} kg`} />
          <InfoRow icon="resize-outline" label="Altura" value={`${altura} cm`} />
          <InfoRow icon="mail-outline" label="Correo" value={u.correo || '-'} />
          <InfoRow icon="call-outline" label="Teléfono" value={u.telefono || '-'} />
        </SectionCard>

        {ciclo && (
          <SectionCard title="Estado Físico" icon="fitness-outline">
            <InfoRow icon="barbell-outline" label="Ciclo Actual" value={ciclo.nombre || `#${ciclo.id_ciclo}`} />
            {ciclo.dias_entreno != null && (
              <InfoRow icon="calendar-outline" label="Días de Entreno" value={`${ciclo.dias_entreno}/semana`} />
            )}
            {ciclo.objetivo && (
              <InfoRow icon="flag-outline" label="Objetivo" value={ciclo.objetivo} />
            )}
            {ciclo.estado && (
              <InfoRow icon="pulse-outline" label="Estado" value={ciclo.estado} />
            )}
          </SectionCard>
        )}

        {restricciones.length > 0 && (
          <SectionCard title="Restricciones" icon="warning-outline">
            {restricciones.map((r, i) => (
              <View key={i} style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: 'rgba(227,28,37,0.1)',
                borderRadius: BORDER_RADIUS.sm,
                padding: SPACING.sm,
                marginBottom: SPACING.xs,
              }}>
                <Ionicons name="alert-circle" size={16} color={COLORS.error} style={{ marginRight: SPACING.sm }} />
                <Text style={{ color: COLORS.text, fontSize: FONTS.small, flex: 1 }}>
                  {r.descripcion || r.nombre || `Restricción`}
                </Text>
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
