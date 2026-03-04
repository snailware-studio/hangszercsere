import { Colors } from "@/constants/theme";
import { ProfileData } from "@/types/types";
import React, { useEffect, useState } from "react";
import {
  Image,
  StyleSheet,
  Text,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useLocalSearchParams } from 'expo-router';

export default function ProfileView() {
  const { id } = useLocalSearchParams<{ id: string }>();
  // id.split('-')[1]

  const [profileData, setProfileData] = useState<ProfileData | any>();
  const [loading, setLoading] = useState(false);


  // Fetch profile data when userId changes
  useEffect(() => {
    // things to run at start, like ngOnInit in angular
    fetchProfileData();
  }, []);

  async function fetchProfileData() {
    if (!id.split('-')[1]) return;

    try {
      const res = await fetch(`https://hangszercsere.hu/api/users/${id.split('-')[1]}`);
      const data = await res.json();
      setProfileData(data);
    } catch (err) {
      console.error("Profile fetch error:", err);
    }
  }
  
  if (profileData) {
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

          </View>
        </View>
      </SafeAreaView>
    );
  }
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
