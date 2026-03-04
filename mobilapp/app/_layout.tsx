import * as NavigationBar from 'expo-navigation-bar';
import { Slot, router, usePathname } from 'expo-router';
import { useEffect, useRef } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Colors } from '../constants/theme';
import { ScrollContext } from '../context/ScrollContext';


const NAV_HEIGHT = 64;
const TOGGLE_DISTANCE = 20;


export default function RootLayout() {
  const pathname = usePathname();
  const navAnim = useRef(new Animated.Value(0)).current;

  const lastY = useRef(0);
  const accumulated = useRef(0);
  const hidden = useRef(false);

  function handleScroll(rawY: number) {
    // iOS can go negative when bouncing
    const y = Math.max(0, rawY);

    const delta = y - lastY.current;
    lastY.current = y;

    // Accumulate movement in same direction
    accumulated.current += delta;

    // Reset accumulation if direction flips
    if (
      (delta > 0 && accumulated.current < 0) ||
      (delta < 0 && accumulated.current > 0)
    ) {
      accumulated.current = delta;
    }

    // Not enough movement yet
    if (Math.abs(accumulated.current) < TOGGLE_DISTANCE) return;

    const shouldHide = accumulated.current > 0;

    if (shouldHide === hidden.current) return;

    hidden.current = shouldHide;
    accumulated.current = 0;

    Animated.timing(navAnim, {
      toValue: shouldHide ? NAV_HEIGHT : 0,
      duration: 160,
      useNativeDriver: true,
    }).start();
  };

  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setVisibilityAsync('hidden');
      NavigationBar.setBehaviorAsync('overlay-swipe');
    }
  }, []);

  return (
    <ScrollContext.Provider value={{ handleScroll }}>
      <View style={styles.root}>
        {/* Content */}
        <View style={[styles.content, { paddingBottom: 0 }]} >
          <Slot />
        </View>

        {/* Navbar */}
        <Animated.View style={[styles.navbar,
    {
      transform: [
        {
          translateY: navAnim,
        },
      ],
    },
    ]}>
          <Pressable
            onPress={() => router.push('/')}
            style={[
              styles.navItem,
              pathname === '/' && styles.active,
            ]}
          >
            <Text style={styles.navText}>Főoldal</Text>
          </Pressable>

          <Pressable
            onPress={() => router.push('/cart')}
            style={[
              styles.navItem,
              pathname === '/cart' && styles.active,
            ]}
          >
            <Text style={styles.navText}>Kosár</Text>
          </Pressable>

          <Pressable
            onPress={() => router.push('/profile')}
            style={[
              styles.navItem,
              pathname === '/profile' && styles.active,
            ]}
          >
            <Text style={styles.navText}>Profil</Text>
          </Pressable>
        </Animated.View>
      </View>
    </ScrollContext.Provider>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },

  content: {
    flex: 1,
  },

  navbar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: NAV_HEIGHT,

    flexDirection: 'row',
    backgroundColor: Colors.dark.cardBg,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },

  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  navText: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
  },

  active: {
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
});
