import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { getData } from '../../context/StorageContext';

import { offline_mode } from '../../constants/debug';
import { Colors } from '../../constants/theme';

const { width, height } = Dimensions.get('window');
const IMAGE_HEIGHT = 280;

type Instrument = {
  id: number;
  title: string;
  price: number;
  description: string;
  brand: string;
  model: string;
  condition: string;
  category: string;
  images: string[];
  seller: string;
  user_id: number;
  ai_rating: number;
};

function Stars({ rating }: { rating: number }) {
  const max = 5;
  const size = 20;

  return (
    <View style={{ flexDirection: 'row', marginTop: 6 }}>
      {Array.from({ length: max }).map((_, i) => {
        const fill = Math.max(0, Math.min(1, rating - i));

        return (
          <View
            key={i}
            style={{
              width: size,
              height: size,
              marginRight: 2,
            }}
          >
            <Text
              style={{
                position: 'absolute',
                color: '#666',
                fontSize: size,
              }}
            >
              ★
            </Text>

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

export default function ListingScreen() {

  function SellerLink({
    seller,
    onPress,
  }: {
    seller: string;
    onPress: () => void;
  }) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.sellerLink,
          pressed && { opacity: 0.7 },
        ]}
      >
        <Text style={styles.sellerLinkText}>
          {seller}
        </Text>
      </Pressable>
    );
  }

  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const [addingToCart, setAddingToCart] = useState(false);
  const [isInCart, setIsInCart] = useState(false);
  const [cartLoading, setCartLoading] = useState(true);

  const [data, setData] = useState<Instrument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);

  const modalRef = useRef<FlatList<string>>(null);

  useEffect(() => {
    if (!id) return;
    loadInstrument();
  }, [id]);

  useEffect(() => {
    if (data?.id && !loading) {
      checkCartStatus();
    }
  }, [data, loading]);

  useEffect(() => {
    if (fullscreen) {
      StatusBar.setHidden(true, 'fade');
      StatusBar.setBackgroundColor('black');
    } else {
      StatusBar.setHidden(false, 'fade');
      StatusBar.setBackgroundColor(Colors.dark.background);
    }
  }, [fullscreen]);

  useEffect(() => {
    if (!fullscreen) return;
    const timer = setTimeout(() => {
      modalRef.current?.scrollToIndex({
        index: page,
        animated: false,
      });
    }, 50);
    return () => clearTimeout(timer);
  }, [fullscreen, page]);

  async function loadInstrument() {
    if (!offline_mode) {
      try {
        const res = await fetch(
          `https://hangszercsere.hu/api/instrument/${id}`
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        setData(json);
        setError(null);
      } catch {
        setError('baj van, azkomgec');
      } finally {
        setLoading(false);
      }
    } else {
      const json: Instrument = {
        id: parseInt(id || '1'),
        title: 'Offline Mode',
        price: 10000,
        brand: 'Márka',
        model: 'Model',
        category: 'Kategória',
        images: [],
        condition: 'Minőség',
        description: 'Offline demo',
        seller: 'Offline',
        user_id: 1,
        ai_rating: 3.33,
      };

      setData(json);
      setLoading(false);
    }
  }

  async function checkCartStatus() {
    if (!data?.id || offline_mode) {
      setCartLoading(false);
      setIsInCart(false);
      return;
    }

    try {
      setCartLoading(true);
      const cookie = await getData<string>('cookie');

      if (!cookie) {
        setCartLoading(false);
        setIsInCart(false);
        return;
      }

      const response = await fetch('https://hangszercsere.hu/api/cart-items', {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Cookie: cookie,
        },
      });

      if (response.ok) {
        const cartItems = await response.json();
        const itemInCart = cartItems.some(
          (item: any) => item.id == data.id
        );
        setIsInCart(itemInCart);
      } else {
        setIsInCart(false);
      }
    } catch {
      setIsInCart(false);
    } finally {
      setCartLoading(false);
    }
  }

  const addToCart = async () => {
    if (!data?.id || addingToCart) return;

    try {
      setAddingToCart(true);

      const cookie = await getData<string>('cookie');

      if (!cookie) {
        setAddingToCart(false);
        router.push('/profile');
        return;
      }

      const response = await fetch('https://hangszercsere.hu/api/cart-items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: cookie,
        },
        body: JSON.stringify({ id: parseInt(id as string) }),
      });

      if (response.ok) {
        setIsInCart(true);
      }
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator size="large" style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  if (error || !data) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.error}>{error ?? 'No data'}</Text>
      </SafeAreaView>
    );
  }

  return (
    <>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.container}>
          <View style={styles.carouselWrapper}>
            <FlatList
              data={data.images || []}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              keyExtractor={(_, i) => i.toString()}
              onMomentumScrollEnd={(e) => {
                const index = Math.round(
                  e.nativeEvent.contentOffset.x / width
                );
                setPage(index);
              }}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.slide}
                  onPress={() => setFullscreen(true)}
                >
                  <Image
                    source={{ uri: `https://hangszercsere.hu/uploads/${item}` }}
                    style={styles.image}
                    resizeMode="cover"
                  />
                </Pressable>
              )}
            />
            <View style={styles.dots}>
              {(data.images || []).map((_, i) => (
                <View
                  key={i}
                  style={[styles.dot, i === page && styles.dotActive]}
                />
              ))}
            </View>
          </View>

          <ScrollView
            style={styles.scrollContainer}
            contentContainerStyle={{
              paddingBottom: Math.max(insets.bottom, 20) + 100,
              paddingHorizontal: 16,
            }}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.title}>{data.title}</Text>

            <Stars rating={data.ai_rating} />

            <Text style={styles.price}>
              {data.price.toLocaleString()} Ft
            </Text>

            <SellerLink
              seller={data.seller}
              onPress={() => router.push(`/profile/id/profile-${data.user_id}`)}
            />

            <Text style={styles.meta}>
              {data.brand} {data.model}
            </Text>
            <Text style={styles.meta}>
              Kategória: {data.category}
            </Text>
            <Text style={styles.meta}>
              Állapot: {data.condition}
            </Text>
            <Text style={styles.description}>{data.description}</Text>

            <TouchableOpacity
              style={[
                styles.addToCartButton,
                (addingToCart || cartLoading) &&
                  styles.addToCartButtonLoading,
                isInCart && styles.addToCartButtonInCart,
              ]}
              onPress={isInCart ? undefined : addToCart}
              disabled={addingToCart || cartLoading || isInCart}
            >
              {cartLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : isInCart ? (
                <Text style={styles.addToCartButtonText}>
                  ✅ Kosárban
                </Text>
              ) : addingToCart ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.addToCartButtonText}>
                  🛒 Kosárba
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </SafeAreaView>

      <Modal
        visible={fullscreen}
        transparent={false}
        animationType="fade"
        onRequestClose={() => setFullscreen(false)}
      >
        <View style={styles.modalBackdrop}>
          <FlatList
            ref={modalRef}
            data={data.images || []}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(_, i) => `modal-${i}`}
            onMomentumScrollEnd={(e) => {
              const index = Math.round(
                e.nativeEvent.contentOffset.x / width
              );
              setPage(index);
            }}
            renderItem={({ item }) => (
              <Pressable
                style={styles.modalSlide}
                onPress={() => setFullscreen(false)}
              >
                <Image
                  source={{
                    uri: `https://hangszercsere.hu/uploads/${item}`,
                  }}
                  style={styles.modalImage}
                  resizeMode="contain"
                />
              </Pressable>
            )}
          />
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  carouselWrapper: {
    width,
    height: IMAGE_HEIGHT,
  },
  slide: {
    width,
    height: IMAGE_HEIGHT,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  dots: {
    position: 'absolute',
    bottom: 10,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 20,
    backgroundColor: '#666',
    marginHorizontal: 4,
  },
  dotActive: {
    backgroundColor: '#fff',
  },
  title: {
    color: Colors.dark.textPrimary,
    fontSize: 24,
    fontWeight: '700',
    marginTop: 12,
  },
  price: {
    color: Colors.dark.accent,
    fontSize: 20,
    marginTop: 6,
    fontWeight: 'bold',
  },

  sellerButton: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: Colors.dark.cardBg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  sellerButtonLabel: {
    color: Colors.dark.textSecondary,
    fontSize: 14,
  },

  sellerButtonName: {
    color: Colors.dark.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },

  meta: {
    color: Colors.dark.textSecondary,
    marginTop: 4,
    padding: 2,
  },
  description: {
    color: Colors.dark.textSecondary,
    marginTop: 12,
    lineHeight: 20,
  },
  addToCartButton: {
    backgroundColor: Colors.dark.accent,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  addToCartButtonInCart: {
    backgroundColor: '#4CAF50',
  },
  addToCartButtonLoading: {
    opacity: 0.7,
  },
  addToCartButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  error: {
    color: 'red',
    marginTop: 40,
    textAlign: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'black',
  },
  modalSlide: {
    width,
    height,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImage: {
    width: '100%',
    height: '100%',
  },
  sellerLink: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },

  sellerLinkText: {
    color: Colors.dark.accent,
    fontSize: 14,
    fontWeight: '600',
  },
});