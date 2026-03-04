import { Colors } from "@/constants/theme";
import { getData, setData } from "@/context/StorageContext";
import { ProfileData } from "@/types/types";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Linking,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LoginModal() {
  const [visible, setVisible] = useState(false);
  const [showOpenBtn, setShowOpenBtn] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [userId, setUserId] = useState(null as string | null);
  const [profileData, setProfileData] = useState<ProfileData | any>(null);
  const [loading, setLoading] = useState(false);

  // ✅ NEW – register modal + fields
  const [registerVisible, setRegisterVisible] = useState(false);
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regCity, setRegCity] = useState("");
  const [regPassword, setRegPassword] = useState("");

  // Fetch profile data when userId changes
  useEffect(() => {
    if (userId) {
      fetchProfileData();
    }
  }, [userId]);

  async function fetchProfileData() {
    if (!userId) return;
    try {
      const res = await fetch(`https://hangszercsere.hu/api/users/${userId}`);
      const data = await res.json();
      setProfileData(data);
    } catch (err) {
      console.error("Profile fetch error:", err);
    }
  }

  async function handleLogin() {
    setLoading(true);
    try {
      const res = await fetch("https://hangszercsere.hu/api/users/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: username,
          password: password,
        }),
      });
      if (!res.ok) throw new Error("Login failed");

      const setCookie = res.headers.get("set-cookie");
      let cookie = "";
      if (setCookie) {
        cookie = setCookie.split(";")[0];
        await setData("cookie", cookie);
      }

      const loginData = await res.json();

      await setData("userId", loginData.id.toString());
      await setData("loginData", JSON.stringify(loginData));

      setUserId(loginData.id.toString());
      setLoggedIn(true);
      closeModal();
    } catch (err) {
      console.error(err);
      Alert.alert("Hiba", "Bejelentkezés sikertelen!");
    } finally {
      setLoading(false);
    }
  }

  // ✅ NEW – real registration handler
  async function handleRegisterSubmit() {
    setLoading(true);
    try {
      const res = await fetch("https://hangszercsere.hu/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: 0,
          name: regName,
          email: regEmail,
          location: regCity,
          password: regPassword,
        }),
      });

      if (!res.ok) throw new Error("Register failed");

      Alert.alert(
        "Sikeres regisztráció",
        "A megadott email címre küldtünk egy megerősítő levelet."
      );

      setRegisterVisible(false);
      setRegName("");
      setRegEmail("");
      setRegCity("");
      setRegPassword("");
    } catch (err) {
      console.error(err);
      Alert.alert("Hiba", "A regisztráció sikertelen!");
    } finally {
      setLoading(false);
    }
  }

  // Check login status on mount
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    checkLoginStatus();
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

  const openModal = () => {
    setShowOpenBtn(false);
    setVisible(true);
  };

  const closeModal = () => {
    setVisible(false);
    setTimeout(() => setShowOpenBtn(true), 300);
  };

  // ✅ NEW – register modal open/close
  const openRegisterModal = () => {
    setRegisterVisible(true);
  };

  const closeRegisterModal = () => {
    setRegisterVisible(false);
  };

  if (loggedIn && profileData) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.profileCard}>
            {profileData.profile_url && (
              <Image
                source={{
                  uri: `https://hangszercsere.hu/uploads/${profileData.profile_url}`,
                }}
                style={styles.profileImage}
              />
            )}

            <Text style={styles.profileName}>{profileData.name}</Text>
            {profileData.bio && (
              <Text style={styles.profileBio}>{profileData.bio}</Text>
            )}
            {profileData.location && (
              <Text style={styles.profileLocation}>
                {profileData.location}
              </Text>
            )}

            <Text style={styles.profileStats}>
              Hirdetések: {profileData.total_listings} | Értékelések:{" "}
              {profileData.rating_count}
            </Text>

            <Text style={styles.profileDate}>
              Csatlakozás:{" "}
              {new Date(profileData.join_date).toLocaleDateString("hu-HU")}
            </Text>

            <Pressable
              style={styles.logoutBtn}
              onPress={async () => {
                await setData("cookie", "");
                await setData("userId", "");
                await setData("loginData", "");
                setLoggedIn(false);
                setProfileData(null);
                setUserId(null);
              }}
            >
              <Text style={styles.logoutText}>Kijelentkezés</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Hero Section */}
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Üdvözlünk!</Text>
          <Text style={styles.heroSubtitle}>
            Jelentkezz be vagy regisztrálj a vásárláshoz
          </Text>
        </View>

        {/* CTA Buttons */}
        <View style={styles.buttonContainer}>
          <Pressable style={styles.primaryBtn} onPress={openModal}>
            <Text style={styles.primaryBtnText}>Bejelentkezés</Text>
          </Pressable>
          <Pressable style={styles.secondaryBtn} onPress={openRegisterModal}>
            <Text style={styles.secondaryBtnText}>Regisztráció</Text>
          </Pressable>
        </View>

        {/* Login modal */}
        <Modal
          visible={visible}
          transparent
          animationType="fade"
          presentationStyle="overFullScreen"
          statusBarTranslucent={true}
          onRequestClose={closeModal}
        >
          <Pressable style={styles.overlay} onPress={closeModal}>
            <View style={styles.modal}>
              <Pressable style={styles.closeBtn} onPress={closeModal}>
                <Text style={styles.closeX}>✕</Text>
              </Pressable>

              <Text style={styles.modalTitle}>Bejelentkezés</Text>

              <Text style={styles.label}>Felhasználónév</Text>
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                autoCorrect={false}
                autoCapitalize="none"
                returnKeyType="next"
                blurOnSubmit={false}
                selectTextOnFocus={false}
              />

              <Text style={styles.label}>Jelszó</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCorrect={false}
                autoCapitalize="none"
                returnKeyType="done"
                blurOnSubmit={false}
                selectTextOnFocus={false}
              />

              <Pressable
                style={[styles.loginBtn, loading && styles.loadingBtn]}
                onPress={handleLogin}
                disabled={loading}
              >
                <Text style={styles.btnText}>
                  {loading ? "Belépés..." : "Belépés"}
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Modal>

        {/* ✅ REGISTER MODAL */}
        <Modal
          visible={registerVisible}
          transparent
          animationType="fade"
          presentationStyle="overFullScreen"
          statusBarTranslucent={true}
          onRequestClose={closeRegisterModal}
        >
          <Pressable style={styles.overlay} onPress={closeRegisterModal}>
            <Pressable style={styles.modal} onPress={() => {}}>
              <Pressable
                style={styles.closeBtn}
                onPress={closeRegisterModal}
              >
                <Text style={styles.closeX}>✕</Text>
              </Pressable>

              <Text style={styles.modalTitle}>Regisztráció</Text>

              <Text style={styles.label}>Név</Text>
              <TextInput
                style={styles.input}
                value={regName}
                onChangeText={setRegName}
                autoCorrect={false}
                autoCapitalize="none"
              />

              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={regEmail}
                onChangeText={setRegEmail}
                autoCorrect={false}
                autoCapitalize="none"
                keyboardType="email-address"
              />

              <Text style={styles.label}>Város</Text>
              <TextInput
                style={styles.input}
                value={regCity}
                onChangeText={setRegCity}
                autoCorrect={false}
              />

              <Text style={styles.label}>Jelszó</Text>
              <TextInput
                style={styles.input}
                value={regPassword}
                onChangeText={setRegPassword}
                secureTextEntry
                autoCorrect={false}
                autoCapitalize="none"
              />

              <Text
                style={{
                  marginTop: 14,
                  fontSize: 12,
                  color: Colors.dark.textSecondary,
                  textAlign: "center",
                }}
              >
                A regisztrációval elfogadod az{" "}
                <Text
                  style={{ textDecorationLine: "underline" }}
                  onPress={() =>
                    Linking.openURL("https://hangszercsere.hu/aszf")
                  }
                >
                  ÁSZF-et
                </Text>{" "}
                és az{" "}
                <Text
                  style={{ textDecorationLine: "underline" }}
                  onPress={() =>
                    Linking.openURL(
                      "https://hangszercsere.hu/adatvedelem"
                    )
                  }
                >
                  Adatvédelmi tájékoztatót
                </Text>
                .
              </Text>

              <Pressable
                style={[styles.loginBtn, loading && styles.loadingBtn]}
                onPress={handleRegisterSubmit}
                disabled={loading}
              >
                <Text style={styles.btnText}>
                  {loading ? "Regisztráció..." : "Regisztráció"}
                </Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
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
  buttonContainer: {
    gap: 16,
  },
  primaryBtn: {
    backgroundColor: Colors.dark.accent,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  primaryBtnText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  secondaryBtn: {
    backgroundColor: "transparent",
    paddingVertical: 18,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.dark.accent,
    alignItems: "center",
  },
  secondaryBtnText: {
    color: Colors.dark.accent,
    fontSize: 18,
    fontWeight: "700",
  },

  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modal: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: Colors.dark.cardBg,
    borderRadius: 20,
    padding: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 12,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.dark.textPrimary,
    textAlign: "center",
    marginBottom: 8,
  },
  label: {
    marginTop: 20,
    marginBottom: 8,
    fontWeight: "600",
    color: Colors.dark.textPrimary,
    fontSize: 14,
  },
  input: {
    borderWidth: 2,
    borderColor: Colors.dark.accent + "40",
    borderRadius: 12,
    padding: 16,
    color: Colors.dark.textPrimary,
    backgroundColor: Colors.dark.cardBg + "CC",
    fontSize: 16,
  },
  loginBtn: {
    marginTop: 24,
    backgroundColor: Colors.dark.accent,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  loadingBtn: {
    opacity: 0.8,
  },
  btnText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  closeBtn: {
    position: "absolute",
    right: 16,
    top: 16,
    padding: 8,
  },
  closeX: {
    fontSize: 20,
    color: Colors.dark.textSecondary,
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.dark.textPrimary,
    marginBottom: 24,
    textAlign: "center",
  },
  profileCard: {
    backgroundColor: Colors.dark.cardBg,
    padding: 28,
    borderRadius: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  profileImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginBottom: 16,
    borderWidth: 3,
    borderColor: Colors.dark.accent + "20",
  },
  profileName: {
    fontSize: 26,
    fontWeight: "700",
    color: Colors.dark.textPrimary,
    marginBottom: 12,
    textAlign: "center",
  },
  profileBio: {
    fontSize: 16,
    color: Colors.dark.textPrimary,
    textAlign: "center",
    marginBottom: 12,
    paddingHorizontal: 24,
    lineHeight: 22,
  },
  profileLocation: {
    fontSize: 16,
    color: Colors.dark.textSecondary,
    marginBottom: 16,
  },
  profileStats: {
    fontSize: 15,
    color: Colors.dark.textPrimary,
    marginBottom: 12,
    textAlign: "center",
  },
  profileDate: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    marginBottom: 24,
  },
  logoutBtn: {
    backgroundColor: "#ff4444",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: "center",
    width: "100%",
  },
  logoutText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
});
