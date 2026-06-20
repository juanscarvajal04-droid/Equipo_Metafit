import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
  const { login } = useAuth();
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!correo.trim() || !contrasena.trim()) {
      setError('Ingresá correo y contraseña');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await login(correo.trim(), contrasena);
    } catch (err) {
      const msg = err.response?.data?.error || 'Correo o contraseña incorrectos';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Text style={styles.title}>MetaFit</Text>
          <Text style={styles.subtitle}>Iniciá sesión</Text>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TextInput
          style={styles.input}
          placeholder="Correo electrónico"
          placeholderTextColor="#999"
          value={correo}
          onChangeText={setCorreo}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TextInput
          style={styles.input}
          placeholder="Contraseña"
          placeholderTextColor="#999"
          value={contrasena}
          onChangeText={setContrasena}
          secureTextEntry
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Ingresar</Text>
          )}
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#208AEF',
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginTop: 8,
  },
  error: {
    color: '#d32f2f',
    textAlign: 'center',
    marginBottom: 16,
    fontSize: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#333',
    marginBottom: 16,
    backgroundColor: '#f9f9f9',
  },
  button: {
    backgroundColor: '#208AEF',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
