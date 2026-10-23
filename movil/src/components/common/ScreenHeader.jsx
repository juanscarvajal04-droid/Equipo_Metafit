import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GRADIENTS, FONTS, SPACING } from '../../theme';

// Cabecera degradada compartida por las pantallas de plan (dieta/rutina).
export default function ScreenHeader({ title, subtitle, refreshing, onRefresh, children }) {
  return (
    <LinearGradient
      colors={GRADIENTS.purple}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={{ paddingHorizontal: SPACING.lg, paddingTop: SPACING.xl, paddingBottom: SPACING.lg }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View>
          <Text style={{ color: '#fff', fontSize: FONTS.title, fontWeight: '800' }}>{title}</Text>
          <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: FONTS.body, marginTop: 4 }}>
            {subtitle}
          </Text>
        </View>
        <TouchableOpacity
          onPress={onRefresh}
          activeOpacity={0.7}
          disabled={refreshing}
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
          {refreshing ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="refresh" size={20} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
      {children}
    </LinearGradient>
  );
}
