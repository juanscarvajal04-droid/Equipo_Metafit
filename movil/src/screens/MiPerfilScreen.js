import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { getMiPerfil } from '../services/api';

export default function MiPerfilScreen() {
  const { logout } = useAuth();
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getMiPerfil();
        setPerfil(res.data);
      } catch (err) {
        setError('Error al cargar perfil');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#208AEF" />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
      </SafeAreaView>
    );
  }

  if (!perfil) return null;

  const restricciones = perfil.restricciones || [];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.name}>
          {perfil.nombres} {perfil.apellidos}
        </Text>

        <Section label="Correo" value={perfil.email} />
        <Section label="Documento" value={perfil.documento} />
        <Section label="Fecha de nacimiento" value={perfil.fecha_nacimiento} />
        <Section label="Sexo" value={perfil.sexo} />
        <Section label="Teléfono" value={perfil.telefono} />
        <Section label="Estatura" value={perfil.estatura_cm ? `${perfil.estatura_cm} cm` : '-'} />
        <Section label="Objetivo físico" value={perfil.objetivo_fisico} />
        <Section label="Nivel de experiencia" value={perfil.nivel_experiencia} />

        {restricciones.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Restricciones médicas</Text>
            {restricciones.map((r, i) => (
              <Text key={i} style={styles.restriccion}>• {r.nombre}</Text>
            ))}
          </View>
        )}

        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ label, value }) {
  return (
    <View style={styles.section}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value || '-'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  container: {
    padding: 20,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 24,
    textAlign: 'center',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#208AEF',
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    color: '#999',
    marginBottom: 2,
  },
  value: {
    fontSize: 16,
    color: '#333',
  },
  restriccion: {
    fontSize: 15,
    color: '#d32f2f',
    marginBottom: 4,
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 16,
  },
  logoutButton: {
    backgroundColor: '#d32f2f',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
