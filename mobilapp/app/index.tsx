import { offline_mode } from '@/constants/debug';
import { router } from 'expo-router';
import LottieView from 'lottie-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/theme';
import { useScroll } from '../context/ScrollContext';

type Instrument = {
  id: number;
  title: string;
  price: number;
  brand: string;
  category: string;
  ai_rating: number;
  images: string[];
};

/* ✅ this survives tab switches, but resets when the app is closed */
let splashAlreadyShown = false;

/* ---------------- STAR RATING ---------------- */

function Stars({ rating }: { rating: number }) {
  const max = 5;
  const size = 20;

  return (
    <View style={{ flexDirection: 'row' }}>
      {Array.from({ length: max }).map((_, i) => {
        const fill = Math.max(0, Math.min(1, rating - i)); // 0..1

        return (
          <View
            key={i}
            style={{
              width: size,
              height: size,
            }}
          >
            {/* base gray star */}
            <Text
              style={{
                position: 'absolute',
                color: '#666',
                fontSize: size,
              }}
            >
              ★
            </Text>

            {/* clipped yellow part */}
            {fill > 0 && (
              <View
                style={{
                  position: 'absolute',
                  overflow: 'hidden',
                  width: size * fill,
                  height: size,
                }}
              >
                <Text
                  style={{
                    color: '#FFD700',
                    fontSize: size,
                  }}
                >
                  ★
                </Text>
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

/* --------------------------------------------- */

export default function HomeScreen() {
  const [data, setData] = useState<Instrument[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSplash, setShowSplash] = useState(!splashAlreadyShown);

  const { handleScroll } = useScroll();

  useEffect(() => {
    if (!splashAlreadyShown) {
      splashAlreadyShown = true;

      const t = setTimeout(() => {
        setShowSplash(false);
        loadInstruments();
      }, 2500);

      return () => clearTimeout(t);
    } else {
      setShowSplash(false);
      loadInstruments();
    }
  }, []);

  async function loadInstruments() {
    setLoading(true);

    if (!offline_mode) {
      try {
        const res = await fetch('https://hangszercsere.hu/api/instruments');
        if (!res.ok) throw new Error('API died');

        const json = await res.json();
        setData(json);
        setError(null);
      } catch (err) {
        console.error(err);
        setError('Failed to load data 😬');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    } else {
      const json: Instrument[] = [
        {
          brand: 'fasz',
          category: 'kategória',
          id: 0,
          images: [],
          price: 10000,
          title: 'fekete fasz cím',
          ai_rating: 3.6,
        },
      ];

      setData(json);
      setLoading(false);
      setRefreshing(false);
    }
  }

  function onRefresh() {
    setRefreshing(true);
    loadInstruments();
  }

  if (showSplash) {
    return (
      <View style={styles.splashContainer}>
        <LottieView
          source={require('../assets/animations/splash.json')}
          autoPlay
          loop={false}
          style={styles.lottie}
        />
        <Text style={styles.splashTitle}>Hangszercsere</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator size="large" style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onScroll={(e) => handleScroll(e.nativeEvent.contentOffset.y)}
        scrollEventThrottle={16}
      >
        {error && <Text style={styles.error}>{error}</Text>}

        {data.map((item) => {
          const imageUrl = item.images?.length
            ? `https://hangszercsere.hu/uploads/${item.images[0]}`
            : null;

          return (
            <Pressable
              key={item.id}
              style={styles.card}
              onPress={() => router.push(`/listing/${item.id}`)}
            >
              {imageUrl && (
                <Image source={{ uri: imageUrl }} style={styles.image} />
              )}

              <View style={styles.info}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.meta}>
                  {item.brand} • {item.category}
                </Text>

                <View style={styles.meta2}>
                  <Text style={styles.price}>
                    {item.price.toLocaleString()} Ft
                  </Text>

                  <Stars rating={item.ai_rating} />
                </View>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },

  splashContainer: {
    flex: 1,
    backgroundColor: Colors.dark.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },

  lottie: {
    width: 300,
    height: 300,
  },

  splashTitle: {
    color: Colors.dark.textPrimary,
    fontSize: 28,
    fontWeight: '700',
    marginTop: 20,
    textAlign: 'center',
  },

  container: {
    flex: 1,
    padding: 12,
  },

  card: {
    backgroundColor: Colors.dark.cardBg,
    borderRadius: 12,
    marginBottom: 14,
    overflow: 'hidden',
  },

  image: {
    width: '100%',
    height: 180,
  },

  info: {
    padding: 12,
  },

  title: {
    color: Colors.dark.textPrimary,
    fontSize: 18,
    fontWeight: '600',
  },

  meta: {
    color: Colors.dark.textSecondary,
    marginTop: 4,
  },

  meta2: {
    color: Colors.dark.textSecondary,
    marginTop: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    alignItems: 'center',
  },

  price: {
    color: Colors.dark.accent,
    marginTop: 6,
    fontSize: 16,
    fontWeight: 'bold',
  },

  error: {
    color: 'red',
    marginBottom: 12,
    textAlign: 'center',
  },
});