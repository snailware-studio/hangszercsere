import { Colors } from "@/constants/theme";
import { getData } from "@/context/StorageContext";
import { ProfileData } from "@/types/types";
import React, { useEffect, useState } from "react";
0

import { router } from "expo-router";

import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width: screenWidth } = Dimensions.get("window");
const CARD_PADDING = 20;
const IMAGE_SIZE = 80;
const NAV_HEIGHT = 64;

export default function CartPage() {
  const [cartData, setCartData] = useState<any[] | null>([]);
  const [loading, setLoading] = useState(false);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [userId, setUserId] = useState(null as string | null);
  const [profileData, setProfileData] = useState<ProfileData | any>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  
  useEffect(() => {
    checkLoginStatus();
    fetchCartData();
  }, []);


  async function checkLoginStatus() {
    try {
      const cookie = await getData<string>("cookie");
      const savedUserId = await getData<string>("userId");

      if (cookie && savedUserId) {
        setUserId(savedUserId);
        const savedLoginData = await getData<string>("loginData");

        if (savedLoginData) {
          setProfileData(savedLoginData);
        }
        setLoggedIn(true);
      }
    } catch (err) {
      console.error("Login check error:", err);
    }
  }

  const fetchCartData = async () => {
    try {
      setLoading(true);
      const cookie = await getData<string>("cookie");

      if (!cookie) {
        console.log("No cookie found");
        setLoading(false);
        return;
      }

      const response = await fetch("https://hangszercsere.hu/api/cart-items", {
        method: "GET",
        headers: {
          Cookie: cookie,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setCartData(data || []);
      } else {
        console.log("Failed to fetch cart:", response.status);
        setCartData([]);
      }
    } catch (error) {
      console.error("Error fetching cart:", error);
      setCartData([]);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- DELETE FROM CART ---------------- */
  const handleRemoveItem = async (listingId: number) => {
    try {
      const cookie = await getData<string>("cookie");

      if (!cookie) {
        router.push("/profile");
        return;
      }

      const response = await fetch(
        `https://hangszercsere.hu/api/cart-items/${listingId}`,
        {
          method: "DELETE",
          headers: {
            Cookie: cookie,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      if (!response.ok) {
        console.log("Delete failed:", response.status);
        Alert.alert("Hiba", "Nem sikerült törölni a terméket.");
        return;
      }

      // remove locally
      setCartData((prev) => {
        if (!prev) return prev;
        return prev.filter((item) => item.id !== listingId);
      });
    } catch (err) {
      console.error("Delete error:", err);
      Alert.alert("Hiba", "Nem sikerült törölni a terméket.");
    }
  };

  /* ---------------- PURCHASE ALL ITEMS ---------------- */
  const handlePurchase = async () => {
    if (!cartData || cartData.length === 0) {
      Alert.alert("Hiba", "Kosarad üres!");
      return;
    }

    try {
      setPurchaseLoading(true);
      const cookie = await getData<string>("cookie");

      if (!cookie) {
        router.push("/profile");
        return;
      }

      console.log("Purchasing cart items:", cartData.map(item => item.id));

      const response = await fetch("https://hangszercsere.hu/api/buy", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          'Cookie': cookie,
        },
        body: JSON.stringify({ 
          cart_items: cartData.map(item => item.id) 
        }),
      });

      console.log('Purchase response:', response.status);

      if (response.ok) {
        Alert.alert(
          "Sikeres vásárlás!", 
          "Köszönjük a rendelésed! Emailben értesítünk a termékek vásárlásáról.",
          [
            {
              text: "OK",
              onPress: () => {
                // Clear cart locally and refresh
                setCartData([]);
                fetchCartData();
              }
            }
          ]
        );
      } else {
        const errorData = await response.json().catch(() => ({}));
        Alert.alert(
          "Vásárlási hiba", 
          errorData.message || `Hiba történt (HTTP ${response.status})`
        );
      }
    } catch (error) {
      console.error("Purchase error:", error);
      Alert.alert("Hiba", "Hálózati hiba történt.");
    } finally {
      setPurchaseLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("hu-HU").format(price) + " Ft";
  };

  const calculateTotal = () => {
    if (!cartData || cartData.length === 0) return 0;
    return cartData.reduce((sum, item) => sum + item.price, 0);
  };

  const renderItem = ({ item }: { item: any }) => {
    if (item.isPurchaseButton) {
      return (
        <TouchableOpacity
          style={[
            styles.purchaseButton,
            purchaseLoading && styles.purchaseButtonLoading
          ]}
          onPress={purchaseLoading ? undefined : handlePurchase}
          disabled={purchaseLoading}
        >
          {purchaseLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <View style={styles.purchaseButtonContent}>
              <Text style={styles.purchaseButtonText}>Vásárlás</Text>
              <Text style={styles.purchaseButtonSubtext}>
                {formatPrice(calculateTotal())}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      );
    }

    return (
      <View style={styles.card}>
        <View style={styles.cardContent}>
          <Image
            source={{
              uri: `https://hangszercsere.hu/uploads/${item.image_url}`,
            }}
            style={styles.image}
            resizeMode="cover"
          />
          <View style={styles.info}>
            <Text style={styles.title} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.meta}>
              {item.brand} {item.model || item.condition}
            </Text>
            <Text style={styles.price}>{formatPrice(item.price)}</Text>
          </View>

          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => handleRemoveItem(item.id)}
          >
            <Text style={styles.removeButtonText}>x</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Text style={styles.pageTitle}>Kosár betöltése...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!loggedIn)
  {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>
          {/* Hero Section */}
          <View style={styles.hero}>
            <Text style={styles.heroTitle}>Nincs kosarad!</Text>
            <Text style={styles.heroSubtitle}>
              A vásárláshoz jelentkezz be vagy regisztrálj
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }
  if (!cartData || cartData.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Text style={styles.pageTitle}>Üres a kosarad</Text>
          <Text style={styles.small_text}>Töltsd meg valamivel!</Text>
        </View>
      </SafeAreaView>
    );
  }

  const dataWithPurchaseButton = [...cartData, { isPurchaseButton: true }];


  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Kosarad</Text>
      </View>

      <FlatList
        data={dataWithPurchaseButton}
        renderItem={renderItem}
        keyExtractor={(item, index) =>
          item.id?.toString() || `purchase-${index}`
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshing={loading}
        onRefresh={fetchCartData}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
  },
  header: {
    padding: 20,
    paddingTop: 0,
  },
  hero: {
    alignItems: "center",
    marginBottom: 48,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: "700",
    color: Colors.dark.textPrimary,
    textAlign: "center",
    marginBottom: 12,
  },
  heroSubtitle: {
    fontSize: 16,
    color: Colors.dark.textSecondary,
    textAlign: "center",
    lineHeight: 24,
  },
  pageTitle: {
    color: Colors.dark.textPrimary,
    fontSize: 32,
    fontWeight: "600",
    textAlign: "center",
  },
  title: {
    color: Colors.dark.textPrimary,
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  listContent: {
    paddingHorizontal: CARD_PADDING,
    paddingBottom: 100,
  },
  small_text: {
    fontSize: 16,
    color: Colors.dark.textSecondary,
    marginBottom: 16,
    marginTop: 32,
    textAlign: "center",
  },
  card: {
    backgroundColor: Colors.dark.cardBg,
    borderRadius: 12,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  image: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: 8,
    marginRight: 16,
  },
  info: {
    flex: 1,
  },
  meta: {
    color: Colors.dark.textSecondary,
    fontSize: 14,
    marginBottom: 4,
  },
  price: {
    color: Colors.dark.accent,
    fontSize: 20,
    fontWeight: "700",
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#ff4444",
    justifyContent: "center",
    alignItems: "center",
  },
  removeButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  purchaseButton: {
    backgroundColor: Colors.dark.accent,
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  purchaseButtonLoading: {
    opacity: 0.7,
  },
  purchaseButtonContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  purchaseButtonText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },
  purchaseButtonSubtext: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    opacity: 0.9,
  },
});
