import AsyncStorage from "@react-native-async-storage/async-storage";

export async function setData(key: string, value: any) {
  const data =
    typeof value === "string" ? value : JSON.stringify(value);

  return AsyncStorage.setItem(key, data);
}

export async function getData<T = any>(key: string): Promise<T | null> {
  const value = await AsyncStorage.getItem(key);

  if (value == null) return null;

  try {
    return JSON.parse(value) as T;
  } catch {
    return value as T;
  }
}

export async function removeData(key: string) {
  return AsyncStorage.removeItem(key);
}

export async function clearData() {
  return AsyncStorage.clear();
}
