/** Camera and GPS, behind small helpers that never throw at the screens. */

import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { Alert } from "react-native";

async function cameraAllowed(): Promise<boolean> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) {
    Alert.alert("Camera needed", "Allow camera access in Settings to capture site photos.");
    return false;
  }
  return true;
}

/** Opens the camera; resolves to the photo's local URI, or undefined if cancelled. */
export async function takePhoto(): Promise<string | undefined> {
  try {
    if (!(await cameraAllowed())) return undefined;
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 0.6, exif: true });
    return result.canceled ? undefined : result.assets[0]?.uri;
  } catch {
    Alert.alert("Camera unavailable", "Could not open the camera on this device.");
    return undefined;
  }
}

/** Records a walk-around video, up to 60 seconds. */
export async function recordVideo(): Promise<{ uri: string; seconds: number } | undefined> {
  try {
    if (!(await cameraAllowed())) return undefined;
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ["videos"], videoMaxDuration: 60, quality: 0.5 });
    if (result.canceled || !result.assets[0]) return undefined;
    return { uri: result.assets[0].uri, seconds: Math.round((result.assets[0].duration ?? 0) / 1000) };
  } catch {
    Alert.alert("Camera unavailable", "Could not record video on this device.");
    return undefined;
  }
}

export interface Fix {
  readonly lat: number;
  readonly lng: number;
  /** Metres. */
  readonly accuracy?: number;
}

/** The phone's position, or undefined if location is off or refused. */
export async function currentPosition(): Promise<Fix | undefined> {
  try {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) return undefined;
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    return { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy ?? undefined };
  } catch {
    return undefined;
  }
}

/** Straight-line distance in metres. */
export function distanceM(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
