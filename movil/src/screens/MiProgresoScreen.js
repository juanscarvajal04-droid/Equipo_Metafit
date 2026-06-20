import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { getMiProgreso } from '../services/api';

export default function MiProgresoScreen() {
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getMiProgreso();
        const data = Array.isArray(res.data) ? res.data : [];
        setRegistros(data);
      } catch (err) {
        setError('Error al cargar progreso');
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

  if (registros.length === 0) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.emptyText}>
          Aún no tienes registros de progreso.
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={registros}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.fecha}>{item.fecha_registro}</Text>
            <View style={styles.medidas}>
              <Medida label="Peso" value={`${item.peso_kg} kg`} />
              <Medida label="IMC" value={item.imc ? String(item.imc) : '-'} />
              <Medida
                label="Grasa"
                value={
                  item.porcentaje_grasa != null
                    ? `${item.porcentaje_grasa}%`
                    : '-'
                }
              />
              <Medida
                label="Cintura"
                value={
                  item.medida_cintura != null
                    ? `${item.medida_cintura} cm`
                    : '-'
                }
              />
              <Medida
                label="Brazo"
                value={
                  item.medida_brazo != null
                    ? `${item.medida_brazo} cm`
                    : '-'
                }
              />
              <Medida
                label="Pierna"
                value={
                  item.medida_pierna != null
                    ? `${item.medida_pierna} cm`
                    : '-'
                }
              />
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

function Medida({ label, value }) {
  return (
    <View style={styles.medidaItem}>
      <Text style={styles.medidaLabel}>{label}</Text>
      <Text style={styles.medidaValue}>{value}</Text>
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
    padding: 24,
  },
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  fecha: {
    fontSize: 14,
    fontWeight: '700',
    color: '#208AEF',
    marginBottom: 10,
  },
  medidas: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  medidaItem: {
    width: '33%',
    marginBottom: 8,
  },
  medidaLabel: {
    fontSize: 11,
    color: '#999',
  },
  medidaValue: {
    fontSize: 15,
    color: '#333',
    fontWeight: '600',
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
});
