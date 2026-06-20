import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { getMisCiclos, getPlanEntrenamiento } from '../services/api';

export default function MiRutinaScreen() {
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
          const planRes = await getPlanEntrenamiento(activo.id_ciclo);
          setPlan(planRes.data);
        } else {
          setPlan(null);
        }
      } catch (err) {
        if (err.response?.status === 404) {
          setPlan(null);
        } else {
          setError('Error al cargar la rutina');
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

  if (!plan || !plan.rutinas || plan.rutinas.length === 0) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.emptyText}>
          Aún no tienes una rutina asignada. Habla con tu entrenador.
        </Text>
      </SafeAreaView>
    );
  }

  const rutinas = plan.rutinas;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {rutinas.map((rutina) => (
          <View key={rutina.id_rutina} style={styles.rutinaCard}>
            <Text style={styles.dia}>Día {rutina.dia_numero}</Text>
            <Text style={styles.rutinaName}>{rutina.nombre_rutina}</Text>
            {rutina.enfoque_muscular ? (
              <Text style={styles.enfoque}>{rutina.enfoque_muscular}</Text>
            ) : null}

            {rutina.ejercicios && rutina.ejercicios.length > 0 ? (
              rutina.ejercicios.map((ej, i) => (
                <View key={i} style={styles.ejercicioRow}>
                  <Text style={styles.ejercicioName}>{ej.nombre_ejercicio}</Text>
                  <Text style={styles.ejercicioDetalle}>
                    {ej.series} × {ej.repeticiones}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.sinEjercicios}>Sin ejercicios asignados</Text>
            )}
          </View>
        ))}
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
  rutinaCard: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  dia: {
    fontSize: 12,
    color: '#208AEF',
    fontWeight: '700',
    marginBottom: 4,
  },
  rutinaName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  enfoque: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
  },
  ejercicioRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  ejercicioName: {
    fontSize: 15,
    color: '#333',
    flex: 1,
  },
  ejercicioDetalle: {
    fontSize: 15,
    color: '#208AEF',
    fontWeight: '600',
  },
  sinEjercicios: {
    fontSize: 13,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 4,
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
