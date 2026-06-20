import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { getMisCiclos, getPlanNutricional } from '../services/api';

export default function MiDietaScreen() {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const ciclosRes = await getMisCiclos();
        const ciclos = ciclosRes.data;
        const activo = Array.isArray(ciclos)
          ? ciclos.find((c) => c.activo) || ciclos[0]
          : null;

        if (activo) {
          const planRes = await getPlanNutricional(activo.id_ciclo);
          setPlan(planRes.data);
        } else {
          setPlan(null);
        }
      } catch (err) {
        if (err.response?.status === 404) {
          setPlan(null);
        } else {
          setError('Error al cargar el plan nutricional');
        }
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

  if (!plan) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.emptyText}>
          Aún no tienes un plan nutricional asignado.
        </Text>
      </SafeAreaView>
    );
  }

  const detalle = plan.detalle || [];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.summary}>
          <Text style={styles.summaryLabel}>Calorías objetivo</Text>
          <Text style={styles.summaryValue}>{plan.calorias_objetivo} kcal</Text>
          <Text style={styles.summaryLabel}>Comidas por día</Text>
          <Text style={styles.summaryValue}>{plan.num_comidas}</Text>
        </View>

        {detalle.length > 0 ? (
          <>
            {Array.from(new Set(detalle.map((d) => d.num_comida)))
              .sort((a, b) => a - b)
              .map((numComida) => {
                const items = detalle.filter(
                  (d) => d.num_comida === numComida
                );
                return (
                  <View key={numComida} style={styles.comidaCard}>
                    <Text style={styles.comidaTitle}>
                      Comida {numComida}
                    </Text>
                    {items.map((item, i) => (
                      <View key={i} style={styles.alimentoRow}>
                        <Text style={styles.alimentoName}>{item.nombre_alimento}</Text>
                        <Text style={styles.alimentoCant}>{item.cantidad_g}g</Text>
                      </View>
                    ))}
                  </View>
                );
              })}
          </>
        ) : (
          <Text style={styles.sinDetalle}>
            Sin detalle de alimentos asignado.
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
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
  container: {
    padding: 16,
  },
  summary: {
    backgroundColor: '#e8f4fd',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#208AEF',
  },
  comidaCard: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  comidaTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 10,
  },
  alimentoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  alimentoName: {
    fontSize: 15,
    color: '#333',
    flex: 1,
  },
  alimentoCant: {
    fontSize: 15,
    color: '#208AEF',
    fontWeight: '600',
  },
  sinDetalle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
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
